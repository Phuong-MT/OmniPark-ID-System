import asyncio
import json
import logging
import os

import httpx

from src.models.event import EdgeEvent
from src.services.onvif_resolver import resolve_onvif_camera

logger = logging.getLogger(__name__)

BACKEND_URL = os.getenv("BACKEND_URL", "http://host.docker.internal:3000")
EDGE_NODE_ID = os.getenv("EDGE_NODE_ID")
BACKEND_TIMEOUT_SECONDS = float(os.getenv("BACKEND_TIMEOUT_SECONDS", "10"))
EVENT_FORWARD_RETRIES = int(os.getenv("EVENT_FORWARD_RETRIES", "3"))
EDGE_API_KEY = os.getenv("EDGE_API_KEY", "")
EDGE_STANDALONE = os.getenv("EDGE_STANDALONE", "false").lower() in {"1", "true", "yes"}
LOCAL_CAMERAS_JSON = os.getenv("LOCAL_CAMERAS_JSON", "[]")


def load_local_cameras() -> list:
    cameras = json.loads(LOCAL_CAMERAS_JSON)
    if not isinstance(cameras, list):
        raise ValueError("LOCAL_CAMERAS_JSON must contain a JSON array")
    return cameras[:10]

def edge_headers() -> dict:
    return {
        "x-edge-node-id": EDGE_NODE_ID or "edge-default",
        "x-edge-api-key": EDGE_API_KEY,
    }

async def forward_event_to_backend(event: EdgeEvent):
    """
    Forward validated events to the main NestJS backend.
    """
    if EDGE_STANDALONE:
        return True

    async with httpx.AsyncClient(timeout=BACKEND_TIMEOUT_SECONDS) as client:
        for attempt in range(1, EVENT_FORWARD_RETRIES + 1):
            try:
                url = f"{BACKEND_URL}/edge/events"
                response = await client.post(
                    url,
                    json=event.model_dump(mode="json"),
                    headers=edge_headers(),
                )
                response.raise_for_status()
                logger.info(
                    "Successfully forwarded event %s to backend.", event.event_id
                )
                return True
            except Exception as error:
                logger.warning(
                    "Failed forwarding event %s (attempt %s/%s): %s",
                    event.event_id,
                    attempt,
                    EVENT_FORWARD_RETRIES,
                    error,
                )
                if attempt < EVENT_FORWARD_RETRIES:
                    await asyncio.sleep(min(2 ** (attempt - 1), 5))
    return False

async def fetch_cameras_config() -> list:
    """
    Fetch the list of cameras configured for this edge node/park from the central backend.
    Expected to return a list of dicts: [{"id": "cam_01", "url": "rtsp://...", "type": "in/out"}, ...]
    """
    if EDGE_STANDALONE:
        return load_local_cameras()

    async with httpx.AsyncClient(timeout=BACKEND_TIMEOUT_SECONDS) as client:
        url = f"{BACKEND_URL}/edge/config/cameras"
        params = {"edgeNodeId": EDGE_NODE_ID} if EDGE_NODE_ID else None
        response = await client.get(url, params=params, headers=edge_headers())
        response.raise_for_status()
        config = response.json()
        if not isinstance(config, list):
            raise ValueError("backend camera config response must be a list")
        resolved = []
        for camera in config:
            if camera.get("connectionType") == "ONVIF":
                try:
                    camera = await resolve_onvif_camera(camera)
                except Exception as error:
                    logger.warning("Failed resolving ONVIF camera %s: %s", camera.get("id"), error)
                    continue
            camera.pop("username", None)
            camera.pop("password", None)
            resolved.append(camera)
        logger.info(f"Successfully fetched {len(resolved)} cameras configuration from backend.")
        return resolved

async def publish_discoveries(cameras: list[dict]) -> bool:
    if EDGE_STANDALONE:
        return True

    async with httpx.AsyncClient(timeout=BACKEND_TIMEOUT_SECONDS) as client:
        response = await client.post(
            f"{BACKEND_URL}/edge/discoveries",
            json={"cameras": cameras},
            headers=edge_headers(),
        )
        response.raise_for_status()
        return True

async def publish_camera_status(camera_id: str, status: str, error: str | None = None) -> bool:
    if EDGE_STANDALONE:
        return True

    async with httpx.AsyncClient(timeout=BACKEND_TIMEOUT_SECONDS) as client:
        response = await client.post(
            f"{BACKEND_URL}/edge/cameras/{camera_id}/status",
            json={"status": status, "error": error},
            headers=edge_headers(),
        )
        response.raise_for_status()
        return True
