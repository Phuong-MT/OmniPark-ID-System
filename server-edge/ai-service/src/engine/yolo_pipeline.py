import logging
import numpy as np

try:
    from ultralytics import YOLO
except ImportError:
    YOLO = None

try:
    import easyocr
except ImportError:
    easyocr = None

from src.engine.base import InferenceEngine

logger = logging.getLogger(__name__)

class YoloPipelineEngine(InferenceEngine):
    def __init__(self):
        self.vehicle_model = None
        self.plate_model = None
        self.ocr_reader = None
        # COCO vehicle classes: car, motorcycle, bus, truck
        self.vehicle_classes = [2, 3, 5, 7]

    def load_models(self, vehicle_model_path: str, plate_model_path: str):
        if YOLO is None:
            logger.error("ultralytics package is not installed. Run: pip install ultralytics")
            return
            
        try:
            # Load the general object detection model (YOLOv8n)
            self.vehicle_model = YOLO(vehicle_model_path)
            logger.info(f"Loaded vehicle model from {vehicle_model_path}")
            
            # Load the specialized license plate model
            self.plate_model = YOLO(plate_model_path)
            logger.info(f"Loaded plate model from {plate_model_path}")
            
            if easyocr is not None:
                # Initialize EasyOCR for English (which handles standard alphanumeric plates well)
                # gpu=False by default for Edge devices without discrete GPUs, can be enabled if MPS/CUDA is available
                logger.info("Initializing EasyOCR reader (this might take a moment)...")
                self.ocr_reader = easyocr.Reader(['en'], gpu=False)
                logger.info("EasyOCR loaded successfully")
            else:
                logger.error("easyocr package is not installed. Run: pip install easyocr")

        except Exception as e:
            logger.error(f"Failed to load AI models: {str(e)}")

    def infer(self, frame: np.ndarray) -> list[dict]:
        if not self.vehicle_model or not self.plate_model:
            return []

        # 1. Detect Vehicles
        results_vehicle = self.vehicle_model(frame, verbose=False)[0]
        vehicles = []
        for box in results_vehicle.boxes:
            cls_id = int(box.cls[0])
            if cls_id in self.vehicle_classes:
                vehicles.append({
                    "label": results_vehicle.names[cls_id],
                    "confidence": float(box.conf[0]),
                    "bbox": box.xyxy[0].tolist(),
                    "plate": None
                })

        # 2. Detect Plates and OCR Characters
        results_plate = self.plate_model(frame, verbose=False)[0]
        plates = []
        characters = []
        
        for box in results_plate.boxes:
            cls_id = int(box.cls[0])
            label = str(results_plate.names[cls_id])
            confidence = float(box.conf[0])
            bbox = box.xyxy[0].tolist()
            
            # Heuristic to separate Plate Bounding Boxes from OCR Character Boxes (if any exist)
            if len(label) <= 2 and label.upper() not in ['PL', 'LP']:
                characters.append({"label": label, "bbox": bbox, "conf": confidence})
            else:
                plates.append({"label": label, "bbox": bbox, "conf": confidence})
                
        #Run EasyOCR
        for plate in plates:
            plate_box = plate["bbox"]
            plate_text = ""
            
            if self.ocr_reader is not None:
                # Extract coordinates
                x1, y1, x2, y2 = map(int, plate_box)
                
                # Add padding to the crop (helps OCR)
                pad_x = int((x2 - x1) * 0.05)
                pad_y = int((y2 - y1) * 0.05)
                
                # Ensure we don't go out of frame bounds
                x1 = max(0, x1 - pad_x)
                y1 = max(0, y1 - pad_y)
                x2 = min(frame.shape[1], x2 + pad_x)
                y2 = min(frame.shape[0], y2 + pad_y)
                
                if x2 > x1 and y2 > y1:
                    plate_crop = frame[y1:y2, x1:x2]
                    
                    # Run EasyOCR
                    ocr_results = self.ocr_reader.readtext(plate_crop, detail=0)
                    
                    # Combine all text found in the plate crop
                    plate_text = "".join(ocr_results).replace(" ", "").replace("-", "").replace(".", "").upper()
            
            # Fallback if EasyOCR failed or didn't find anything
            if not plate_text and plate["label"].lower() not in ["plate", "license_plate", "license plate", "bien_so"]:
                plate_text = plate["label"]
                
            plate["text"] = plate_text

        # 3. Match Plates to Vehicles using spatial containment
        for plate in plates:
            best_vehicle = None
            max_containment = 0
            plate_box = plate["bbox"]
            plate_area = (plate_box[2] - plate_box[0]) * (plate_box[3] - plate_box[1])
            
            for v in vehicles:
                v_box = v["bbox"]
                # Calculate Intersection Area
                x1 = max(plate_box[0], v_box[0])
                y1 = max(plate_box[1], v_box[1])
                x2 = min(plate_box[2], v_box[2])
                y2 = min(plate_box[3], v_box[3])
                
                inter_area = max(0, x2 - x1) * max(0, y2 - y1)
                containment = inter_area / plate_area if plate_area > 0 else 0
                
                if containment > max_containment and containment > 0.5: # Over 50% inside vehicle
                    max_containment = containment
                    best_vehicle = v
            
            if best_vehicle:
                best_vehicle["plate"] = plate
            else:
                # If plate was found but no vehicle detected around it, keep it anyway
                vehicles.append({
                    "label": "unknown_vehicle",
                    "confidence": 0.0,
                    "bbox": plate_box,
                    "plate": plate
                })

        return vehicles
