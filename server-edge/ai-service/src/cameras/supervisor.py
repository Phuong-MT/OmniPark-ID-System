import asyncio
import hashlib
import json
import logging
from typing import Awaitable, Callable

import httpx

logger = logging.getLogger(__name__)

CameraWorkerFactory = Callable[[dict], Awaitable[None]]


class CameraSupervisor:
    def __init__(
        self,
        edge_api_url: str,
        worker_factory: CameraWorkerFactory,
        refresh_interval_seconds: float = 10,
    ):
        self.edge_api_url = edge_api_url.rstrip("/")
        self.worker_factory = worker_factory
        self.refresh_interval_seconds = refresh_interval_seconds
        self._tasks: dict[str, asyncio.Task] = {}
        self._fingerprints: dict[str, str] = {}

    @staticmethod
    def _validate_camera(raw_camera: dict) -> dict | None:
        camera_id = raw_camera.get("id")
        url = raw_camera.get("url")
        if not isinstance(camera_id, str) or not camera_id:
            logger.warning("Ignoring camera without a valid id: %s", raw_camera)
            return None
        if not isinstance(url, str) or not url.startswith(
            ("rtsp://", "http://", "https://")
        ):
            logger.warning("Ignoring camera %s with invalid URL", camera_id)
            return None
        return raw_camera

    @staticmethod
    def _fingerprint(camera: dict) -> str:
        return hashlib.sha256(
            json.dumps(camera, sort_keys=True).encode("utf-8")
        ).hexdigest()

    async def fetch_cameras(self) -> list[dict]:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{self.edge_api_url}/cameras")
            response.raise_for_status()
            payload = response.json()
            if not isinstance(payload, list):
                raise ValueError("edge-api /cameras response must be a list")
            return payload

    async def reconcile(self, cameras: list[dict]) -> None:
        desired: dict[str, dict] = {}
        for raw_camera in cameras:
            camera = self._validate_camera(raw_camera)
            if camera:
                desired[camera["id"]] = camera

        removed_or_changed = [
            camera_id
            for camera_id in self._tasks
            if camera_id not in desired
            or self._fingerprints.get(camera_id)
            != self._fingerprint(desired[camera_id])
            or self._tasks[camera_id].done()
        ]
        for camera_id in removed_or_changed:
            await self._stop_worker(camera_id)

        for camera_id, camera in desired.items():
            if camera_id in self._tasks:
                continue
            logger.info("Starting camera worker %s", camera_id)
            self._fingerprints[camera_id] = self._fingerprint(camera)
            self._tasks[camera_id] = asyncio.create_task(
                self.worker_factory(camera), name=f"camera-{camera_id}"
            )

        logger.info(
            "Camera workers reconciled: %s active, %s configured",
            len(self._tasks),
            len(desired),
        )

    async def _stop_worker(self, camera_id: str) -> None:
        task = self._tasks.pop(camera_id, None)
        self._fingerprints.pop(camera_id, None)
        if not task:
            return
        logger.info("Stopping camera worker %s", camera_id)
        task.cancel()
        await asyncio.gather(task, return_exceptions=True)

    async def run(self, stop_event: asyncio.Event) -> None:
        while not stop_event.is_set():
            try:
                await self.reconcile(await self.fetch_cameras())
            except Exception:
                logger.exception("Failed to reconcile camera workers")

            try:
                await asyncio.wait_for(
                    stop_event.wait(), timeout=self.refresh_interval_seconds
                )
            except asyncio.TimeoutError:
                continue

        await self.stop()

    async def stop(self) -> None:
        for camera_id in list(self._tasks):
            await self._stop_worker(camera_id)
