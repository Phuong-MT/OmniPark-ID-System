import cv2
import logging
import time
import numpy as np
import httpx
import os
from urllib.parse import urlsplit, urlunsplit
from typing import Optional

logger = logging.getLogger(__name__)

# Configure RTSP to use TCP for OpenCV video capture to prevent frame dropping over UDP
os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp"

RECONNECT_DELAY_SECONDS = float(os.getenv("STREAM_RECONNECT_DELAY_SECONDS", "3"))
STREAM_OPEN_TIMEOUT_MS = int(os.getenv("STREAM_OPEN_TIMEOUT_MS", "5000"))
STREAM_READ_TIMEOUT_MS = int(os.getenv("STREAM_READ_TIMEOUT_MS", "5000"))


def redact_stream_url(url: str) -> str:
    try:
        parsed = urlsplit(url)
        if not parsed.username:
            return url
        hostname = parsed.hostname or ""
        if parsed.port:
            hostname = f"{hostname}:{parsed.port}"
        return urlunsplit(
            (parsed.scheme, f"{parsed.username}:***@{hostname}", parsed.path, parsed.query, parsed.fragment)
        )
    except Exception:
        return "<invalid-stream-url>"


class StreamConsumer:
    def __init__(self, url: str):
        self.url = url
        self.cap = None
        self.is_http = url.startswith("http://") or url.startswith("https://")
        self.http_stream = None
        self.bytes_buffer = bytes()

    def is_connected(self) -> bool:
        if self.is_http:
            return self.http_stream is not None
        return self.cap is not None and self.cap.isOpened()

    def connect(self):
        logger.info("Connecting to stream at %s", redact_stream_url(self.url))
        if self.is_http:
            try:
                # Need httpx.Client to keep connection alive
                # trust_env=False bypasses any proxy environment variables that might cause routing issues
                self.http_stream = httpx.stream("GET", self.url, timeout=5.0, trust_env=False)
                # httpx.stream is a context manager, so we need to manually enter it
                self.http_stream_context = self.http_stream.__enter__()
                self.http_stream_context.raise_for_status()
                return True
            except Exception as e:
                logger.error(f"Failed to open HTTP video stream: {str(e)}")
                self.http_stream = None
                self.http_stream_context = None
                return False
        else:
            # Support local webcam by converting "0", "1", etc. to integers
            source = int(self.url) if str(self.url).isdigit() else self.url
            self.cap = cv2.VideoCapture()
            if hasattr(cv2, "CAP_PROP_OPEN_TIMEOUT_MSEC"):
                self.cap.set(cv2.CAP_PROP_OPEN_TIMEOUT_MSEC, STREAM_OPEN_TIMEOUT_MS)
            if hasattr(cv2, "CAP_PROP_READ_TIMEOUT_MSEC"):
                self.cap.set(cv2.CAP_PROP_READ_TIMEOUT_MSEC, STREAM_READ_TIMEOUT_MS)
            self.cap.open(source)
            if not self.cap.isOpened():
                logger.error(
                    "Failed to open video stream: %s",
                    redact_stream_url(str(source)),
                )
                self.close()
                return False
            return True

    def read_frame(self) -> Optional[np.ndarray]:
        if self.is_http:
            if self.http_stream is None:
                if not self.connect():
                    return None
            
            try:
                # Read chunks until we find JPEG start/end markers
                for chunk in self.http_stream_context.iter_bytes(chunk_size=1024):
                    self.bytes_buffer += chunk
                    a = self.bytes_buffer.find(b'\xff\xd8')
                    b = self.bytes_buffer.find(b'\xff\xd9')
                    if a != -1 and b != -1:
                        jpg = self.bytes_buffer[a:b+2]
                        self.bytes_buffer = self.bytes_buffer[b+2:]
                        frame = cv2.imdecode(np.frombuffer(jpg, dtype=np.uint8), cv2.IMREAD_COLOR)
                        return frame
            except Exception as e:
                logger.warning(f"HTTP stream disconnected or error: {str(e)}")
                self.close()
                return None
        else:
            if not self.cap or not self.cap.isOpened():
                if not self.connect():
                    return None

            ret, frame = self.cap.read()
            if not ret:
                logger.warning("Failed to read frame, stream might be disconnected")
                self.close()
                return None
            
            return frame

    def close(self):
        if self.cap:
            self.cap.release()
            self.cap = None
        if hasattr(self, 'http_stream_context') and self.http_stream_context:
            self.http_stream.__exit__(None, None, None)
            self.http_stream_context = None
            self.http_stream = None
        self.bytes_buffer = bytes()
