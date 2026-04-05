"""Development environment configuration."""

from dataclasses import dataclass

from .base import BaseConfig


@dataclass
class DevConfig(BaseConfig):
    """Dev config using public MJPEG camera streams."""

    CAMERA_SOURCE: str = "mjpeg"
    CAMERA_URL: str = (
        "http://pendelcam.kip.uni-heidelberg.de/mjpg/video.mjpg"
    )
    ENABLE_LOGGING: bool = True
    PROCESS_EVERY_N: int = 3
