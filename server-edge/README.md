# OmniPark Server Edge

The edge stack reads camera configuration from the central backend, runs local
license-plate inference, and forwards validated events back to the backend.

## Camera Flow

1. `edge-api` polls `GET /edge/config/cameras` on the backend.
2. Valid camera configs are exposed locally at `GET /cameras`.
3. `ai-service` reconciles one worker per camera. Added, removed, or changed
   cameras are applied without restarting the containers.
4. Plate detections are sent to `POST /events/` on `edge-api`.
5. `edge-api` broadcasts events locally and retries forwarding them to
   `POST /edge/events` on the backend.

## Configuration

Important `edge-api` environment variables:

- `BACKEND_URL`: central backend URL.
- `EDGE_NODE_ID`: limits backend camera config to this edge node.
- `CAMERA_REFRESH_INTERVAL_SECONDS`: backend camera polling interval.
- `BACKEND_TIMEOUT_SECONDS`: backend request timeout.
- `EVENT_FORWARD_RETRIES`: event forwarding attempts.

Important `ai-service` environment variables:

- `EDGE_API_URL`: local edge API URL.
- `CAMERA_REFRESH_INTERVAL_SECONDS`: local camera polling interval.
- `TARGET_FPS`: inference target FPS per camera.
- `VEHICLE_MODEL_PATH` and `PLATE_MODEL_PATH`: model paths inside the container.
- `EVENT_DISPATCH_RETRIES` and `PLATE_DEBOUNCE_SECONDS`: event controls.
- `STREAM_RECONNECT_DELAY_SECONDS`, `STREAM_OPEN_TIMEOUT_MS`, and
  `STREAM_READ_TIMEOUT_MS`: stream connection controls.

## Run

```bash
docker compose up --build
```

Useful endpoints:

- `GET http://localhost:8000/status`
- `GET http://localhost:8000/cameras`
- `POST http://localhost:8000/cameras/refresh`
- `WS http://localhost:8000/events/ws`

## Test

```bash
cd edge-api
python -m unittest discover -s tests -v

cd ../ai-service
python -m unittest discover -s tests -v
```
