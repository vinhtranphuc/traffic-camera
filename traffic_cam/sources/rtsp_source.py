"""RTSP camera source adapter."""

from typing import Any

from .base import CVSource


class RTSPSource(CVSource):
    """Camera source for RTSP streams (IP cameras, smartphones)."""

    def __init__(self, url: str) -> None:
        super().__init__()
        self._url = url

    @property
    def _source_target(self) -> str:
        return self._url

    @property
    def _source_label(self) -> str:
        return "RTSPSource"

    @property
    def source_info(self) -> dict[str, Any]:
        return {"type": "rtsp", "url": self._url}
