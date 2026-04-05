"""HTTP snapshot camera source adapter.

Periodically fetches JPEG/PNG snapshots from public traffic camera APIs
(e.g., Caltrans, TfL JamCam, VDOT) that serve static images updated
every few seconds.
"""

import time
from typing import Any

import cv2
import numpy as np
import requests

from .base import CameraSource


class SnapshotSource(CameraSource):
    """Camera source that polls JPEG/PNG snapshots from HTTP URLs.

    Works with APIs that serve periodically-updated static images
    rather than continuous video streams.
    """

    def __init__(self, url: str, interval: float = 2.0) -> None:
        """Initialize snapshot source.

        Args:
            url: HTTP URL to the snapshot image.
            interval: Seconds between fetches (default 2s).
        """
        self._url = url
        self._interval = interval
        self._connected = False
        self._last_fetch: float = 0
        self._last_frame: np.ndarray | None = None

    def connect(self) -> bool:
        """Verify the snapshot URL is reachable."""
        try:
            resp = requests.get(self._url, timeout=10)
            if resp.status_code == 200 and len(resp.content) > 0:
                self._connected = True
                self._last_frame = self._decode_image(resp.content)
                self._last_fetch = time.time()
                print(f"[SnapshotSource] Connected: {self._url}")
                return True
        except requests.RequestException as e:
            print(f"[SnapshotSource] Connection failed: {e}")
        return False

    def read_frame(self) -> tuple[bool, np.ndarray | None]:
        """Fetch a new snapshot if interval has elapsed.

        Returns cached frame if called faster than the interval.
        """
        if not self._connected:
            return False, None

        now = time.time()
        if now - self._last_fetch >= self._interval:
            try:
                resp = requests.get(self._url, timeout=10)
                if resp.status_code == 200:
                    frame = self._decode_image(resp.content)
                    if frame is not None:
                        self._last_frame = frame
                        self._last_fetch = now
            except requests.RequestException:
                pass  # Return cached frame on error

        if self._last_frame is not None:
            return True, self._last_frame
        return False, None

    def release(self) -> None:
        """Mark source as disconnected."""
        self._connected = False
        self._last_frame = None
        print("[SnapshotSource] Released.")

    def is_connected(self) -> bool:
        """Check connection status."""
        return self._connected

    @property
    def source_info(self) -> dict[str, Any]:
        """Return source metadata."""
        return {
            "type": "snapshot",
            "url": self._url,
            "interval": self._interval,
        }

    @staticmethod
    def _decode_image(data: bytes) -> np.ndarray | None:
        """Decode raw image bytes to OpenCV BGR frame."""
        arr = np.frombuffer(data, dtype=np.uint8)
        frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        return frame
