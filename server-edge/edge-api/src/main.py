import asyncio
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator

from src.api.events import router as events_router
from src.services.backend_client import fetch_cameras_config
from src.services.camera_registry import CameraRegistry
from src.services.event_store import EventStore
from src.services.backend_client import publish_camera_status
from src.services.onvif_discovery import run_discovery
from src.services.stream_monitor import StreamMonitor, probe_stream_async

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

CAMERA_REFRESH_INTERVAL_SECONDS = float(
    os.getenv("CAMERA_REFRESH_INTERVAL_SECONDS", "15")
)

camera_registry = CameraRegistry(
    fetcher=fetch_cameras_config,
    refresh_interval_seconds=CAMERA_REFRESH_INTERVAL_SECONDS,
)

event_store = EventStore()
stream_monitor = StreamMonitor(camera_registry)


class StreamProbeRequest(BaseModel):
    url: str

    @field_validator("url")
    @classmethod
    def validate_url(cls, value: str) -> str:
        if not value.startswith(("rtsp://", "http://", "https://")):
            raise ValueError("stream URL must use RTSP or HTTP")
        return value


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting edge-api camera registry and event store")
    stop_event = asyncio.Event()
    await camera_registry.refresh()
    refresh_task = asyncio.create_task(camera_registry.run(stop_event))
    app.state.camera_registry = camera_registry

    # Start SQLite event store sync task
    await event_store.init_db()
    sync_task = asyncio.create_task(event_store.sync_loop(stop_event))
    discovery_task = asyncio.create_task(run_discovery(stop_event))
    monitor_task = asyncio.create_task(stream_monitor.run(stop_event))
    app.state.event_store = event_store

    yield

    logger.info("Shutting down edge-api camera registry and event store")
    stop_event.set()
    await asyncio.gather(
        refresh_task,
        sync_task,
        discovery_task,
        monitor_task,
        return_exceptions=True,
    )


app = FastAPI(
    title="OmniPark Edge API",
    description="Control and event service for an OmniPark edge node",
    version="1.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(events_router)


@app.get("/status")
async def get_status():
    registry_status = await camera_registry.status()
    return {"status": "running", **registry_status}


@app.get("/cameras")
async def get_cameras():
    return await camera_registry.list_cameras()


@app.post("/cameras/{camera_id}/status")
async def update_camera_status(camera_id: str, payload: dict):
    status = payload.get("status", "UNKNOWN")
    error_message = payload.get("error_message")
    await camera_registry.update_camera_status(camera_id, status, error_message)
    try:
        await publish_camera_status(camera_id, status, error_message)
    except Exception:
        logger.exception("Failed to forward camera status to backend")
    
    # Broadcast to local websocket clients
    from src.api.events import manager
    await manager.broadcast({
        "type": "CAMERA_STATUS_CHANGED",
        "camera_id": camera_id,
        "status": status,
        "error_message": error_message
    })
    return {"status": "updated"}


@app.post("/cameras/refresh")
async def refresh_cameras():
    changed = await camera_registry.refresh()
    return {"changed": changed, **(await camera_registry.status())}


@app.post("/streams/probe")
async def probe_camera_stream(payload: StreamProbeRequest):
    return await probe_stream_async(payload.url)
