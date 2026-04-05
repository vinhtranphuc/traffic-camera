"""Tests for camera sources and config."""

import pytest

from traffic_cam.config import get_config
from traffic_cam.config.base import BaseConfig
from traffic_cam.sources import create_source
from traffic_cam.sources.base import CVSource
from traffic_cam.sources.file_source import FileSource
from traffic_cam.sources.mjpeg_source import MJPEGSource
from traffic_cam.sources.rtsp_source import RTSPSource
from traffic_cam.sources.snapshot_source import SnapshotSource
from traffic_cam.sources.webcam_source import WebcamSource


class TestGetConfig:
    def test_dev_config(self) -> None:
        config = get_config("dev")
        assert config.CAMERA_SOURCE == "snapshot"
        assert "dot.ca.gov" in config.CAMERA_URL

    def test_test_config(self) -> None:
        assert get_config("test").CAMERA_SOURCE == "file"

    def test_prod_config(self) -> None:
        assert get_config("prod").CAMERA_SOURCE == "rtsp"

    def test_invalid_env(self) -> None:
        with pytest.raises(ValueError, match="Unknown environment"):
            get_config("invalid")

    def test_base_config_defaults(self) -> None:
        config = BaseConfig()
        assert config.FRAME_WIDTH == 640
        assert config.PROCESS_EVERY_N == 3
        assert config.CONFIDENCE_THRESHOLD == 0.4


class TestCreateSource:
    def test_create_snapshot_source(self) -> None:
        assert isinstance(create_source(get_config("dev")), SnapshotSource)

    def test_create_file_source(self) -> None:
        assert isinstance(create_source(get_config("test")), FileSource)

    def test_create_rtsp_source(self) -> None:
        assert isinstance(create_source(get_config("prod")), RTSPSource)

    def test_create_webcam_source(self) -> None:
        config = BaseConfig(CAMERA_SOURCE="webcam", CAMERA_URL="0")
        assert isinstance(create_source(config), WebcamSource)

    def test_create_mjpeg_source(self) -> None:
        config = BaseConfig(CAMERA_SOURCE="mjpeg", CAMERA_URL="http://example.com/stream")
        assert isinstance(create_source(config), MJPEGSource)

    def test_invalid_source_type(self) -> None:
        with pytest.raises(ValueError, match="Unknown source type"):
            create_source(BaseConfig(CAMERA_SOURCE="unknown"))


class TestCVSourceInheritance:
    """Verify that CV-based sources share the CVSource base."""

    def test_mjpeg_is_cvsource(self) -> None:
        assert issubclass(MJPEGSource, CVSource)

    def test_rtsp_is_cvsource(self) -> None:
        assert issubclass(RTSPSource, CVSource)

    def test_webcam_is_cvsource(self) -> None:
        assert issubclass(WebcamSource, CVSource)

    def test_file_is_cvsource(self) -> None:
        assert issubclass(FileSource, CVSource)

    def test_snapshot_is_not_cvsource(self) -> None:
        assert not issubclass(SnapshotSource, CVSource)


class TestFileSource:
    def test_connect_missing_file(self) -> None:
        assert FileSource("nonexistent.mp4").connect() is False

    def test_not_connected_initially(self) -> None:
        assert FileSource("test.mp4").is_connected() is False

    def test_source_info(self) -> None:
        info = FileSource("test.mp4", loop=True).source_info
        assert info == {"type": "file", "path": "test.mp4", "loop": True}

    def test_read_frame_not_connected(self) -> None:
        ret, frame = FileSource("test.mp4").read_frame()
        assert ret is False
        assert frame is None


class TestDetector:
    def test_detect_without_model(self) -> None:
        from traffic_cam.pipeline.detector import VehicleDetector
        det = VehicleDetector()
        assert det.detect(__import__("numpy").zeros((100, 100, 3), dtype="uint8")) == []

    def test_is_loaded_default(self) -> None:
        from traffic_cam.pipeline.detector import VehicleDetector
        assert VehicleDetector().is_loaded is False


class TestStreamMode:
    def test_enum_values(self) -> None:
        from web.server import StreamMode
        assert StreamMode.VIEW.run_detect is False
        assert StreamMode.DETECT.run_detect is True
        assert StreamMode.DETECT.run_ocr is False
        assert StreamMode.OCR.run_ocr is True
        assert StreamMode.FULL.show_boxes is True
        assert StreamMode.OCR.show_boxes is False
