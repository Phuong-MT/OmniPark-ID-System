import subprocess
import logging
import numpy as np

logger = logging.getLogger(__name__)

class StreamPublisher:
    def __init__(self, publish_url: str, width: int, height: int, fps: int = 10):
        self.publish_url = publish_url
        self.width = width
        self.height = height
        self.fps = fps
        self.process = None

    def start(self):
        """
        Spawn FFmpeg subprocess to publish raw BGR24 frames via RTSP.
        """
        logger.info(f"Starting FFmpeg publisher for {self.publish_url} at {self.width}x{self.height} @ {self.fps}fps")
        
        command = [
            'ffmpeg',
            '-y',
            '-f', 'rawvideo',
            '-vcodec', 'rawvideo',
            '-pix_fmt', 'bgr24',
            '-s', f'{self.width}x{self.height}',
            '-r', str(self.fps),
            '-i', '-',  # read from stdin
            '-c:v', 'libx264',
            '-pix_fmt', 'yuv420p',
            '-preset', 'ultrafast',
            '-tune', 'zerolatency',
            '-f', 'rtsp',
            '-rtsp_transport', 'tcp',
            self.publish_url
        ]
        
        try:
            self.process = subprocess.Popen(
                command,
                stdin=subprocess.PIPE,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.PIPE,  # Capture error messages for debugging
                bufsize=10 ** 7          # Large buffer size
            )
            logger.info("FFmpeg subprocess spawned successfully.")
        except Exception as e:
            logger.error(f"Failed to start FFmpeg subprocess: {str(e)}")
            self.process = None

    def write_frame(self, frame: np.ndarray):
        """
        Write a single frame to FFmpeg's stdin.
        """
        if self.process is None or self.process.poll() is not None:
            # Subprocess not running or died. Attempt to restart.
            logger.warning("FFmpeg process is not running. Attempting restart...")
            if self.process and self.process.stderr:
                err = self.process.stderr.read().decode('utf-8', errors='ignore')
                logger.error(f"FFmpeg exit logs: {err}")
            self.start()
            if self.process is None:
                return

        try:
            self.process.stdin.write(frame.tobytes())
            self.process.stdin.flush()
        except Exception as e:
            logger.error(f"Error writing frame to FFmpeg stdin: {str(e)}")
            self.close()

    def close(self):
        """
        Cleanly terminate FFmpeg subprocess.
        """
        if self.process:
            logger.info(f"Closing FFmpeg stream publisher for {self.publish_url}")
            try:
                if self.process.stdin:
                    self.process.stdin.close()
                self.process.terminate()
                self.process.wait(timeout=2.0)
            except subprocess.TimeoutExpired:
                logger.warning("FFmpeg did not terminate. Killing...")
                self.process.kill()
            except Exception as e:
                logger.error(f"Error during FFmpeg shutdown: {str(e)}")
            finally:
                self.process = None
