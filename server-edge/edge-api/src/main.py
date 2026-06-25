import logging
import os
import sys

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s - %(name)s - %(message)s",
    force=True,
)

from dotenv import load_dotenv
load_dotenv()

# Support local run: add edge-api root and edge-api/src to Python path
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, root_dir)
sys.path.insert(0, os.path.join(root_dir, "src"))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from api.events import router as events_router
from services.backend_client import fetch_cameras_config
from services.socket_client import socket_client
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

    # Connect to cloud server via Socket.IO
    await socket_client.connect()

    yield

    # Shutdown logic
    logging.info("Shutting down edge-api...")
    await socket_client.disconnect()

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

@app.get("/cameras/{camera_id}/snapshot")
def get_camera_snapshot(camera_id: str):
    """
    Get the latest snapshot and detected plate number for a specific camera.
    Returns Base64 image and metadata.
    """
    import json
    import base64
    
    shared_dir = "/app/shared_data"
    snapshot_path = os.path.join(shared_dir, f"snapshot_{camera_id}.jpg")
    meta_path = os.path.join(shared_dir, f"snapshot_{camera_id}.json")
    
    if not os.path.exists(snapshot_path):
        # Fallback if no frame has been captured yet
        return {
            "plate_number": "",
            "confidence": 0.0,
            "image_base64": ""
        }
        
    try:
        # Đọc ảnh và chuyển sang Base64
        with open(snapshot_path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode("utf-8")
            
        # Đọc metadata
        plate_number = ""
        confidence = 0.0
        if os.path.exists(meta_path):
            with open(meta_path, "r") as f:
                meta = json.load(f)
                # Chỉ lấy biển số nếu nó được ghi nhận gần đây (ví dụ trong vòng 5 giây)
                # Để tránh lấy biển số cũ của xe trước đã rời đi
                if time.time() - meta.get("timestamp", 0) < 5.0:
                    plate_number = meta.get("plate_number", "")
                    confidence = meta.get("confidence", 0.0)
                    
        return {
            "plate_number": plate_number,
            "confidence": confidence,
            "image_base64": f"data:image/jpeg;base64,{encoded_string}"
        }
    except Exception as e:
        return {
            "error": f"Failed to retrieve snapshot: {str(e)}",
            "plate_number": "",
            "confidence": 0.0,
            "image_base64": ""
        }

