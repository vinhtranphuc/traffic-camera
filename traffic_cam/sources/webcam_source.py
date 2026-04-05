"""Local webcam source adapter."""

from typing import Any

from .base import CVSource


class WebcamSource(CVSource):
    """Camera source for local USB/built-in webcams."""

    def __init__(self, device_index: int = 0) -> None:
        super().__init__()
        self._device_index = device_index

    @property
    def _source_target(self) -> int:
        return self._device_index

    @property
    def _source_label(self) -> str:
        return "WebcamSource"

    @property
    def source_info(self) -> dict[str, Any]:
        return {"type": "webcam", "device_index": self._device_index}
