import asyncio
import logging
import os
import time

import cv2
import httpx

from src.stream.consumer import StreamConsumer

logger = logging.getLogger(__name__)

EDGE_API_URL = os.getenv("EDGE_API_URL", "http://edge-api:8000")


async def process_camera_stream(camera, engine, dispatcher, frame_interval):
    camera_id = camera["id"]
    url = camera["url"]
    direction = camera.get("direction", "BOTH")
    logger.info("Starting stream processing for camera %s", camera_id)

    stream = StreamConsumer(url)
    reconnect_delay = float(os.getenv("STREAM_RECONNECT_DELAY_SECONDS", "3"))
    current_status = None

    async def update_status(status_str: str, error_msg: str | None = None):
        nonlocal current_status
        if current_status == status_str:
            return
        current_status = status_str
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                await client.post(
                    f"{EDGE_API_URL}/cameras/{camera_id}/status",
                    json={"status": status_str, "error_message": error_msg}
                )
                logger.info("[%s] Camera status updated to %s", camera_id, status_str)
        except Exception as e:
            logger.warning("[%s] Failed to send status update to edge-api: %s", camera_id, e)

    await update_status("CONNECTING")

    try:
        while True:
            start_time = time.monotonic()
            frame = await asyncio.to_thread(stream.read_frame)

            if frame is None:
                if not stream.is_connected():
                    logger.warning("[%s] Stream disconnected. Reconnecting in %s seconds...", camera_id, reconnect_delay)
                    await update_status("DISCONNECTED", "Stream connection failed or timed out")
                    await asyncio.sleep(reconnect_delay)
                    continue
            else:
                await update_status("CONNECTED")
                if os.getenv("DEBUG_MODE", "false").lower() == "true":
                    cv2.imshow(f"Test - {camera_id}", frame)
                    if cv2.waitKey(1) & 0xFF == 27:
                        break

                # Support both async and sync inference engines dynamically
                if asyncio.iscoroutinefunction(engine.infer):
                    vehicles = await engine.infer(frame)
                else:
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
        await update_status("OFFLINE")
        stream.close()
        if os.getenv("DEBUG_MODE", "false").lower() == "true":
            cv2.destroyWindow(f"Test - {camera_id}")
