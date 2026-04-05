"""Vehicle tracker using ByteTrack."""

from dataclasses import dataclass

import numpy as np

from .detector import Detection


@dataclass
class TrackedObject:
    """A tracked object with ID and history."""

    track_id: int
    bbox: tuple[int, int, int, int]
    class_name: str
    confidence: float


class VehicleTracker:
    """ByteTrack-based multi-object tracker.

    Currently a placeholder that passes detections through.
    """

    def __init__(self) -> None:
        self._tracker = None
        self._next_id = 0

    def update(
        self, detections: list[Detection], frame: np.ndarray
    ) -> list[TrackedObject]:
        """Update tracker with new detections.

        Returns:
            List of tracked objects. Empty if no detections.
        """
        if not detections:
            return []
        # TODO: Implement ByteTrack tracking
        return []
