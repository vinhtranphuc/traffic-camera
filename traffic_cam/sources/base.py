"""Abstract base classes for camera sources."""

import logging
from abc import ABC, abstractmethod
from typing import Any

import cv2
import numpy as np

logger = logging.getLogger(__name__)


class CameraSource(ABC):
    """Abstract base class for all camera source adapters.

    Supports context manager protocol to ensure proper resource cleanup.
    """

    @abstractmethod
    def connect(self) -> bool:
        """Establish connection to the camera source."""

    @abstractmethod
    def read_frame(self) -> tuple[bool, np.ndarray | None]:
        """Read a single frame from the source."""

    @abstractmethod
    def release(self) -> None:
        """Release camera resources."""

    @abstractmethod
    def is_connected(self) -> bool:
        """Check if the source is currently connected."""

    @property
    @abstractmethod
    def source_info(self) -> dict[str, Any]:
        """Return metadata about the source."""

    def __enter__(self) -> "CameraSource":
        self.connect()
        return self

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        self.release()


class CVSource(CameraSource):
    """Base class for sources backed by cv2.VideoCapture.

    Provides shared connect/read/release/is_connected logic.
    Subclasses only need to set _source_target and override source_info.
    """

    def __init__(self) -> None:
        self._cap: cv2.VideoCapture | None = None

    @property
    @abstractmethod
    def _source_target(self) -> str | int:
        """Return the target for cv2.VideoCapture (URL, path, or device index)."""

    @property
    @abstractmethod
    def _source_label(self) -> str:
        """Human-readable label for log messages (e.g. 'MJPEGSource')."""

    def connect(self) -> bool:
        """Open the source via cv2.VideoCapture."""
        self._cap = cv2.VideoCapture(self._source_target)
        if not self._cap.isOpened():
            logger.warning("[%s] Failed to connect: %s", self._source_label, self._source_target)
            return False
        logger.info("[%s] Connected: %s", self._source_label, self._source_target)
        return True

    def read_frame(self) -> tuple[bool, np.ndarray | None]:
        """Read a frame from the capture device."""
        if self._cap is None or not self._cap.isOpened():
            return False, None
        ret, frame = self._cap.read()
        return ret, frame if ret else None

    def release(self) -> None:
        """Release the cv2.VideoCapture resource."""
        if self._cap is not None:
            self._cap.release()
            self._cap = None
            logger.info("[%s] Released.", self._source_label)

    def is_connected(self) -> bool:
        """Check if the capture device is open."""
        return self._cap is not None and self._cap.isOpened()
