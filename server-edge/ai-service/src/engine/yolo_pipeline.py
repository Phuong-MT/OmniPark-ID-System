import logging
import re
import cv2
import numpy as np

try:
    from ultralytics import YOLO
except ImportError:
    YOLO = None

try:
    import easyocr
except ImportError:
    easyocr = None

from engine.base import InferenceEngine

logger = logging.getLogger(__name__)

# Confidence threshold for plate detection — plates below this are discarded
PLATE_CONF_THRESHOLD = 0.4


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

            # Load the specialized license plate model (single class: License_Plate)
            self.plate_model = YOLO(plate_model_path)
            logger.info(f"Loaded plate model from {plate_model_path}")

            if easyocr is not None:
                # Initialize EasyOCR for English (handles standard alphanumeric plates well)
                # gpu=False by default for Edge devices without discrete GPUs
                logger.info("Initializing EasyOCR reader (this might take a moment)...")
                self.ocr_reader = easyocr.Reader(['en'], gpu=False)
                logger.info("EasyOCR loaded successfully")
            else:
                logger.error("easyocr package is not installed. Run: pip install easyocr")

        except Exception as e:
            logger.error(f"Failed to load AI models: {str(e)}")

    # ── Image Preprocessing ──────────────────────────────────────────────

    def _preprocess_plate_crop(self, crop: np.ndarray) -> np.ndarray:
        """
        Enhance a license plate crop for better OCR accuracy.
        - Scale up small images (width < 300px)
        - Convert to grayscale
        - Apply CLAHE contrast enhancement
        - Subtle Gaussian blur to reduce noise
        """
        h, w = crop.shape[:2]

        # Scale up if too small — OCR struggles with tiny images
        if w < 300:
            scale = 300.0 / w
            crop = cv2.resize(crop, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)

        # Grayscale + CLAHE contrast enhancement
        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)

        # Subtle blur to reduce sensor/compression noise
        enhanced = cv2.GaussianBlur(enhanced, (3, 3), 0)
        return enhanced

    # ── OCR with Aspect Ratio Sorting ────────────────────────────────────

    def _read_plate_text(self, frame: np.ndarray, plate_bbox: list[float]) -> str:
        """
        Crop the plate region, preprocess, run EasyOCR with detail=1,
        filter noise, sort text blocks by aspect ratio (1-row vs 2-row),
        and return cleaned text.
        """
        if self.ocr_reader is None:
            return ""

        # 1. Crop with padding
        x1, y1, x2, y2 = map(int, plate_bbox)
        pad_x = int((x2 - x1) * 0.05)
        pad_y = int((y2 - y1) * 0.10)
        x1 = max(0, x1 - pad_x)
        y1 = max(0, y1 - pad_y)
        x2 = min(frame.shape[1], x2 + pad_x)
        y2 = min(frame.shape[0], y2 + pad_y)

        if x2 <= x1 or y2 <= y1:
            return ""

        crop = frame[y1:y2, x1:x2]

        # 2. Preprocess
        processed = self._preprocess_plate_crop(crop)

        # 3. EasyOCR with detail=1 → list of (bbox, text, conf)
        try:
            ocr_results = self.ocr_reader.readtext(processed, detail=1)
        except Exception as e:
            logger.warning(f"EasyOCR failed: {e}")
            return ""

        if not ocr_results:
            return ""

        # 4. Filter noise: remove blocks that are too small or too close to borders
        crop_h, crop_w = processed.shape[:2]
        filtered = []
        for (box, text, conf) in ocr_results:
            # box is [[x1,y1],[x2,y1],[x2,y2],[x1,y2]]
            block_h = box[2][1] - box[0][1]
            center_y = (box[0][1] + box[2][1]) / 2.0

            # Skip blocks that are too small (likely screw holes, border artifacts)
            if block_h < crop_h * 0.12:
                continue

            # Skip blocks hugging the very top/bottom edge (plate frame noise)
            if center_y < crop_h * 0.05 or center_y > crop_h * 0.95:
                continue

            # Skip very low confidence detections
            if conf < 0.15:
                continue

            filtered.append((box, text, conf))

        if not filtered:
            return ""

        # 5. Determine plate layout by aspect ratio
        plate_w = x2 - x1
        plate_h = y2 - y1
        aspect = plate_w / plate_h if plate_h > 0 else 999.0

        if aspect > 2.2:
            # ── 1-row plate (long car plate) → sort left to right
            filtered.sort(key=lambda r: r[0][0][0])
            raw = "".join(t for _, t, _ in filtered)
        else:
            # ── 2-row plate (square motorcycle/car plate) → split top/bottom
            mid_y = crop_h / 2.0
            top_row = [r for r in filtered if (r[0][0][1] + r[0][2][1]) / 2.0 < mid_y]
            bot_row = [r for r in filtered if (r[0][0][1] + r[0][2][1]) / 2.0 >= mid_y]

            top_row.sort(key=lambda r: r[0][0][0])
            bot_row.sort(key=lambda r: r[0][0][0])

            raw = "".join(t for _, t, _ in top_row) + "".join(t for _, t, _ in bot_row)

        # 6. Clean non-alphanumeric characters
        cleaned = re.sub(r'[^A-Za-z0-9]', '', raw).upper()
        return cleaned

    # ── Vietnamese Plate Auto-Correction ─────────────────────────────────

    @staticmethod
    def _vn_plate_autocorrect(text: str) -> str:
        """
        Fix common OCR misreadings specific to Vietnamese civilian plates.

        Vietnamese plate format: XX-Y(Y) XXXXX
          - XX   = province code (2 digits, 11-99)
          - Y(Y) = series letter(s) (1-2 uppercase letters)
          - XXXXX = serial number (digits)

        Common confusions: O↔0, I↔1, S↔5, Z↔2, B↔8, G↔6, D↔0
        """
        if len(text) < 7:
            return text

        LETTER_TO_DIGIT = {'O': '0', 'D': '0', 'I': '1', 'L': '1',
                           'Z': '2', 'S': '5', 'B': '8', 'G': '6'}
        DIGIT_TO_LETTER = {'0': 'D', '1': 'I', '2': 'Z', '5': 'S',
                           '8': 'B', '6': 'G'}

        corrected = list(text)

        # First 2 characters must be digits (province code)
        for i in range(min(2, len(corrected))):
            if corrected[i] in LETTER_TO_DIGIT:
                corrected[i] = LETTER_TO_DIGIT[corrected[i]]

        # Character(s) at position 2 (and possibly 3) must be letter(s) (series)
        seri_end = 3
        if len(corrected) > 3 and corrected[3].isalpha():
            seri_end = 4  # 2-letter series like "LD"

        for i in range(2, min(seri_end, len(corrected))):
            if corrected[i] in DIGIT_TO_LETTER:
                corrected[i] = DIGIT_TO_LETTER[corrected[i]]

        # Everything after the series must be digits (serial number)
        for i in range(seri_end, len(corrected)):
            if corrected[i] in LETTER_TO_DIGIT:
                corrected[i] = LETTER_TO_DIGIT[corrected[i]]

        return "".join(corrected)

    # ── Main Inference Pipeline ──────────────────────────────────────────

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

        # 2. Detect License Plates (single-class model: License_Plate)
        results_plate = self.plate_model(frame, verbose=False)[0]
        plates = []
        for box in results_plate.boxes:
            confidence = float(box.conf[0])
            if confidence < PLATE_CONF_THRESHOLD:
                continue
            bbox = box.xyxy[0].tolist()
            plates.append({"bbox": bbox, "conf": confidence})

        # 3. OCR each plate
        for plate in plates:
            raw_text = self._read_plate_text(frame, plate["bbox"])
            plate["text"] = self._vn_plate_autocorrect(raw_text) if raw_text else ""

        # 4. Match Plates to Vehicles using spatial containment
        for plate in plates:
            best_vehicle = None
            max_containment = 0.0
            plate_box = plate["bbox"]
            plate_area = (plate_box[2] - plate_box[0]) * (plate_box[3] - plate_box[1])

            for v in vehicles:
                v_box = v["bbox"]
                # Calculate Intersection Area
                ix1 = max(plate_box[0], v_box[0])
                iy1 = max(plate_box[1], v_box[1])
                ix2 = min(plate_box[2], v_box[2])
                iy2 = min(plate_box[3], v_box[3])

                inter_area = max(0, ix2 - ix1) * max(0, iy2 - iy1)
                containment = inter_area / plate_area if plate_area > 0 else 0

                if containment > max_containment and containment > 0.5:
                    max_containment = containment
                    best_vehicle = v

            if best_vehicle:
                best_vehicle["plate"] = plate
            else:
                # Plate found but no vehicle detected around it — keep it anyway
                vehicles.append({
                    "label": "unknown_vehicle",
                    "confidence": 0.0,
                    "bbox": plate_box,
                    "plate": plate
                })

        return vehicles

    def draw_annotations(self, frame: np.ndarray, predictions: list[dict]) -> np.ndarray:
        """
        Draw bounding boxes, labels, and license plate texts onto the frame.
        """
        annotated = frame.copy()
        
        # Colors: BGR format
        VEHICLE_COLOR = (255, 150, 0)  # Cyan/Orange
        PLATE_COLOR = (0, 0, 255)       # Red
        TEXT_COLOR = (255, 255, 255)    # White

        for v in predictions:
            # 1. Draw vehicle box if label is not unknown
            if v["label"] != "unknown_vehicle" and v["confidence"] > 0:
                v_box = [int(x) for x in v["bbox"]]
                cv2.rectangle(annotated, (v_box[0], v_box[1]), (v_box[2], v_box[3]), VEHICLE_COLOR, 2)
                
                # Draw vehicle label background & text
                label = f"{v['label']} {v['confidence']:.2f}"
                (w, h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
                # Keep text box inside frame boundaries
                text_y = max(v_box[1], h + 5)
                cv2.rectangle(annotated, (v_box[0], text_y - h - 5), (v_box[0] + w, text_y), VEHICLE_COLOR, -1)
                cv2.putText(annotated, label, (v_box[0], text_y - 3), cv2.FONT_HERSHEY_SIMPLEX, 0.5, TEXT_COLOR, 1, cv2.LINE_AA)

            # 2. Draw plate box & OCR text if present
            plate = v.get("plate")
            if plate:
                p_box = [int(x) for x in plate["bbox"]]
                cv2.rectangle(annotated, (p_box[0], p_box[1]), (p_box[2], p_box[3]), PLATE_COLOR, 2)
                
                text = plate.get("text", "")
                if text:
                    label = f"PLATE: {text}"
                    (w, h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
                    # Keep text box inside frame boundaries
                    text_y = max(p_box[1], h + 6)
                    cv2.rectangle(annotated, (p_box[0], text_y - h - 6), (p_box[0] + w, text_y), PLATE_COLOR, -1)
                    cv2.putText(annotated, label, (p_box[0], text_y - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.6, TEXT_COLOR, 2, cv2.LINE_AA)
        
        return annotated
