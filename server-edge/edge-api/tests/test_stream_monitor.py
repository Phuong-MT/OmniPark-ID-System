import unittest
from unittest.mock import AsyncMock, call, patch

from src.services.stream_monitor import (
    StreamMonitor,
    probe_stream_async,
    probe_stream_details,
)


class StreamMonitorTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.registry = AsyncMock()
        self.registry.list_cameras.return_value = [
            {"id": "cam-1", "url": "rtsp://camera/stream"}
        ]
        self.monitor = StreamMonitor(self.registry)

    @patch("src.services.stream_monitor.publish_camera_status", new_callable=AsyncMock)
    @patch(
        "src.services.stream_monitor.probe_stream_async",
        new_callable=AsyncMock,
        return_value={"connected": True, "error": None},
    )
    async def test_reports_connected_after_receiving_a_frame(
        self, _probe, publish_status
    ):
        await self.monitor.run_once()

        self.registry.update_camera_status.assert_any_await(
            "cam-1", "CONNECTING"
        )
        self.registry.update_camera_status.assert_any_await(
            "cam-1", "CONNECTED", None
        )
        self.assertEqual(
            publish_status.await_args_list,
            [
                call("cam-1", "CONNECTING"),
                call("cam-1", "CONNECTED", None),
            ],
        )

    @patch("src.services.stream_monitor.publish_camera_status", new_callable=AsyncMock)
    @patch(
        "src.services.stream_monitor.probe_stream_async",
        new_callable=AsyncMock,
        return_value={"connected": False, "error": "Unable to open stream"},
    )
    async def test_reports_disconnected_when_stream_cannot_be_read(
        self, _probe, publish_status
    ):
        await self.monitor.run_once()

        self.registry.update_camera_status.assert_any_await(
            "cam-1", "DISCONNECTED", "Unable to open stream"
        )
        self.assertEqual(
            publish_status.await_args_list,
            [
                call("cam-1", "CONNECTING"),
                call("cam-1", "DISCONNECTED", "Unable to open stream"),
            ],
        )

    async def test_checks_at_most_ten_cameras(self):
        self.registry.list_cameras.return_value = [
            {"id": f"cam-{index}", "url": f"rtsp://camera/{index}"}
            for index in range(15)
        ]
        self.monitor.check_camera = AsyncMock()

        await self.monitor.run_once()

        self.assertEqual(self.monitor.check_camera.await_count, 10)

    @patch.dict("sys.modules", {"cv2": None})
    async def test_probe_explains_when_opencv_is_unavailable(self):
        result = probe_stream_details("rtsp://camera/stream")

        self.assertFalse(result["connected"])
        self.assertIn("OpenCV is not installed", result["error"])
        self.assertIn("elapsed_ms", result)

    @patch(
        "src.services.stream_monitor.STREAM_PROBE_TIMEOUT_SECONDS",
        0.01,
    )
    @patch("src.services.stream_monitor.probe_stream_details")
    async def test_async_probe_returns_timeout_instead_of_blocking(self, probe):
        import time

        probe.side_effect = lambda _url: time.sleep(0.2)
        result = await probe_stream_async("rtsp://camera/stream")

        self.assertFalse(result["connected"])
        self.assertIn("timed out", result["error"])


if __name__ == "__main__":
    unittest.main()
