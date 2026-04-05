"""YouTube live stream source adapter.

Uses yt-dlp to extract the direct stream URL from a YouTube video,
then reads frames via OpenCV VideoCapture.
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
            self._stream_url = self._extract_stream_url()
        except Exception as e:
            self._error = str(e).encode("ascii", "replace").decode()
            logger.error("[YouTubeSource] yt-dlp failed: %s", self._error)
            return False

        if not self._stream_url:
            self._error = "No stream URL found"
            logger.warning("[YouTubeSource] %s", self._error)
            return False

        self._cap = cv2.VideoCapture(self._stream_url)
        # Reduce latency for live streams
        self._cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        if not self._cap.isOpened():
            self._error = "OpenCV failed to open stream"
            logger.error("[YouTubeSource] %s", self._error)
            return False

        safe_title = self._title.encode("ascii", "replace").decode()
        logger.info("[YouTubeSource] Connected: %s", safe_title)
        return True

    def read_frame(self) -> tuple[bool, np.ndarray | None]:
        """Read a frame from the YouTube stream."""
        if self._cap is None or not self._cap.isOpened():
            return False, None
        ret, frame = self._cap.read()
        return ret, frame if ret else None

    def release(self) -> None:
        """Release the video capture resource."""
        if self._cap is not None:
            self._cap.release()
            self._cap = None
            print("[YouTubeSource] Released.")

    def is_connected(self) -> bool:
        """Check if the stream is open."""
        return self._cap is not None and self._cap.isOpened()

    @property
    def source_info(self) -> dict[str, Any]:
        """Return source metadata."""
        return {
            "type": "youtube",
            "url": self._url,
            "title": self._title,
            "is_live": self._is_live,
            "error": self._error,
        }

    def _extract_stream_url(self) -> str:
        """Use yt-dlp to get the direct stream URL."""
        ydl_opts = {
            "format": f"best[height<={self._max_height}]",
            "quiet": True,
            "no_warnings": True,
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(self._url, download=False)
            self._title = info.get("title", "Unknown")
            self._is_live = info.get("is_live", False)
            return info.get("url", "")
