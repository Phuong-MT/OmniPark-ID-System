import asyncio
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.events import router as events_router
from src.services.backend_client import fetch_cameras_config
from src.services.camera_registry import CameraRegistry

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

CAMERA_REFRESH_INTERVAL_SECONDS = float(
    os.getenv("CAMERA_REFRESH_INTERVAL_SECONDS", "15")
)

camera_registry = CameraRegistry(
    fetcher=fetch_cameras_config,
    refresh_interval_seconds=CAMERA_REFRESH_INTERVAL_SECONDS,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting edge-api camera registry")
    stop_event = asyncio.Event()
    await camera_registry.refresh()
    refresh_task = asyncio.create_task(camera_registry.run(stop_event))
    app.state.camera_registry = camera_registry

    yield

    logger.info("Shutting down edge-api camera registry")
    stop_event.set()
    await refresh_task


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


@app.post("/cameras/refresh")
async def refresh_cameras():
    changed = await camera_registry.refresh()
    return {"changed": changed, **(await camera_registry.status())}
