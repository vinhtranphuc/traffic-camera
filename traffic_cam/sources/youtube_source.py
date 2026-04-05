"""YouTube live stream source adapter.

Uses yt-dlp to extract the direct stream URL, then reads frames
via cv2.VideoCapture on the HLS/DASH stream.
"""

import logging
from typing import Any

import cv2
import numpy as np
import yt_dlp

from .base import CameraSource

logger = logging.getLogger(__name__)


class YouTubeSource(CameraSource):
    """Camera source for YouTube live streams and videos."""

    def __init__(self, url: str, max_height: int = 720) -> None:
        self._url = url
        self._max_height = max_height
        self._stream_url: str = ""
        self._cap: cv2.VideoCapture | None = None
        self._title: str = ""
        self._is_live: bool = False
        self._error: str = ""

    def connect(self) -> bool:
        """Extract stream URL via yt-dlp and open with OpenCV."""
        logger.info("[YouTubeSource] Extracting stream: %s", self._url)
        try:
            self._extract_stream_info()
        except Exception as e:
            self._error = str(e).encode("ascii", "replace").decode()
            logger.error("[YouTubeSource] yt-dlp failed: %s", self._error)
            return False

        if not self._stream_url:
            self._error = "No stream URL found"
            return False

        self._cap = cv2.VideoCapture(self._stream_url)
        self._cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

        if not self._cap.isOpened():
            self._error = "OpenCV failed to open stream"
            return False

        logger.info("[YouTubeSource] Connected: %s",
                     self._title.encode("ascii", "replace").decode())
        return True

    def read_frame(self) -> tuple[bool, np.ndarray | None]:
        if self._cap is None or not self._cap.isOpened():
            return False, None
        ret, frame = self._cap.read()
        return ret, frame if ret else None

    def release(self) -> None:
        if self._cap is not None:
            self._cap.release()
            self._cap = None
            logger.info("[YouTubeSource] Released.")

    def is_connected(self) -> bool:
        return self._cap is not None and self._cap.isOpened()

    @property
    def source_info(self) -> dict[str, Any]:
        return {
            "type": "youtube",
            "url": self._url,
            "title": self._title,
            "is_live": self._is_live,
            "error": self._error,
        }

    def _extract_stream_info(self) -> None:
        """Use yt-dlp to extract the direct stream URL and metadata."""
        ydl_opts = {
            "format": f"best[height<={self._max_height}]",
            "quiet": True,
            "no_warnings": True,
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(self._url, download=False)
            self._title = info.get("title", "Unknown")
            self._is_live = info.get("is_live", False)
            self._stream_url = info.get("url", "")
