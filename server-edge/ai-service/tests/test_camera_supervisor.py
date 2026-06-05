import asyncio
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.cameras.supervisor import CameraSupervisor


class CameraSupervisorTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.started = []

        async def worker(camera):
            self.started.append(camera.copy())
            await asyncio.Event().wait()

        self.supervisor = CameraSupervisor(
            edge_api_url="http://edge-api:8000",
            worker_factory=worker,
        )

    async def asyncTearDown(self):
        await self.supervisor.stop()

    async def test_add_update_and_remove_camera_workers(self):
        camera = {"id": "cam-1", "url": "rtsp://camera/stream"}
        await self.supervisor.reconcile([camera])
        await asyncio.sleep(0)
        self.assertEqual(len(self.supervisor._tasks), 1)
        self.assertEqual(len(self.started), 1)

        await self.supervisor.reconcile([camera])
        await asyncio.sleep(0)
        self.assertEqual(len(self.started), 1)

        changed = {"id": "cam-1", "url": "rtsp://camera/new-stream"}
        await self.supervisor.reconcile([changed])
        await asyncio.sleep(0)
        self.assertEqual(len(self.started), 2)
        self.assertEqual(self.started[-1]["url"], "rtsp://camera/new-stream")

        await self.supervisor.reconcile([])
        self.assertEqual(len(self.supervisor._tasks), 0)

    async def test_invalid_camera_is_ignored(self):
        await self.supervisor.reconcile(
            [{"id": "cam-1", "url": "file:///tmp/video.mp4"}]
        )
        self.assertEqual(len(self.supervisor._tasks), 0)


if __name__ == "__main__":
    unittest.main()
