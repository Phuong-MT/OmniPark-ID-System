import asyncio
import sys
import unittest
from pathlib import Path
from unittest.mock import AsyncMock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.services.camera_registry import CameraRegistry


class CameraRegistryTests(unittest.IsolatedAsyncioTestCase):
    async def test_refresh_validates_and_tracks_revision(self):
        fetcher = AsyncMock(
            return_value=[
                {
                    "id": "cam-1",
                    "url": "rtsp://camera/stream",
                    "direction": "in",
                },
                {"id": "", "url": "invalid"},
            ]
        )
        registry = CameraRegistry(fetcher, refresh_interval_seconds=0.01)

        changed = await registry.refresh()
        cameras = await registry.list_cameras()
        status = await registry.status()

        self.assertTrue(changed)
        self.assertEqual(
            cameras,
            [
                {
                    "id": "cam-1",
                    "url": "rtsp://camera/stream",
                    "direction": "IN",
                    "parkId": None,
                    "clusterId": None,
                    "type": None,
                    "fps": None,
                    "confidence_threshold": None,
                    "status": {
                        "status": "UNKNOWN",
                        "last_update": None,
                        "error_message": None,
                    },
                }
            ],
        )
        self.assertEqual(status["configured_cameras"], 1)
        self.assertIsNotNone(status["last_sync_at"])
        self.assertIsNone(status["last_error"])

    async def test_failed_refresh_preserves_last_valid_config(self):
        fetcher = AsyncMock(
            return_value=[{"id": "cam-1", "url": "rtsp://camera/stream"}]
        )
        registry = CameraRegistry(fetcher)
        await registry.refresh()
        fetcher.side_effect = RuntimeError("backend unavailable")

        changed = await registry.refresh()
        cameras = await registry.list_cameras()
        status = await registry.status()

        self.assertFalse(changed)
        self.assertEqual(len(cameras), 1)
        self.assertEqual(status["last_error"], "backend unavailable")

    async def test_camera_status_is_merged_and_updated(self):
        fetcher = AsyncMock(
            return_value=[{"id": "cam-1", "url": "rtsp://camera/stream"}]
        )
        registry = CameraRegistry(fetcher)
        await registry.refresh()

        # Check default status
        cameras = await registry.list_cameras()
        self.assertEqual(cameras[0]["status"]["status"], "UNKNOWN")

        # Update status
        await registry.update_camera_status("cam-1", "CONNECTED", "No error")
        cameras = await registry.list_cameras()
        self.assertEqual(cameras[0]["status"]["status"], "CONNECTED")
        self.assertEqual(cameras[0]["status"]["error_message"], "No error")
        self.assertIsNotNone(cameras[0]["status"]["last_update"])

    async def test_run_refreshes_until_stopped(self):
        fetcher = AsyncMock(return_value=[])
        registry = CameraRegistry(fetcher, refresh_interval_seconds=0.01)
        stop_event = asyncio.Event()

        task = asyncio.create_task(registry.run(stop_event))
        await asyncio.sleep(0.04)
        stop_event.set()
        await task

        self.assertGreaterEqual(fetcher.await_count, 2)


if __name__ == "__main__":
    unittest.main()
