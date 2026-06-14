import sys
import types
import unittest

from src.services.onvif_resolver import resolve_onvif_camera


class FakeMedia:
    def GetProfiles(self):
        return [types.SimpleNamespace(token="profile-1")]

    def create_type(self, _name):
        return types.SimpleNamespace()

    def GetStreamUri(self, _request):
        return types.SimpleNamespace(Uri="rtsp://camera.local/stream")


class FakeCamera:
    def __init__(self, host, port, username, password):
        self.connection = (host, port, username, password)

    def create_media_service(self):
        return FakeMedia()


class OnvifResolverTests(unittest.IsolatedAsyncioTestCase):
    async def test_resolves_onvif_service_to_rtsp_and_removes_credentials(self):
        module = types.ModuleType("onvif")
        module.ONVIFCamera = FakeCamera
        previous = sys.modules.get("onvif")
        sys.modules["onvif"] = module
        try:
            resolved = await resolve_onvif_camera(
                {
                    "id": "cam-1",
                    "connectionType": "ONVIF",
                    "onvifServiceUrl": "http://camera.local:8080/onvif/device_service",
                    "username": "admin@example.com",
                    "password": "secret word",
                }
            )
        finally:
            if previous is None:
                sys.modules.pop("onvif", None)
            else:
                sys.modules["onvif"] = previous

        self.assertEqual(
            resolved["url"],
            "rtsp://admin%40example.com:secret%20word@camera.local/stream",
        )
        self.assertNotIn("username", resolved)
        self.assertNotIn("password", resolved)


if __name__ == "__main__":
    unittest.main()
