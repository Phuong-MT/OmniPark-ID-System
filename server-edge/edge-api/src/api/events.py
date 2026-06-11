import logging
from fastapi import APIRouter, BackgroundTasks, WebSocket, WebSocketDisconnect, Request
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
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting to client: {str(e)}")
                disconnected.append(connection)
        for connection in disconnected:
            self.disconnect(connection)

manager = ConnectionManager()


async def handle_event_forwarding(event: EdgeEvent, event_store):
    """
    Check for pending events to preserve order, try immediate forward, or save to SQLite on failure.
    """
    try:
        pending_count = await event_store.get_pending_count()
        if pending_count > 0:
            logger.info(f"Pending offline events found ({pending_count}). Queueing event {event.event_id} to preserve chronological order.")
            await event_store.add_event(event)
            return

        success = await forward_event_to_backend(event)
        if not success:
            logger.warning(f"Immediate forwarding failed for event {event.event_id}. Saving to local SQLite database.")
            await event_store.add_event(event)
    except Exception as e:
        logger.exception(f"Error handling event forwarding: {e}")
        try:
            await event_store.add_event(event)
        except Exception:
            logger.exception("Failed to write event to offline storage")


@router.post("/", status_code=202)
async def receive_event(event: EdgeEvent, request: Request, background_tasks: BackgroundTasks):
    """
    Receive event from the local AI service.
    """
    logger.info(f"Received event: {event.type} from camera {event.camera_id}")
    
    # Broadcast to local websocket clients
    background_tasks.add_task(manager.broadcast, event.model_dump(mode="json"))
    
    # Forward to central backend with local offline buffer handling
    event_store = request.app.state.event_store
    background_tasks.add_task(handle_event_forwarding, event, event_store)
    
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
