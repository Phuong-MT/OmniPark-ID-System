import json
import unittest
from unittest.mock import patch

from src.services import backend_client


class BackendClientStandaloneTests(unittest.IsolatedAsyncioTestCase):
    async def test_standalone_config_uses_local_cameras_and_limits_to_ten(self):
        cameras = [
            {"id": f"cam-{index}", "url": f"rtsp://phone/{index}"}
            for index in range(12)
        ]

        with (
            patch.object(backend_client, "EDGE_STANDALONE", True),
            patch.object(backend_client, "LOCAL_CAMERAS_JSON", json.dumps(cameras)),
        ):
            result = await backend_client.fetch_cameras_config()

        self.assertEqual(len(result), 10)
        self.assertEqual(result[0]["id"], "cam-0")

    async def test_standalone_status_publish_does_not_call_backend(self):
        with (
            patch.object(backend_client, "EDGE_STANDALONE", True),
            patch("src.services.backend_client.httpx.AsyncClient") as client,
        ):
            result = await backend_client.publish_camera_status(
                "phone-camera", "CONNECTED"
            )

        self.assertTrue(result)
        client.assert_not_called()

    def test_local_camera_config_must_be_an_array(self):
        with patch.object(backend_client, "LOCAL_CAMERAS_JSON", "{}"):
            with self.assertRaisesRegex(ValueError, "JSON array"):
                backend_client.load_local_cameras()


if __name__ == "__main__":
    unittest.main()
