"""Tests for camera source factory and adapters."""

import pytest

from traffic_cam.config import get_config
from traffic_cam.config.base import BaseConfig
from traffic_cam.sources import create_source
from traffic_cam.sources.file_source import FileSource
from traffic_cam.sources.mjpeg_source import MJPEGSource
from traffic_cam.sources.rtsp_source import RTSPSource
from traffic_cam.sources.webcam_source import WebcamSource


class TestGetConfig:
    """Test config factory function."""

    def test_dev_config(self) -> None:
        config = get_config("dev")
        assert config.CAMERA_SOURCE == "webcam"
        assert config.CAMERA_URL == "0"

    def test_test_config(self) -> None:
        config = get_config("test")
        assert config.CAMERA_SOURCE == "file"

    def test_prod_config(self) -> None:
        config = get_config("prod")
        assert config.CAMERA_SOURCE == "rtsp"

    def test_invalid_env(self) -> None:
        with pytest.raises(ValueError, match="Unknown environment"):
            get_config("invalid")

    def test_base_config_defaults(self) -> None:
        config = BaseConfig()
        assert config.FRAME_WIDTH == 640
        assert config.PROCESS_EVERY_N == 3
        assert config.CONFIDENCE_THRESHOLD == 0.4


class TestCreateSource:
    """Test camera source factory function."""

    def test_create_webcam_source(self) -> None:
        config = get_config("dev")
        source = create_source(config)
        assert isinstance(source, WebcamSource)

    def test_create_mjpeg_source(self) -> None:
        config = BaseConfig(CAMERA_SOURCE="mjpeg", CAMERA_URL="http://example.com/stream")
        source = create_source(config)
        assert isinstance(source, MJPEGSource)

    def test_create_file_source(self) -> None:
        config = get_config("test")
        source = create_source(config)
        assert isinstance(source, FileSource)

    def test_create_rtsp_source(self) -> None:
        config = get_config("prod")
        source = create_source(config)
        assert isinstance(source, RTSPSource)

    def test_invalid_source_type(self) -> None:
        config = BaseConfig(CAMERA_SOURCE="unknown")
        with pytest.raises(ValueError, match="Unknown source type"):
            create_source(config)


class TestFileSource:
    """Test FileSource adapter."""

    def test_connect_missing_file(self) -> None:
        source = FileSource("nonexistent_video.mp4")
        assert source.connect() is False

    def test_not_connected_initially(self) -> None:
        source = FileSource("test.mp4")
        assert source.is_connected() is False

    def test_source_info(self) -> None:
        source = FileSource("test.mp4", loop=True)
        info = source.source_info
        assert info["type"] == "file"
        assert info["path"] == "test.mp4"
        assert info["loop"] is True

    def test_read_frame_not_connected(self) -> None:
        source = FileSource("test.mp4")
        ret, frame = source.read_frame()
        assert ret is False
        assert frame is None
