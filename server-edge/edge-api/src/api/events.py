import logging
from fastapi import APIRouter, BackgroundTasks, WebSocket, WebSocketDisconnect
from typing import List

from src.models.event import EdgeEvent
from src.services.backend_client import forward_event_to_backend

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/events", tags=["events"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting to client: {str(e)}")

manager = ConnectionManager()

@router.post("/", status_code=202)
async def receive_event(event: EdgeEvent, background_tasks: BackgroundTasks):
    """
    Receive event from the local AI service.
    """
    logger.info(f"Received event: {event.type} from camera {event.camera_id}")
    
    # Broadcast to local websocket clients
    background_tasks.add_task(manager.broadcast, event.model_dump(mode="json"))
    
    # Forward to central backend
    background_tasks.add_task(forward_event_to_backend, event)
    
    return {"status": "accepted", "event_id": event.event_id}

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for local UI/Dashboard to monitor real-time events.
    """
    await manager.connect(websocket)
    try:
        while True:
            # We just keep the connection open to send events
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
