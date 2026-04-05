"""Abstract base class for camera sources."""

from abc import ABC, abstractmethod
from typing import Any

import numpy as np


class CameraSource(ABC):
    """Abstract base class for all camera source adapters.

    Supports context manager protocol to ensure proper resource cleanup.
    """

    @abstractmethod
    def connect(self) -> bool:
        """Establish connection to the camera source."""

    @abstractmethod
    def read_frame(self) -> tuple[bool, np.ndarray | None]:
        """Read a single frame from the source.

        Returns:
            Tuple of (success, frame). Frame is None if read failed.
        """

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
