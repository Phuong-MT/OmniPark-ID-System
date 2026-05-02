import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.events import router as events_router

logging.basicConfig(level=logging.INFO)

from contextlib import asynccontextmanager
from src.services.backend_client import fetch_cameras_config

# Global state to hold camera config
app_state = {
    "cameras": []
}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    logging.info("Starting edge-api, fetching camera configs from backend...")
    cameras = await fetch_cameras_config()
    app_state["cameras"] = cameras
    
    # Ideally, here we would also push this config to MediaMTX via its HTTP API
    # to dynamically create RTSP paths if they don't exist.
    
    yield
    # Shutdown logic
    logging.info("Shutting down edge-api...")

app = FastAPI(
    title="OmniPark Edge API",
    description="Control and Event service for OmniPark edge node",
    version="1.0.0",
    lifespan=lifespan
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
def get_status():
    return {
        "status": "running",
        "configured_cameras": len(app_state["cameras"])
    }

@app.get("/cameras")
def get_cameras():
    """
    Endpoint for ai-service to retrieve the dynamic list of cameras to process.
    """
    return app_state["cameras"]
