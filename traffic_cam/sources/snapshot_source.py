"""HTTP snapshot camera source adapter.

Periodically fetches JPEG/PNG snapshots from traffic camera APIs
that serve static images updated every few seconds.
"""

import logging
import time
from typing import Any

import cv2
import numpy as np
import requests

from .base import CameraSource

logger = logging.getLogger(__name__)


class SnapshotSource(CameraSource):
    """Camera source that polls JPEG/PNG snapshots from HTTP URLs."""

    def __init__(self, url: str, interval: float = 2.0) -> None:
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
                self._last_frame = self._decode(resp.content)
                if self._last_frame is not None:
                    self._connected = True
                    self._last_fetch = time.time()
                    logger.info("[SnapshotSource] Connected: %s", self._url)
                    return True
        except requests.RequestException as e:
            logger.warning("[SnapshotSource] Connection failed: %s", e)
        return False

    def read_frame(self) -> tuple[bool, np.ndarray | None]:
        """Fetch a new snapshot if interval has elapsed."""
        if not self._connected:
            return False, None

        if time.time() - self._last_fetch >= self._interval:
            try:
                resp = requests.get(self._url, timeout=10)
                if resp.status_code == 200:
                    frame = self._decode(resp.content)
                    if frame is not None:
                        self._last_frame = frame
                        self._last_fetch = time.time()
            except requests.RequestException:
                logger.debug("[SnapshotSource] Fetch failed, using cached frame")

        if self._last_frame is not None:
            return True, self._last_frame
        return False, None

    def release(self) -> None:
        self._connected = False
        self._last_frame = None
        logger.info("[SnapshotSource] Released.")

    def is_connected(self) -> bool:
        return self._connected

    @property
    def source_info(self) -> dict[str, Any]:
        return {"type": "snapshot", "url": self._url, "interval": self._interval}

    @staticmethod
    def _decode(data: bytes) -> np.ndarray | None:
        """Decode raw bytes to OpenCV BGR frame."""
        arr = np.frombuffer(data, dtype=np.uint8)
        return cv2.imdecode(arr, cv2.IMREAD_COLOR)
