"""RTSP camera source adapter."""

from typing import Any

import cv2
import numpy as np

from .base import CameraSource


class RTSPSource(CameraSource):
    """Camera source for RTSP streams (IP cameras, smartphones)."""

    def __init__(self, url: str) -> None:
        self._url = url
        self._cap: cv2.VideoCapture | None = None

    def connect(self) -> bool:
        """Connect to RTSP stream."""
        self._cap = cv2.VideoCapture(self._url)
        if not self._cap.isOpened():
            print(f"[RTSPSource] Failed to connect: {self._url}")
            return False
        print(f"[RTSPSource] Connected: {self._url}")
        return True

    def read_frame(self) -> tuple[bool, np.ndarray | None]:
        """Read a frame from the RTSP stream."""
        if self._cap is None or not self._cap.isOpened():
            return False, None
        ret, frame = self._cap.read()
        return ret, frame if ret else None

    def release(self) -> None:
        """Release the RTSP stream resource."""
        if self._cap is not None:
            self._cap.release()
            self._cap = None
            print("[RTSPSource] Released.")

    def is_connected(self) -> bool:
        """Check if the RTSP stream is open."""
        return self._cap is not None and self._cap.isOpened()

    @property
    def source_info(self) -> dict[str, Any]:
        """Return source metadata."""
        return {"type": "rtsp", "url": self._url}
