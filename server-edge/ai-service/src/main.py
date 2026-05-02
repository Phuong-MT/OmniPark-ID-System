import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import time
import asyncio
import logging
import cv2
import httpx

from src.stream.consumer import StreamConsumer
from src.engine.yolo_pipeline import YoloPipelineEngine
from src.events.dispatcher import EventDispatcher

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

TARGET_FPS = int(os.getenv("TARGET_FPS", "5"))

async def process_camera_stream(camera, engine, dispatcher, frame_interval):
    camera_id = camera.get("id")
    url = camera.get("url")
    logger.info(f"Starting stream processing for camera: {camera_id} at {url}")
    
    stream = StreamConsumer(url)
    
    try:
        while True:
            start_time = time.time()
            
            # Use to_thread for blocking cv2/httpx read
            frame = await asyncio.to_thread(stream.read_frame)
            
            if frame is not None:
                # Show frame in debug mode (not recommended for multiple cameras, but kept for legacy)
                if os.getenv("DEBUG_MODE", "false").lower() == "true":
                    cv2.imshow(f"Test - {camera_id}", frame)
                    if cv2.waitKey(1) & 0xFF == 27:
                        break

                # Use to_thread for blocking inference
                vehicles = await asyncio.to_thread(engine.infer, frame)
                
                for vehicle in vehicles:
                    plate = vehicle.get("plate")
                    if plate and plate.get("text"):
                        logger.info(f"[{camera_id}] Detected {vehicle['label']} with plate: {plate['text']}")
                        asyncio.create_task(
                            dispatcher.dispatch_plate_event(
                                camera_id=camera_id,
                                plate_text=plate["text"],
                                confidence=plate["conf"],
                                bbox=plate["bbox"]
                            )
                        )
                        
            elapsed = time.time() - start_time
            sleep_time = frame_interval - elapsed
            if sleep_time > 0:
                await asyncio.sleep(sleep_time)
            else:
                await asyncio.sleep(0.001)

    except asyncio.CancelledError:
        logger.info(f"Task for camera {camera_id} was cancelled")
    except Exception as e:
        logger.error(f"Error processing camera {camera_id}: {str(e)}")
    finally:
        stream.close()
        cv2.destroyAllWindows()

async def main():
    logger.info("Starting AI Inference Service")
    
    edge_api_url = os.getenv("EDGE_API_URL", "http://edge-api:8000")
    cameras = []
    
    async with httpx.AsyncClient() as client:
        while True:
            try:
                logger.info(f"Fetching camera config from {edge_api_url}/cameras")
                response = await client.get(f"{edge_api_url}/cameras", timeout=5.0)
                if response.status_code == 200:
                    cameras = response.json()
                    if cameras:
                        logger.info(f"Received config for {len(cameras)} cameras: {[c.get('id') for c in cameras]}")
                        break
                    else:
                        logger.warning("Received empty camera list. Waiting 5s before retry...")
            except Exception as e:
                logger.warning(f"edge-api not ready or error: {str(e)}. Retrying in 5s...")
            await asyncio.sleep(5)
            
    engine = YoloPipelineEngine()
    engine.load_models(
        vehicle_model_path="yolov8n.pt",
        plate_model_path="license-plate-finetune-v1n.pt"
    )
    
    dispatcher = EventDispatcher()
    frame_interval = 1.0 / TARGET_FPS
    
    tasks = []
    for cam in cameras:
        tasks.append(
            asyncio.create_task(process_camera_stream(cam, engine, dispatcher, frame_interval))
        )
        
    try:
        await asyncio.gather(*tasks)
    except KeyboardInterrupt:
        logger.info("Shutting down AI Service")
    finally:
        for task in tasks:
            task.cancel()
        await dispatcher.close()

if __name__ == "__main__":
    asyncio.run(main())
