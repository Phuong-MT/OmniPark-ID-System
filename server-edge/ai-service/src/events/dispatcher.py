import os
import httpx
import logging
import uuid
import time
import asyncio
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

EDGE_API_URL = os.getenv("EDGE_API_URL", "http://edge-api:8000")
EVENT_DISPATCH_RETRIES = int(os.getenv("EVENT_DISPATCH_RETRIES", "3"))
PLATE_DEBOUNCE_SECONDS = float(os.getenv("PLATE_DEBOUNCE_SECONDS", "5"))

class EventDispatcher:
    def __init__(self):
        self.client = httpx.AsyncClient()
        self.last_seen: dict[tuple[str, str], float] = {}

    async def dispatch_plate_event(
        self,
        camera_id: str,
        plate_text: str,
        confidence: float,
        bbox: list[float],
        direction: str = "BOTH",
    ):
        """
        Dispatch a plate detected event with basic debounce logic.
        """
        current_time = time.time()
        
        debounce_key = (camera_id, plate_text)
        if (
            current_time - self.last_seen.get(debounce_key, 0)
            < PLATE_DEBOUNCE_SECONDS
        ):
            return

        self.last_seen[debounce_key] = current_time

        event_payload = {
            "event_id": str(uuid.uuid4()),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "type": "PLATE_DETECTED",
            "camera_id": camera_id,
            "payload": {
                "plate_number": plate_text,
                "confidence": confidence,
                "bbox": bbox,
                "direction": direction,
            }
        }

        for attempt in range(1, EVENT_DISPATCH_RETRIES + 1):
            try:
                response = await self.client.post(
                    f"{EDGE_API_URL}/events/",
                    json=event_payload,
                    timeout=5.0,
                )
                response.raise_for_status()
                logger.info(f"Dispatched plate event for {plate_text}")
                return True
            except Exception as error:
                logger.warning(
                    "Failed dispatching plate event for %s (attempt %s/%s): %s",
                    plate_text,
                    attempt,
                    EVENT_DISPATCH_RETRIES,
                    error,
                )
                if attempt < EVENT_DISPATCH_RETRIES:
                    await asyncio.sleep(min(2 ** (attempt - 1), 5))
        return False

    async def close(self):
        await self.client.aclose()
