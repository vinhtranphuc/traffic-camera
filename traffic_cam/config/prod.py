"""Production environment configuration."""

from dataclasses import dataclass

from .base import BaseConfig


@dataclass
class ProdConfig(BaseConfig):
    """Prod config using RTSP streams from IP cameras."""

    CAMERA_SOURCE: str = "rtsp"
    CAMERA_URL: str = "rtsp://username:password@camera-ip:554/stream"
    ENABLE_OCR: bool = True
    ENABLE_TRACKING: bool = True
    ENABLE_LOGGING: bool = True
    PROCESS_EVERY_N: int = 2
