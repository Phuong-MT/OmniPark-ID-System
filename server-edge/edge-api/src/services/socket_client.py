import asyncio
import logging
import os

import socketio

logger = logging.getLogger(__name__)

CLOUD_WS_URL = os.getenv("CLOUD_WS_URL", "http://host.docker.internal:3000")
TENANT_CODE = os.getenv("TENANT_CODE", "")
SOCKET_PATH = os.getenv("CLOUD_SOCKET_PATH", "/socket")
RECONNECT_DELAY = int(os.getenv("SOCKET_RECONNECT_DELAY", "5"))  # seconds

class SocketClient:
    """
    Socket.IO async client that maintains a persistent connection to the cloud server.

    Lifecycle:
    - connect()      → called on app startup
    - disconnect()   → called on app shutdown

    Identity:
    - On 'connect' event, emits 'edge_identify' with tenantCode so the cloud
      knows which edge node this is.

    Commands from cloud:
    - 'reload_config'  → re-fetch camera config from backend
    - Add more handlers here as needed.
    """

    def __init__(self):
        self.sio = socketio.AsyncClient(
            reconnection=True,
            reconnection_attempts=0,       # unlimited retries
            reconnection_delay=RECONNECT_DELAY,
            reconnection_delay_max=60,
            logger=False,
            engineio_logger=False,
        )
        self._connect_task: asyncio.Task | None = None
        self._register_handlers()

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    async def connect(self):
        """Start the background connection task."""
        self._connect_task = asyncio.create_task(self._run())
        logger.info(f"SocketClient: initiating connection to {CLOUD_WS_URL}{SOCKET_PATH}")

    async def disconnect(self):
        """Gracefully shut down the socket connection."""
        if self.sio.connected:
            await self.sio.disconnect()
            logger.info("SocketClient: disconnected from cloud server.")
        if self._connect_task and not self._connect_task.done():
            self._connect_task.cancel()

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _run(self):
        """Connect loop — python-socketio handles reconnect internally."""
        try:
            await self.sio.connect(
                CLOUD_WS_URL,
                socketio_path=SOCKET_PATH,
                transports=["websocket"],   # skip long-polling, go direct WS
            )
            await self.sio.wait()           # keep alive until disconnect
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"SocketClient: fatal connection error: {e}")

    async def emit_event(self, event_name: str, data: dict):
        """Emit an event to the cloud server if connected."""
        if self.sio.connected:
            await self.sio.emit(event_name, data)
        else:
            logger.warning(
                f"SocketClient: not connected, dropping emit '{event_name}'"
            )

    # ------------------------------------------------------------------
    # Socket.IO event handlers
    # ------------------------------------------------------------------

    def _register_handlers(self):
        sio = self.sio

        @sio.event
        async def connect():
            logger.info("SocketClient: connected to cloud server ✓")
            # Identify this edge node by its tenantCode
            await sio.emit("edge_identify", {"tenantCode": TENANT_CODE})
            logger.info(
                f"SocketClient: sent edge_identify with tenantCode='{TENANT_CODE}'"
            )
            logger.warning(f"SocketClient: id='{sio.sid}'")

        @sio.event
        async def connect_error(data):
            logger.warning(f"SocketClient: connection error — {data}")

        @sio.event
        async def disconnect():
            logger.warning("SocketClient: disconnected from cloud server.")

        # ---- Commands sent from cloud ----

        @sio.on("reload_config")
        async def on_reload_config(data):
            """
            Cloud requests edge to reload its camera config.
            Re-import lazily to avoid circular deps at module load time.
            """
            logger.info(f"SocketClient: received 'reload_config' from cloud: {data}")
            try:
                from services.backend_client import fetch_cameras_config
                from main import app_state

                cameras = await fetch_cameras_config()
                app_state["cameras"] = cameras
                logger.info(
                    f"SocketClient: reloaded {len(cameras)} cameras from backend."
                )
            except Exception as e:
                logger.error(f"SocketClient: failed to reload config: {e}")
        @sio.on("get_camera_webrtc_url")
        async def on_get_camera_webrtc_url(data):
            """
            Cloud requests WebRTC stream URL for a specific camera.
            Format of MediaMTX stream path: <tenantCode>_<cameraId>
            We reply back with the WebRTC WHEP url on port 8889.
            """
            camera_id = data.get("cameraId")
            requester_socket_id = data.get("requesterSocketId")
            logger.info(f"SocketClient: received 'get_camera_webrtc_url' for camera {camera_id}")
            
            # Đọc domain/IP của Edge từ ENV (hoặc default localhost nếu chạy dev). 
            # Vì MediaMTX đứng sau NAT, Client cần biết IP của Edge để connect trực tiếp WebRTC.
            edge_host = os.getenv("EDGE_PUBLIC_HOST", "localhost")
            
            # WHEP stream URL của MediaMTX (WHEP client POST offer to /<stream_path>/whep)
            stream_url = f"http://{edge_host}:8889/detect_{camera_id}"

            
            await sio.emit("response_camera_webrtc_url", {
                "cameraId": camera_id,
                "streamUrl": stream_url,
                "requesterSocketId": requester_socket_id
            })

        @sio.on("get_camera_snapshot")
        async def on_get_camera_snapshot(data):
            """
            Cloud requests a snapshot + plate detection for a specific camera.
            Returns data via Socket.IO ack callback (no HTTP round-trip needed).
            """
            import json
            import base64
            import time as _time

            camera_id = data.get("cameraId", "")
            logger.info(f"SocketClient: received 'get_camera_snapshot' for camera {camera_id}")

            shared_dir = os.getenv("SHARED_DATA_DIR", "/app/shared_data")
            snapshot_path = os.path.join(shared_dir, f"snapshot_{camera_id}.jpg")
            meta_path = os.path.join(shared_dir, f"snapshot_{camera_id}.json")

            result = {
                "plate_number": "",
                "confidence": 0.0,
                "image_base64": ""
            }

            if not os.path.exists(snapshot_path):
                logger.warning(f"SocketClient: snapshot not found at {snapshot_path}")
                return result

            try:
                with open(snapshot_path, "rb") as image_file:
                    encoded_string = base64.b64encode(image_file.read()).decode("utf-8")

                if os.path.exists(meta_path):
                    with open(meta_path, "r") as f:
                        meta = json.load(f)
                        if _time.time() - meta.get("timestamp", 0) < 5.0:
                            result["plate_number"] = meta.get("plate_number", "")
                            result["confidence"] = meta.get("confidence", 0.0)

                result["image_base64"] = f"data:image/jpeg;base64,{encoded_string}"
            except Exception as e:
                logger.error(f"SocketClient: failed to read snapshot: {e}")

            return result



# Singleton — import this instance everywhere
socket_client = SocketClient()

