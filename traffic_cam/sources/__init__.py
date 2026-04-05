"""Camera source module with factory function."""

from traffic_cam.config.base import BaseConfig

from .base import CameraSource
from .file_source import FileSource
from .mjpeg_source import MJPEGSource
from .rtsp_source import RTSPSource
from .snapshot_source import SnapshotSource
from .webcam_source import WebcamSource

_SOURCE_MAP: dict[str, type[CameraSource]] = {
    "mjpeg": MJPEGSource,
    "file": FileSource,
    "rtsp": RTSPSource,
    "webcam": WebcamSource,
    "snapshot": SnapshotSource,
}


def create_source(config: BaseConfig) -> CameraSource:
    """Create a camera source instance based on config.

    Args:
        config: Application config with CAMERA_SOURCE and CAMERA_URL.

    Returns:
        CameraSource instance ready to connect.
    """
    source_type = config.CAMERA_SOURCE.lower()
    source_cls = _SOURCE_MAP.get(source_type)
    if source_cls is None:
        raise ValueError(
            f"Unknown source type: '{source_type}'. "
            f"Choose from: {', '.join(_SOURCE_MAP.keys())}"
        )

    if source_cls is WebcamSource:
        device_index = int(config.CAMERA_URL) if config.CAMERA_URL.isdigit() else 0
        return WebcamSource(device_index)
    if source_cls is FileSource:
        return FileSource(config.CAMERA_URL, loop=True)
    if source_cls is SnapshotSource:
        return SnapshotSource(config.CAMERA_URL, interval=2.0)
    return source_cls(config.CAMERA_URL)
