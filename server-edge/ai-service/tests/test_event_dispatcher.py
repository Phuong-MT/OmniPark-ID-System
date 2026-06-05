import sys
import unittest
from pathlib import Path
from unittest.mock import AsyncMock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.events.dispatcher import EventDispatcher


class EventDispatcherTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.dispatcher = EventDispatcher()
        response = AsyncMock()
        response.raise_for_status = lambda: None
        self.dispatcher.client.post = AsyncMock(return_value=response)

    async def asyncTearDown(self):
        await self.dispatcher.close()

    async def test_debounce_is_scoped_per_camera(self):
        args = {
            "plate_text": "51A12345",
            "confidence": 0.95,
            "bbox": [1, 2, 3, 4],
        }

        self.assertTrue(
            await self.dispatcher.dispatch_plate_event(camera_id="cam-1", **args)
        )
        self.assertIsNone(
            await self.dispatcher.dispatch_plate_event(camera_id="cam-1", **args)
        )
        self.assertTrue(
            await self.dispatcher.dispatch_plate_event(camera_id="cam-2", **args)
        )

        self.assertEqual(self.dispatcher.client.post.await_count, 2)
        second_payload = self.dispatcher.client.post.await_args_list[1].kwargs["json"]
        self.assertEqual(second_payload["camera_id"], "cam-2")


if __name__ == "__main__":
    unittest.main()
