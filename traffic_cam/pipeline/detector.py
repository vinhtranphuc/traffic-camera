"""Vehicle detector using YOLOv8."""

from dataclasses import dataclass

import numpy as np


@dataclass
class Detection:
    """A single detection result."""

    bbox: tuple[int, int, int, int]  # x1, y1, x2, y2
    confidence: float
    class_name: str
    class_id: int


class VehicleDetector:
    """YOLOv8-based vehicle detector.

    Currently a placeholder that returns empty results.
    Load a real model by placing weights in data/models/.
    """

    def __init__(self, model_path: str = "", confidence: float = 0.4) -> None:
        self._model_path = model_path
        self._confidence = confidence
        self._model = None
        self._loaded = False

    def load_model(self) -> bool:
        """Load the YOLO model from disk."""
        if not self._model_path:
            print("[Detector] No model path set, running in stub mode.")
            return False
        # TODO: Load ultralytics YOLO model
        # self._model = YOLO(self._model_path)
        print(f"[Detector] Model placeholder: {self._model_path}")
        self._loaded = True
        return True

    def detect(self, frame: np.ndarray) -> list[Detection]:
        """Run detection on a single frame.

        Returns:
            List of Detection objects. Empty if model not loaded.
        """
        if not self._loaded:
            return []
        # TODO: Run inference with self._model
        return []

    @property
    def is_loaded(self) -> bool:
        """Check if model is loaded."""
        return self._loaded
