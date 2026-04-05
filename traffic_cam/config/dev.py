"""Development environment configuration."""

from dataclasses import dataclass

from .base import BaseConfig


@dataclass
class DevConfig(BaseConfig):
    """Dev config using Caltrans LA traffic camera snapshots."""

    CAMERA_SOURCE: str = "snapshot"
    CAMERA_URL: str = (
        "https://cwwp2.dot.ca.gov/data/d7/cctv/image/"
        "i110196avenue26offramp/i110196avenue26offramp.jpg"
    )
    ENABLE_LOGGING: bool = True
    PROCESS_EVERY_N: int = 1  # Process every frame (snapshots are slow)
