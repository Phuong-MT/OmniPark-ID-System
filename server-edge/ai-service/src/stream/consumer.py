import cv2
import logging
import os
import time
import numpy as np
from typing import Optional

logger = logging.getLogger(__name__)

class StreamConsumer:
    def __init__(self, url: str):
        self.url = url
        self.cap = None

    def connect(self):
        logger.info(f"Connecting to stream at {self.url}")
        source = int(self.url) if str(self.url).isdigit() else self.url
        
        if str(source).startswith("rtsp://"):
            os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp"
            
        self.cap = cv2.VideoCapture(source, cv2.CAP_FFMPEG)
        logger.info(f"VideoCapture opened={self.cap.isOpened()} source={source}")
        
        if not self.cap.isOpened():
            logger.error(f"Failed to open video stream: {source}")
            return False
        return True

    def read_frame(self) -> Optional[np.ndarray]:
        if not self.cap or not self.cap.isOpened():
            if not self.connect():
                time.sleep(5)
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
