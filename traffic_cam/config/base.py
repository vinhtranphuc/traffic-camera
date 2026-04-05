"""Base configuration dataclass for all environments."""

from dataclasses import dataclass, field


@dataclass
class BaseConfig:
    """Base configuration with default values.

    All environment-specific configs inherit from this class
    and override values as needed.
    """

    # Camera source settings
    CAMERA_SOURCE: str = "mjpeg"  # mjpeg, file, rtsp
    CAMERA_URL: str = ""

    # Frame processing
    FRAME_WIDTH: int = 640
    PROCESS_EVERY_N: int = 3

    # Detection
    CONFIDENCE_THRESHOLD: float = 0.4

    # Feature flags
    ENABLE_OCR: bool = False
    ENABLE_TRACKING: bool = False
    ENABLE_LOGGING: bool = True

    # Paths
    LOG_PATH: str = "data/logs"
    MODEL_PATH: str = "data/models"

    @property
    def env_name(self) -> str:
        """Return environment name based on class."""
        return self.__class__.__name__.replace("Config", "").lower()
