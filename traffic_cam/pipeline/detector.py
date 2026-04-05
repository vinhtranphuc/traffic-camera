"""Vehicle and traffic object detector using YOLOv8."""

import logging
from dataclasses import dataclass

import numpy as np

logger = logging.getLogger(__name__)

# COCO classes relevant to traffic scenes
TRAFFIC_CLASS_IDS = {
    0: "person",
    1: "bicycle",
    2: "car",
    3: "motorcycle",
    5: "bus",
    7: "truck",
    9: "traffic light",
    11: "stop sign",
}


@dataclass
class Detection:
    """A single detection result."""

    bbox: tuple[int, int, int, int]  # x1, y1, x2, y2
    confidence: float
    class_name: str
    class_id: int


class VehicleDetector:
    """YOLOv8-based traffic object detector.

    Detects vehicles (car, motorcycle, bus, truck), pedestrians,
    bicycles, and traffic signs.
    """

    def __init__(
        self, model_path: str = "yolov8n.pt", confidence: float = 0.3
    ) -> None:
        self._model_path = model_path
        self._confidence = confidence
        self._model = None
        self._loaded = False

    def load_model(self) -> bool:
        """Load the YOLO model."""
        try:
            from ultralytics import YOLO
        except ImportError:
            logger.warning("[Detector] ultralytics not installed.")
            return False

        try:
            self._model = YOLO(self._model_path)
            self._loaded = True
            logger.info("[Detector] Model loaded: %s", self._model_path)
            return True
        except Exception as e:
            logger.error("[Detector] Failed to load model: %s", e)
            return False

    def detect(self, frame: np.ndarray) -> list[Detection]:
        """Run detection on a single frame.

        Returns:
            List of Detection objects for traffic-related objects.
        """
        if not self._loaded or self._model is None:
            return []

        results = self._model(frame, conf=self._confidence, verbose=False)
        detections: list[Detection] = []

        for result in results:
            boxes = result.boxes
            if boxes is None:
                continue
            for box in boxes:
                class_id = int(box.cls[0])
                if class_id not in TRAFFIC_CLASS_IDS:
                    continue
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().astype(int)
                conf = float(box.conf[0])
                detections.append(Detection(
                    bbox=(int(x1), int(y1), int(x2), int(y2)),
                    confidence=conf,
                    class_name=TRAFFIC_CLASS_IDS[class_id],
                    class_id=class_id,
                ))

        return detections

    @property
    def is_loaded(self) -> bool:
        """Check if model is loaded."""
        return self._loaded
