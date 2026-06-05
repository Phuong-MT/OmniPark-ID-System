import asyncio
import logging
import os
import time

import cv2

from src.stream.consumer import StreamConsumer

logger = logging.getLogger(__name__)


async def process_camera_stream(camera, engine, dispatcher, frame_interval):
    camera_id = camera["id"]
    url = camera["url"]
    direction = camera.get("direction", "BOTH")
    logger.info("Starting stream processing for camera %s", camera_id)

    stream = StreamConsumer(url)

    try:
        while True:
            start_time = time.monotonic()
            frame = await asyncio.to_thread(stream.read_frame)

            if frame is not None:
                if os.getenv("DEBUG_MODE", "false").lower() == "true":
                    cv2.imshow(f"Test - {camera_id}", frame)
                    if cv2.waitKey(1) & 0xFF == 27:
                        break

                vehicles = await asyncio.to_thread(engine.infer, frame)
                for vehicle in vehicles:
                    plate = vehicle.get("plate")
                    if plate and plate.get("text"):
                        logger.info(
                            "[%s] Detected %s with plate: %s",
                            camera_id,
                            vehicle["label"],
                            plate["text"],
                        )
                        await dispatcher.dispatch_plate_event(
                            camera_id=camera_id,
                            plate_text=plate["text"],
                            confidence=plate["conf"],
                            bbox=plate["bbox"],
                            direction=direction,
                        )

            sleep_time = frame_interval - (time.monotonic() - start_time)
            await asyncio.sleep(max(sleep_time, 0.001))
    except asyncio.CancelledError:
        logger.info("Camera worker %s cancelled", camera_id)
        raise
    except Exception:
        logger.exception("Camera worker %s failed", camera_id)
    finally:
        stream.close()
        if os.getenv("DEBUG_MODE", "false").lower() == "true":
            cv2.destroyWindow(f"Test - {camera_id}")
