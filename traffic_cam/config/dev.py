"""Development environment configuration."""

from dataclasses import dataclass

from .base import BaseConfig


@dataclass
class DevConfig(BaseConfig):
    """Dev config using RTSP stream from DVT camera system."""

    CAMERA_SOURCE: str = "rtsp"
    CAMERA_URL: str = (
        "rtsp://admin:dvt%4012345@123.19.195.7:554"
        "/1/1?transmode=unicast&profile=v"
    )
    ENABLE_LOGGING: bool = True
    PROCESS_EVERY_N: int = 2  # Skip every other frame (RTSP is 15fps)
