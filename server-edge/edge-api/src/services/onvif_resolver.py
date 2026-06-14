import asyncio
import logging
from urllib.parse import quote, urlparse, urlunparse

logger = logging.getLogger(__name__)


def _resolve(camera: dict) -> dict:
    from onvif import ONVIFCamera

    service_url = camera.get("onvifServiceUrl")
    if not service_url:
        return camera
    parsed = urlparse(service_url)
    if not parsed.hostname:
        raise ValueError("ONVIF service URL has no host")
    client = ONVIFCamera(
        parsed.hostname,
        parsed.port or 80,
        camera.get("username") or "",
        camera.get("password") or "",
    )
    media = client.create_media_service()
    profiles = media.GetProfiles()
    if not profiles:
        raise ValueError("ONVIF camera has no media profile")
    request = media.create_type("GetStreamUri")
    request.ProfileToken = profiles[0].token
    request.StreamSetup = {
        "Stream": "RTP-Unicast",
        "Transport": {"Protocol": "RTSP"},
    }
    uri = media.GetStreamUri(request).Uri
    username = camera.get("username")
    if username:
        parsed_uri = urlparse(uri)
        credentials = quote(username, safe="")
        password = camera.get("password")
        if password:
            credentials += f":{quote(password, safe='')}"
        host = parsed_uri.hostname or ""
        if ":" in host and not host.startswith("["):
            host = f"[{host}]"
        netloc = f"{credentials}@{host}"
        if parsed_uri.port:
            netloc += f":{parsed_uri.port}"
        uri = urlunparse(parsed_uri._replace(netloc=netloc))
    resolved = {**camera, "url": uri}
    resolved.pop("username", None)
    resolved.pop("password", None)
    return resolved


async def resolve_onvif_camera(camera: dict) -> dict:
    return await asyncio.to_thread(_resolve, camera)
