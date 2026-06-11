import asyncio
import logging
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.cameras.supervisor import CameraSupervisor
from src.cameras.worker import process_camera_stream
from src.engine.yolo_pipeline import YoloPipelineEngine
from src.engine.batch_engine import AsyncBatchInferenceEngine
from src.events.dispatcher import EventDispatcher

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

TARGET_FPS = int(os.getenv("TARGET_FPS", "5"))
CAMERA_REFRESH_INTERVAL_SECONDS = float(
    os.getenv("CAMERA_REFRESH_INTERVAL_SECONDS", "10")
)
EDGE_API_URL = os.getenv("EDGE_API_URL", "http://edge-api:8000")
VEHICLE_MODEL_PATH = os.getenv("VEHICLE_MODEL_PATH", "yolov8n.pt")
PLATE_MODEL_PATH = os.getenv(
    "PLATE_MODEL_PATH", "license-plate-finetune-v1n.pt"
)


async def main():
    logger.info("Starting AI inference service")

    engine = YoloPipelineEngine()
    engine.load_models(
        vehicle_model_path=VEHICLE_MODEL_PATH,
        plate_model_path=PLATE_MODEL_PATH,
    )

    batch_engine = AsyncBatchInferenceEngine(engine)
    batch_engine.start()

    dispatcher = EventDispatcher()
    stop_event = asyncio.Event()

    async def worker_factory(camera: dict):
        cam_fps = int(camera.get("fps")) if camera.get("fps") is not None else TARGET_FPS
        cam_frame_interval = 1.0 / max(cam_fps, 1)
        await process_camera_stream(camera, batch_engine, dispatcher, cam_frame_interval)

    supervisor = CameraSupervisor(
        edge_api_url=EDGE_API_URL,
        worker_factory=worker_factory,
        refresh_interval_seconds=CAMERA_REFRESH_INTERVAL_SECONDS,
    )

    try:
        await supervisor.run(stop_event)
    except KeyboardInterrupt:
        logger.info("Shutting down AI inference service")
    finally:
        stop_event.set()
        await supervisor.stop()
        await batch_engine.stop()
        await dispatcher.close()


if __name__ == "__main__":
    asyncio.run(main())
