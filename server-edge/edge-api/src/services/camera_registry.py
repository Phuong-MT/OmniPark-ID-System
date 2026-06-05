import asyncio
import hashlib
import json
import logging
from datetime import datetime, timezone
from typing import Awaitable, Callable

from pydantic import ValidationError

from src.models.camera import CameraConfig

logger = logging.getLogger(__name__)

CameraFetcher = Callable[[], Awaitable[list]]


class CameraRegistry:
    def __init__(self, fetcher: CameraFetcher, refresh_interval_seconds: float = 15):
        self._fetcher = fetcher
        self._refresh_interval_seconds = refresh_interval_seconds
        self._cameras: dict[str, CameraConfig] = {}
        self._revision = ""
        self._last_sync_at: datetime | None = None
        self._last_error: str | None = None
        self._lock = asyncio.Lock()

    async def refresh(self) -> bool:
        try:
            raw_cameras = await self._fetcher()
            validated: dict[str, CameraConfig] = {}
            for raw_camera in raw_cameras:
                try:
                    camera = CameraConfig.model_validate(raw_camera)
                    validated[camera.id] = camera
                except ValidationError as error:
                    logger.warning("Ignoring invalid camera config: %s", error)

            payload = [
                camera.model_dump(mode="json")
                for camera in sorted(validated.values(), key=lambda item: item.id)
            ]
            revision = hashlib.sha256(
                json.dumps(payload, sort_keys=True).encode("utf-8")
            ).hexdigest()

            async with self._lock:
                changed = revision != self._revision
                self._cameras = validated
                self._revision = revision
                self._last_sync_at = datetime.now(timezone.utc)
                self._last_error = None

            if changed:
                logger.info("Camera config updated: %s camera(s)", len(validated))
            return changed
        except Exception as error:
            logger.exception("Camera config refresh failed")
            async with self._lock:
                self._last_error = str(error)
            return False

    async def run(self, stop_event: asyncio.Event) -> None:
        while not stop_event.is_set():
            await self.refresh()
            try:
                await asyncio.wait_for(
                    stop_event.wait(), timeout=self._refresh_interval_seconds
                )
            except asyncio.TimeoutError:
                continue

    async def list_cameras(self) -> list[dict]:
        async with self._lock:
            return [
                camera.model_dump(mode="json")
                for camera in sorted(self._cameras.values(), key=lambda item: item.id)
            ]

    async def status(self) -> dict:
        async with self._lock:
            return {
                "configured_cameras": len(self._cameras),
                "revision": self._revision,
                "last_sync_at": (
                    self._last_sync_at.isoformat() if self._last_sync_at else None
                ),
                "last_error": self._last_error,
            }
