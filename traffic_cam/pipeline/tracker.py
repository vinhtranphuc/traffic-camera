"""Vehicle tracker placeholder.

Tracking (e.g. ByteTrack) will be implemented when needed.
"""

from dataclasses import dataclass

import numpy as np

from .detector import Detection


@dataclass(frozen=True, slots=True)
class TrackedObject:
    """A tracked object with persistent ID."""

    track_id: int
    bbox: tuple[int, int, int, int]
    class_name: str
    confidence: float


class VehicleTracker:
    """Multi-object tracker placeholder."""

    def update(
        self, detections: list[Detection], frame: np.ndarray
    ) -> list[TrackedObject]:
        """Update tracker with new detections. Returns empty until implemented."""
        return []
