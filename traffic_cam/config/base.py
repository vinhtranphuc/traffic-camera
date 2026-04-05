"""Base configuration dataclass for all environments."""

from dataclasses import dataclass


@dataclass
class BaseConfig:
    """Base configuration with default values.

    All environment-specific configs inherit and override as needed.
    """

    CAMERA_SOURCE: str = "mjpeg"
    CAMERA_URL: str = ""
    FRAME_WIDTH: int = 640
    PROCESS_EVERY_N: int = 3
    CONFIDENCE_THRESHOLD: float = 0.4
    ENABLE_OCR: bool = False
    ENABLE_TRACKING: bool = False
    ENABLE_LOGGING: bool = True
    LOG_PATH: str = "data/logs"
    MODEL_PATH: str = "data/models"
