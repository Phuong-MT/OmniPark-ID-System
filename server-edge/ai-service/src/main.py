import os
import sys
import time
import asyncio
import logging
import cv2
import httpx

# Add server-edge/ai-service and server-edge/ai-service/src to Python path for local testing
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, root_dir)
sys.path.insert(0, os.path.join(root_dir, "src"))

from stream.consumer import StreamConsumer
from stream.publisher import StreamPublisher
from engine.yolo_pipeline import YoloPipelineEngine
from events.dispatcher import EventDispatcher

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

TARGET_FPS = int(os.getenv("TARGET_FPS", "5"))

async def process_camera_stream(camera, engine, dispatcher, frame_interval):
    camera_id = camera.get("id")
    url = camera.get("url")
    logger.info(f"Starting stream processing for camera: {camera_id} at {url}")
    
    stream = StreamConsumer(url)
    publisher = None
    
    latest_frame = None
    predictions_state = []
    new_frame_event = asyncio.Event()

    async def stream_writer_loop():
        nonlocal publisher, latest_frame
        try:
            while True:
                # Capture frame (blocking call, use to_thread)
                frame = await asyncio.to_thread(stream.read_frame)
                if frame is None:
                    await asyncio.sleep(0.01)
                    continue
                
                latest_frame = frame
                new_frame_event.set()
                
                # Setup publisher on first frame
                if publisher is None:
                    target_w = int(os.getenv("STREAM_WIDTH", "640"))
                    h, w = frame.shape[:2]
                    if w > target_w:
                        target_h = int(h * (target_w / w))
                        pub_w, pub_h = target_w, target_h
                    else:
                        pub_w, pub_h = w, h

                    base_rtsp_url = os.getenv("MEDIAMTX_RTSP_URL", "rtsp://localhost:8554")
                    publish_url = f"{base_rtsp_url}/detect_{camera_id}"
                    publisher = StreamPublisher(publish_url, pub_w, pub_h, fps=TARGET_FPS)
                    await asyncio.to_thread(publisher.start)
                
                # Draw latest annotations
                annotated_frame = engine.draw_annotations(frame, predictions_state)
                
                # Resize to target stream resolution if needed
                h, w = annotated_frame.shape[:2]
                if w != publisher.width or h != publisher.height:
                    annotated_frame = cv2.resize(annotated_frame, (publisher.width, publisher.height), interpolation=cv2.INTER_AREA)
                
                # Stream the annotated frame
                if publisher:
                    await asyncio.to_thread(publisher.write_frame, annotated_frame)
                
                # Small sleep to yield control
                await asyncio.sleep(0.001)

        except asyncio.CancelledError:
            logger.info(f"Stream writer loop for {camera_id} cancelled")
        except Exception as e:
            logger.error(f"Error in stream writer loop: {str(e)}")

    async def inference_loop():
        nonlocal predictions_state
        try:
            while True:
                # Wait for a new frame
                await new_frame_event.wait()
                new_frame_event.clear()
                
                frame_to_process = latest_frame
                if frame_to_process is None:
                    continue
                
                # Run AI inference (blocking, use to_thread)
                vehicles = await asyncio.to_thread(engine.infer, frame_to_process)
                predictions_state = vehicles
                
                # Dispatch events
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
                
                # Throttle inference loop to prevent maxing CPU
                await asyncio.sleep(frame_interval)

        except asyncio.CancelledError:
            logger.info(f"Inference loop for {camera_id} cancelled")
        except Exception as e:
            logger.error(f"Error in inference loop: {str(e)}")

    writer_task = asyncio.create_task(stream_writer_loop())
    inference_task = asyncio.create_task(inference_loop())
    
    try:
        await asyncio.gather(writer_task, inference_task)
    except asyncio.CancelledError:
        writer_task.cancel()
        inference_task.cancel()
        await asyncio.gather(writer_task, inference_task, return_exceptions=True)
    except Exception as e:
        logger.error(f"Error in process_camera_stream tasks: {str(e)}")
    finally:
        stream.close()
        if publisher:
            await asyncio.to_thread(publisher.close)
        cv2.destroyAllWindows()

async def main():
    logger.info("Starting AI Inference Service")
    
    edge_api_url = os.getenv("EDGE_API_URL", "http://localhost:8000")
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
