"""Video file camera source adapter."""

import logging
from pathlib import Path
from typing import Any

import numpy as np

from .base import CVSource

logger = logging.getLogger(__name__)


class FileSource(CVSource):
    """Camera source for local video files with optional looping."""

    def __init__(self, path: str, loop: bool = True) -> None:
        super().__init__()
        self._path = path
        self._loop = loop

    @property
    def _source_target(self) -> str:
        return self._path

    @property
    def _source_label(self) -> str:
        return "FileSource"

    def connect(self) -> bool:
        """Open the video file (checks existence first)."""
        if not Path(self._path).exists():
            logger.warning("[FileSource] File not found: %s", self._path)
            return False
        return super().connect()

    def read_frame(self) -> tuple[bool, np.ndarray | None]:
        """Read a frame, looping back to start if enabled."""
        ret, frame = super().read_frame()
        if not ret and self._loop and self._cap is not None:
            self._cap.set(0, 0)  # CAP_PROP_POS_FRAMES
            ret, frame = super().read_frame()
        return ret, frame

    @property
    def source_info(self) -> dict[str, Any]:
        return {"type": "file", "path": self._path, "loop": self._loop}
