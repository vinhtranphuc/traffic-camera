"""MJPEG camera source adapter."""

from typing import Any

from .base import CVSource


class MJPEGSource(CVSource):
    """Camera source for MJPEG HTTP streams."""

    def __init__(self, url: str) -> None:
        super().__init__()
        self._url = url

    @property
    def _source_target(self) -> str:
        return self._url

    @property
    def _source_label(self) -> str:
        return "MJPEGSource"

    @property
    def source_info(self) -> dict[str, Any]:
        return {"type": "mjpeg", "url": self._url}
