"""Local webcam source adapter."""

from typing import Any

import cv2
import numpy as np

from .base import CameraSource


class WebcamSource(CameraSource):
    """Camera source for local USB/built-in webcams."""

    def __init__(self, device_index: int = 0) -> None:
        self._device_index = device_index
        self._cap: cv2.VideoCapture | None = None

    def connect(self) -> bool:
        """Open the webcam device."""
        self._cap = cv2.VideoCapture(self._device_index)
        if not self._cap.isOpened():
            print(f"[WebcamSource] Failed to open device {self._device_index}")
            return False
        print(f"[WebcamSource] Opened device {self._device_index}")
        return True

    def read_frame(self) -> tuple[bool, np.ndarray | None]:
        """Read a frame from the webcam."""
        if self._cap is None or not self._cap.isOpened():
            return False, None
        ret, frame = self._cap.read()
        return ret, frame if ret else None

    def release(self) -> None:
        """Release the webcam resource."""
        if self._cap is not None:
            self._cap.release()
            self._cap = None
            print("[WebcamSource] Released.")

    def is_connected(self) -> bool:
        """Check if the webcam is open."""
        return self._cap is not None and self._cap.isOpened()

    @property
    def source_info(self) -> dict[str, Any]:
        """Return source metadata."""
        return {"type": "webcam", "device_index": self._device_index}
