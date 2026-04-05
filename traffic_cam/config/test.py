"""Test environment configuration."""

from dataclasses import dataclass

from .base import BaseConfig


@dataclass
class TestConfig(BaseConfig):
    """Test config using local video files."""

    CAMERA_SOURCE: str = "file"
    CAMERA_URL: str = "data/samples/test_video.mp4"
    ENABLE_LOGGING: bool = False
    PROCESS_EVERY_N: int = 1
