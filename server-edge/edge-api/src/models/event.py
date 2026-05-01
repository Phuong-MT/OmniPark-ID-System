from enum import Enum
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class EventType(str, Enum):
    PLATE_DETECTED = "PLATE_DETECTED"
    VEHICLE_ENTERED = "VEHICLE_ENTERED"
    VEHICLE_EXITED = "VEHICLE_EXITED"
    SYSTEM_ALERT = "SYSTEM_ALERT"

class EdgeEvent(BaseModel):
    event_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    type: EventType
    camera_id: str
    payload: Dict[str, Any]

class PlatePayload(BaseModel):
    plate_number: str
    confidence: float
    bbox: Optional[list[float]] = None
