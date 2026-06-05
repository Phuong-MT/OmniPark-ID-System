import asyncio
import logging
import os

import httpx

from src.models.event import EdgeEvent

logger = logging.getLogger(__name__)

BACKEND_URL = os.getenv("BACKEND_URL", "http://host.docker.internal:3000")
EDGE_NODE_ID = os.getenv("EDGE_NODE_ID")
BACKEND_TIMEOUT_SECONDS = float(os.getenv("BACKEND_TIMEOUT_SECONDS", "10"))
EVENT_FORWARD_RETRIES = int(os.getenv("EVENT_FORWARD_RETRIES", "3"))

async def forward_event_to_backend(event: EdgeEvent):
    """
    Forward validated events to the main NestJS backend.
    """
    async with httpx.AsyncClient(timeout=BACKEND_TIMEOUT_SECONDS) as client:
        for attempt in range(1, EVENT_FORWARD_RETRIES + 1):
            try:
                url = f"{BACKEND_URL}/edge/events"
                response = await client.post(
                    url,
                    json=event.model_dump(mode="json"),
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
    async with httpx.AsyncClient(timeout=BACKEND_TIMEOUT_SECONDS) as client:
        url = f"{BACKEND_URL}/edge/config/cameras"
        params = {"edgeNodeId": EDGE_NODE_ID} if EDGE_NODE_ID else None
        response = await client.get(url, params=params)
        response.raise_for_status()
        config = response.json()
        if not isinstance(config, list):
            raise ValueError("backend camera config response must be a list")
        logger.info(f"Successfully fetched {len(config)} cameras configuration from backend.")
        return config
