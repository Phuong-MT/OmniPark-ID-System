import asyncio
import logging
import os
from time import monotonic

from src.services.backend_client import publish_camera_status

logger = logging.getLogger(__name__)

STREAM_OPEN_TIMEOUT_MS = int(os.getenv("STREAM_OPEN_TIMEOUT_MS", "5000"))
STREAM_READ_TIMEOUT_MS = int(os.getenv("STREAM_READ_TIMEOUT_MS", "5000"))
STREAM_PROBE_TIMEOUT_SECONDS = float(
    os.getenv(
        "STREAM_PROBE_TIMEOUT_SECONDS",
        str((STREAM_OPEN_TIMEOUT_MS + STREAM_READ_TIMEOUT_MS) / 1000 + 2),
    )
)
STREAM_MONITOR_INTERVAL_SECONDS = float(
    os.getenv("STREAM_MONITOR_INTERVAL_SECONDS", "15")
)
MAX_MONITORED_CAMERAS = int(os.getenv("MAX_MONITORED_CAMERAS", "10"))


def probe_stream_details(url: str) -> dict:
    started_at = monotonic()
    try:
        import cv2
    except ImportError:
        return {
            "connected": False,
            "error": "OpenCV is not installed; stream probing is unavailable",
            "elapsed_ms": round((monotonic() - started_at) * 1000),
        }

    capture = cv2.VideoCapture()
    try:
        params = []
        if hasattr(cv2, "CAP_PROP_OPEN_TIMEOUT_MSEC"):
            params.extend([cv2.CAP_PROP_OPEN_TIMEOUT_MSEC, STREAM_OPEN_TIMEOUT_MS])
        if hasattr(cv2, "CAP_PROP_READ_TIMEOUT_MSEC"):
            params.extend([cv2.CAP_PROP_READ_TIMEOUT_MSEC, STREAM_READ_TIMEOUT_MS])
        opened = (
            capture.open(url, cv2.CAP_FFMPEG, params)
            if params and hasattr(cv2, "CAP_FFMPEG")
            else capture.open(url)
        )
        if not opened:
            return {
                "connected": False,
                "error": "Unable to open stream",
                "elapsed_ms": round((monotonic() - started_at) * 1000),
            }
        success, frame = capture.read()
        if not success or frame is None or frame.size == 0:
            return {
                "connected": False,
                "error": "Stream opened but no valid frame was received",
                "elapsed_ms": round((monotonic() - started_at) * 1000),
            }
        return {
            "connected": True,
            "error": None,
            "elapsed_ms": round((monotonic() - started_at) * 1000),
            "width": int(frame.shape[1]),
            "height": int(frame.shape[0]),
        }
    except Exception as error:
        return {
            "connected": False,
            "error": str(error),
            "elapsed_ms": round((monotonic() - started_at) * 1000),
        }
    finally:
        capture.release()


def probe_stream(url: str) -> tuple[bool, str | None]:
    result = probe_stream_details(url)
    return result["connected"], result["error"]


async def probe_stream_async(url: str) -> dict:
    try:
        return await asyncio.wait_for(
            asyncio.to_thread(probe_stream_details, url),
            timeout=STREAM_PROBE_TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError:
        return {
            "connected": False,
            "error": f"Stream probe timed out after {STREAM_PROBE_TIMEOUT_SECONDS:g} seconds",
            "elapsed_ms": round(STREAM_PROBE_TIMEOUT_SECONDS * 1000),
        }


class StreamMonitor:
    def __init__(self, camera_registry):
        self.camera_registry = camera_registry

    async def check_camera(self, camera: dict) -> None:
        camera_id = camera["id"]
        url = camera.get("url")
        if not url:
            return
        await self.camera_registry.update_camera_status(camera_id, "CONNECTING")
        try:
            await publish_camera_status(camera_id, "CONNECTING")
        except Exception:
            logger.exception("Failed forwarding connecting status for camera %s", camera_id)

        result = await probe_stream_async(url)
        connected, error = result["connected"], result["error"]
        status = "CONNECTED" if connected else "DISCONNECTED"
        await self.camera_registry.update_camera_status(camera_id, status, error)
        try:
            await publish_camera_status(camera_id, status, error)
        except Exception:
            logger.exception("Failed forwarding status for camera %s", camera_id)

    async def run_once(self) -> None:
        cameras = (await self.camera_registry.list_cameras())[:MAX_MONITORED_CAMERAS]
        await asyncio.gather(
            *(self.check_camera(camera) for camera in cameras),
            return_exceptions=True,
        )

    async def run(self, stop_event: asyncio.Event) -> None:
        while not stop_event.is_set():
            await self.run_once()
            try:
                await asyncio.wait_for(
                    stop_event.wait(), timeout=STREAM_MONITOR_INTERVAL_SECONDS
                )
            except asyncio.TimeoutError:
                continue
