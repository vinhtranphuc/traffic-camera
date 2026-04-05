"""Vehicle and traffic object detector using YOLOv8."""

import logging
from dataclasses import dataclass
from enum import IntEnum

import numpy as np

logger = logging.getLogger(__name__)


class TrafficClass(IntEnum):
    """COCO class IDs relevant to traffic scenes."""

    PERSON = 0
    BICYCLE = 1
    CAR = 2
    MOTORCYCLE = 3
    BUS = 5
    TRUCK = 7
    TRAFFIC_LIGHT = 9
    STOP_SIGN = 11


TRAFFIC_CLASS_NAMES: dict[int, str] = {c.value: c.name.lower().replace("_", " ") for c in TrafficClass}
VEHICLE_CLASS_IDS: set[int] = {TrafficClass.CAR, TrafficClass.MOTORCYCLE, TrafficClass.BUS, TrafficClass.TRUCK}


@dataclass(frozen=True, slots=True)
class Detection:
    """A single detection result."""

    bbox: tuple[int, int, int, int]  # x1, y1, x2, y2
    confidence: float
    class_name: str
    class_id: int


class VehicleDetector:
    """YOLOv8-based traffic object detector."""

    def __init__(self, model_path: str = "yolov8n.pt", confidence: float = 0.25) -> None:
        self._model_path = model_path
        self._confidence = confidence
        self._model = None
        self._loaded = False

    def load_model(self) -> bool:
        """Load the YOLO model. Returns True on success."""
        try:
            from ultralytics import YOLO
            self._model = YOLO(self._model_path)
            self._loaded = True
            logger.info("[Detector] Loaded: %s", self._model_path)
            return True
        except ImportError:
            logger.warning("[Detector] ultralytics not installed.")
        except Exception as e:
            logger.error("[Detector] Failed: %s", e)
        return False

    def detect(self, frame: np.ndarray) -> list[Detection]:
        """Run detection on a frame. Returns list of traffic-related detections."""
        if not self._loaded or self._model is None:
            return []

        results = self._model(frame, conf=self._confidence, verbose=False)
        detections: list[Detection] = []

        for result in results:
            if result.boxes is None:
                continue
            for box in result.boxes:
                cls_id = int(box.cls[0])
                if cls_id not in TRAFFIC_CLASS_NAMES:
                    continue
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().astype(int)
                detections.append(Detection(
                    bbox=(int(x1), int(y1), int(x2), int(y2)),
                    confidence=float(box.conf[0]),
                    class_name=TRAFFIC_CLASS_NAMES[cls_id],
                    class_id=cls_id,
                ))

        return detections

    @property
    def is_loaded(self) -> bool:
        return self._loaded
