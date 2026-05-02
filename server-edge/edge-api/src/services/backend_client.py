import os
import httpx
import logging
from src.models.event import EdgeEvent

logger = logging.getLogger(__name__)

BACKEND_URL = os.getenv("BACKEND_URL", "http://host.docker.internal:3000")

async def forward_event_to_backend(event: EdgeEvent):
    """
    Forward validated events to the main NestJS backend.
    """
    try:
        async with httpx.AsyncClient() as client:
            # We assume the NestJS backend has an endpoint /api/edge/events
            url = f"{BACKEND_URL}/api/edge/events"
            response = await client.post(
                url,
                json=event.model_dump(mode="json"),
                timeout=5.0
            )
            response.raise_for_status()
            logger.info(f"Successfully forwarded event {event.event_id} to backend.")
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error forwarding event {event.event_id}: {e.response.text}")
    except Exception as e:
        logger.error(f"Failed to forward event {event.event_id} to backend: {str(e)}")
        # Implement retry logic or dead-letter queue in production

async def fetch_cameras_config() -> list:
    """
    Fetch the list of cameras configured for this edge node/park from the central backend.
    Expected to return a list of dicts: [{"id": "cam_01", "url": "rtsp://...", "type": "in/out"}, ...]
    """
    try:
        async with httpx.AsyncClient() as client:
            url = f"{BACKEND_URL}/api/edge/config/cameras"
            response = await client.get(url, timeout=10.0)
            response.raise_for_status()
            config = response.json()
            logger.info(f"Successfully fetched {len(config)} cameras configuration from backend.")
            return config
    except Exception as e:
        logger.error(f"Failed to fetch cameras config from backend: {str(e)}")
        # Fallback to empty list or default local config in production
        return []
