"""Development environment configuration."""

from dataclasses import dataclass

from .base import BaseConfig


@dataclass
class DevConfig(BaseConfig):
    """Dev config using local webcam for reliable development."""

    CAMERA_SOURCE: str = "webcam"
    CAMERA_URL: str = "0"
    ENABLE_LOGGING: bool = True
    PROCESS_EVERY_N: int = 3
