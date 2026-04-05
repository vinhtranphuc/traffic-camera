"""Camera source module with factory function."""

from __future__ import annotations

from typing import TYPE_CHECKING

from .base import CameraSource, CVSource
from .file_source import FileSource
from .mjpeg_source import MJPEGSource
from .rtsp_source import RTSPSource
from .snapshot_source import SnapshotSource
from .webcam_source import WebcamSource
from .youtube_source import YouTubeSource

if TYPE_CHECKING:
    from traffic_cam.config.base import BaseConfig

_SOURCE_MAP: dict[str, type[CameraSource]] = {
    "mjpeg": MJPEGSource,
    "file": FileSource,
    "rtsp": RTSPSource,
    "webcam": WebcamSource,
    "snapshot": SnapshotSource,
    "youtube": YouTubeSource,
}


def create_source(config: BaseConfig) -> CameraSource:
    """Create a camera source instance based on config."""
    source_type = config.CAMERA_SOURCE.lower()
    if source_type not in _SOURCE_MAP:
        raise ValueError(
            f"Unknown source type: '{source_type}'. "
            f"Choose from: {', '.join(_SOURCE_MAP)}"
        )

    url = config.CAMERA_URL
    match source_type:
        case "webcam":
            return WebcamSource(int(url) if url.isdigit() else 0)
        case "file":
            return FileSource(url, loop=True)
        case "snapshot":
            return SnapshotSource(url, interval=2.0)
        case _:
            return _SOURCE_MAP[source_type](url)
