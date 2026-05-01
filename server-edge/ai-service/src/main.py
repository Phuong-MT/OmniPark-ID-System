import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import time
import asyncio
import logging
import cv2

from src.stream.consumer import StreamConsumer
from src.engine.yolo_pipeline import YoloPipelineEngine
from src.events.dispatcher import EventDispatcher

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

RTSP_URL = os.getenv("MEDIAMTX_RTSP_URL", "0")
CAMERA_ID = os.getenv("CAMERA_ID", "cam_01")
TARGET_FPS = int(os.getenv("TARGET_FPS", "5"))

async def main():
    logger.info("Starting AI Inference Service")
    
    stream = StreamConsumer(RTSP_URL)
    engine = YoloPipelineEngine()
    
    # Load YOLO pipeline models
    engine.load_models(
        vehicle_model_path="yolov8n.pt",
        plate_model_path="license-plate-finetune-v1n.pt"
    )
    
    dispatcher = EventDispatcher()

    frame_interval = 1.0 / TARGET_FPS
    
    try:
        while True:
            start_time = time.time()
            
            frame = stream.read_frame()
            if frame is not None:
                # Show the frame for testing
                cv2.imshow("Edge Server Test - Local Webcam", frame)
                if cv2.waitKey(1) & 0xFF == 27: # ESC key to exit
                    logger.info("ESC pressed, shutting down...")
                    break
                
                # Run pipeline inference
                vehicles = engine.infer(frame)
                # logger.info(f"Detected {len(vehicles)} vehicles")
                # Process detections
                for vehicle in vehicles:
                    # logger.info(f"Vehicle: {vehicle}")
                    plate = vehicle.get("plate")
                    if plate and plate.get("text"):
                        logger.info(f"Detected {vehicle['label']} with plate: {plate['text']}")
                        # Dispatch event asynchronously
                        asyncio.create_task(
                            dispatcher.dispatch_plate_event(
                                camera_id=CAMERA_ID,
                                plate_text=plate["text"],
                                confidence=plate["conf"],
                                bbox=plate["bbox"]
                            )
                        )

            # Control framerate (downsampling)
            elapsed = time.time() - start_time
            sleep_time = frame_interval - elapsed
            if sleep_time > 0:
                await asyncio.sleep(sleep_time)
            else:
                # Yield control to event loop even if we are behind
                await asyncio.sleep(0.001)

    except KeyboardInterrupt:
        logger.info("Shutting down AI Service")
    finally:
        stream.close()
        cv2.destroyAllWindows()
        await dispatcher.close()

if __name__ == "__main__":
    asyncio.run(main())
