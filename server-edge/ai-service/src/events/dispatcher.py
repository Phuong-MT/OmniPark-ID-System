import os
import httpx
import logging
import uuid
import time
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

EDGE_API_URL = os.getenv("EDGE_API_URL", "http://edge-api:8000")

class EventDispatcher:
    def __init__(self):
        self.client = httpx.AsyncClient()
        self.last_plate = None
        self.last_plate_time = 0
        self.debounce_seconds = 5.0

    async def dispatch_plate_event(self, camera_id: str, plate_text: str, confidence: float, bbox: list[float]):
        """
        Dispatch a plate detected event with basic debounce logic.
        """
        current_time = time.time()
        
        # Simple Debounce: Don't send same plate if seen in the last `debounce_seconds`
        if plate_text == self.last_plate and (current_time - self.last_plate_time) < self.debounce_seconds:
            return

        self.last_plate = plate_text
        self.last_plate_time = current_time

        event_payload = {
            "event_id": str(uuid.uuid4()),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "type": "PLATE_DETECTED",
            "camera_id": camera_id,
            "payload": {
                "plate_number": plate_text,
                "confidence": confidence,
                "bbox": bbox
            }
        }

        try:
            response = await self.client.post(
                f"{EDGE_API_URL}/events/",
                json=event_payload,
                timeout=2.0
            )
            response.raise_for_status()
            logger.info(f"Dispatched plate event for {plate_text}")
        except Exception as e:
            logger.error(f"Failed to dispatch event to Edge API: {str(e)}")

    async def close(self):
        await self.client.aclose()
