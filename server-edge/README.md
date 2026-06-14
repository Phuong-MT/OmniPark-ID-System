# OmniPark Server Edge

The Edge stack discovers cameras and verifies that up to 10 RTSP/HTTP streams
produce valid frames. It can run independently for phone-camera testing or
connect to the central backend.

## Camera Flow

1. `edge-api` polls `GET /edge/config/cameras` on the backend.
2. Valid camera configs are exposed locally at `GET /cameras`.
3. `edge-api` probes up to 10 streams and reports `CONNECTED` or
   `DISCONNECTED` to the backend.
4. ONVIF cameras are discovered on the local network and sent to the backend
   for administrator approval.

## Configuration

Important `edge-api` environment variables:

- `BACKEND_URL`: central backend URL.
- `EDGE_NODE_ID`: limits backend camera config to this edge node.
- `CAMERA_REFRESH_INTERVAL_SECONDS`: backend camera polling interval.
- `BACKEND_TIMEOUT_SECONDS`: backend request timeout.
- `EVENT_FORWARD_RETRIES`: event forwarding attempts.
- `EDGE_API_KEY`: API key registered for this Edge Node on the backend.
- `ONVIF_DISCOVERY_INTERVAL_SECONDS`: interval for discovering ONVIF cameras on the local network.

- `STREAM_MONITOR_INTERVAL_SECONDS`: interval between stream checks.
- `STREAM_OPEN_TIMEOUT_MS` and `STREAM_READ_TIMEOUT_MS`: stream probe timeouts.
- `STREAM_PROBE_TIMEOUT_SECONDS`: hard limit preventing a broken stream from
  blocking Edge API.
- `MAX_MONITORED_CAMERAS`: maximum streams checked by one Edge Node.
- `EDGE_STANDALONE`: use local camera configuration and skip backend calls.
- `LOCAL_CAMERAS_JSON`: JSON array containing up to 10 local cameras.
- `ONVIF_DISCOVERY_ENABLED`: enable network discovery when ONVIF dependencies
  are installed. Disabled by default for manual phone-camera testing.

## Test With A Phone Camera

1. Connect the phone and Edge computer to the same Wi-Fi. Disable mobile data,
   VPN and AP/client isolation if the phone cannot be reached.
2. Start a camera-server app on the phone:
   - An HTTP/MJPEG app commonly exposes a URL such as
     `http://192.168.1.100:8080/video`.
   - An RTSP camera-server app commonly exposes a URL such as
     `rtsp://192.168.1.100:8554/live`.
3. Run the one-step PowerShell test command:

```powershell
.\start-phone-camera.ps1 -Url "http://192.168.1.100:8080/video"
```

The command builds/starts Edge, waits for the API, probes the stream and prints
the monitored camera status. `Connected: True` confirms a valid frame was read.

Alternatively, copy `.env.example` to `.env` and replace the URL:

```env
EDGE_STANDALONE=true
LOCAL_CAMERAS_JSON=[{"id":"phone-camera","url":"http://192.168.1.100:8080/video","direction":"BOTH"}]
```

4. Start Edge:

```bash
docker compose up --build
```

5. Verify the configured camera:

```powershell
Invoke-RestMethod http://localhost:8000/cameras
.\test-phone-camera.ps1 -Url "http://192.168.1.100:8080/video"
```

`Connected: True` means Edge opened the stream and read a valid frame. The
result also includes resolution and elapsed time.

To test another URL without restarting Edge:

```powershell
Invoke-RestMethod -Method Post `
  -Uri http://localhost:8000/streams/probe `
  -ContentType application/json `
  -Body '{"url":"rtsp://192.168.1.100:8554/live"}'
```

## Backend Mode

Set `EDGE_STANDALONE=false`, then configure `BACKEND_URL`, `EDGE_NODE_ID` and
`EDGE_API_KEY`. Set `ONVIF_DISCOVERY_ENABLED=true` when discovery is required.
Edge will poll camera configuration and send statuses to the central backend.

Useful endpoints:

- `GET http://localhost:8000/status`
- `GET http://localhost:8000/cameras`
- `POST http://localhost:8000/cameras/refresh`
- `POST http://localhost:8000/streams/probe`
- `WS http://localhost:8000/events/ws`

## Test

```bash
cd edge-api
python -m pip install -r requirements.txt
python -m unittest discover -s tests -v
```

`requirements.txt` is sufficient for manual RTSP/HTTP phone-camera testing.
ONVIF discovery is optional on Windows because its `netifaces` dependency
requires Visual C++ Build Tools. Docker installs `requirements-onvif.txt` and
includes ONVIF discovery.
