from typing import Optional

from pydantic import BaseModel, Field, field_validator


class CameraConfig(BaseModel):
    id: str = Field(min_length=1)
    url: str = Field(min_length=1)
    direction: str = "BOTH"
    parkId: Optional[str] = None
    clusterId: Optional[str] = None
    type: Optional[str] = None
    fps: Optional[int] = None
    confidence_threshold: Optional[float] = None

    @field_validator("url")
    @classmethod
    def validate_stream_url(cls, value: str) -> str:
        if not value.startswith(("rtsp://", "http://", "https://")):
            raise ValueError("camera URL must use RTSP or HTTP")
        return value

    @field_validator("direction")
    @classmethod
    def normalize_direction(cls, value: str) -> str:
        normalized = value.upper()
        if normalized not in {"IN", "OUT", "BOTH"}:
            raise ValueError("camera direction must be IN, OUT, or BOTH")
        return normalized
