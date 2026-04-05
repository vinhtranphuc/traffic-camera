"""Video file camera source adapter."""

from pathlib import Path
from typing import Any

import cv2
import numpy as np

from .base import CameraSource


class FileSource(CameraSource):
    """Camera source for local video files with optional looping."""

    def __init__(self, path: str, loop: bool = True) -> None:
        self._path = path
        self._loop = loop
        self._cap: cv2.VideoCapture | None = None

    def connect(self) -> bool:
        """Open the video file."""
        if not Path(self._path).exists():
            print(f"[FileSource] File not found: {self._path}")
            return False
        self._cap = cv2.VideoCapture(self._path)
        if not self._cap.isOpened():
            print(f"[FileSource] Failed to open: {self._path}")
            return False
        print(f"[FileSource] Opened: {self._path}")
        return True

    def read_frame(self) -> tuple[bool, np.ndarray | None]:
        """Read a frame, optionally looping back to start."""
        if self._cap is None or not self._cap.isOpened():
            return False, None
        ret, frame = self._cap.read()
        if not ret and self._loop:
            self._cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            ret, frame = self._cap.read()
        return ret, frame if ret else None

    def release(self) -> None:
        """Release the video file resource."""
        if self._cap is not None:
            self._cap.release()
            self._cap = None
            print("[FileSource] Released.")

    def is_connected(self) -> bool:
        """Check if the file is open."""
        return self._cap is not None and self._cap.isOpened()

    @property
    def source_info(self) -> dict[str, Any]:
        """Return source metadata."""
        return {
            "type": "file",
            "path": self._path,
            "loop": self._loop,
        }
