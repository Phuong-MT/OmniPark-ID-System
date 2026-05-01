from abc import ABC, abstractmethod
import numpy as np

class InferenceEngine(ABC):
    @abstractmethod
    def load_models(self, vehicle_model_path: str, plate_model_path: str):
        pass

    @abstractmethod
    def infer(self, frame: np.ndarray) -> list[dict]:
        """
        Run inference on a single frame.
        Returns a list of detected vehicles:
        [
            {
                "label": "car", # or truck, motorcycle, bus
                "confidence": 0.95,
                "bbox": [x1, y1, x2, y2],
                "plate": {
                    "text": "29A-12345",
                    "confidence": 0.98,
                    "bbox": [px1, py1, px2, py2]
                } # Optional, if plate is detected
            }
        ]
        """
        pass
