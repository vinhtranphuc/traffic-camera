"""Flask web server for Traffic Camera UI."""

import json
import threading
import time
from enum import Enum
from typing import Generator

import cv2
import numpy as np
import requests
from flask import Flask, Response, jsonify, render_template, request

from traffic_cam.pipeline.detector import VEHICLE_CLASS_IDS, Detection, VehicleDetector
from traffic_cam.pipeline.ocr import PlateOCR, PlateResult
from traffic_cam.sources.base import CameraSource
from traffic_cam.sources.file_source import FileSource
from traffic_cam.sources.mjpeg_source import MJPEGSource
from traffic_cam.sources.rtsp_source import RTSPSource
from traffic_cam.sources.snapshot_source import SnapshotSource
from traffic_cam.sources.webcam_source import WebcamSource
from traffic_cam.sources.youtube_source import YouTubeSource
from traffic_cam.utils.helpers import resize_frame
from web.camera_presets import get_presets

DISPLAY_WIDTH = 960
DETECT_EVERY_N = 3
OCR_EVERY_N = 9
MAX_EVENTS = 500
JPEG_QUALITY = 80

# BGR color per detection class
CLASS_COLORS: dict[str, tuple[int, int, int]] = {
    "car": (0, 255, 0),
    "motorcycle": (0, 200, 255),
    "bus": (255, 100, 0),
    "truck": (0, 100, 255),
    "person": (255, 255, 0),
    "bicycle": (255, 0, 255),
    "traffic light": (0, 255, 255),
    "stop sign": (0, 0, 255),
}


class StreamMode(str, Enum):
    VIEW = "view"
    DETECT = "detect"
    OCR = "ocr"
    FULL = "full"

    @property
    def run_detect(self) -> bool:
        return self in (StreamMode.DETECT, StreamMode.FULL, StreamMode.OCR)

    @property
    def run_ocr(self) -> bool:
        return self in (StreamMode.FULL, StreamMode.OCR)

    @property
    def show_boxes(self) -> bool:
        return self in (StreamMode.DETECT, StreamMode.FULL)

    @property
    def badge_label(self) -> str:
        return {
            StreamMode.VIEW: "LIVE",
            StreamMode.DETECT: "LIVE+DETECT",
            StreamMode.OCR: "LIVE+OCR",
            StreamMode.FULL: "LIVE+DETECT+OCR",
        }[self]


# ---------------------------------------------------------------------------
# Stream Manager: encapsulates all mutable stream state
# ---------------------------------------------------------------------------

class StreamManager:
    """Manages camera capture, detection, OCR, and frame rendering."""

    def __init__(self) -> None:
        self.source: CameraSource | None = None
        self.detector: VehicleDetector | None = None
        self.ocr: PlateOCR | None = None
        self.mode: StreamMode = StreamMode.DETECT

        self.latest_jpeg: bytes | None = None
        self.last_detections: list[Detection] = []
        self.last_plates: list[PlateResult] = []
        self.events: list[dict] = []
        self.frame_count: int = 0
        self.is_streaming: bool = False

        self._lock = threading.Lock()
        self._thread: threading.Thread | None = None

    def start(self, source: CameraSource, mode: StreamMode) -> None:
        """Start capture loop in a background thread."""
        self.stop()
        self.source = source
        self.mode = mode
        self.events.clear()
        self.last_detections.clear()
        self.last_plates.clear()
        self.frame_count = 0
        self.is_streaming = True

        if mode.run_detect:
            self._ensure_detector()
        if mode.run_ocr:
            self._ensure_ocr()

        self._thread = threading.Thread(target=self._capture_loop, daemon=True)
        self._thread.start()

    def stop(self) -> None:
        """Stop the capture loop and release resources."""
        self.is_streaming = False
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=3)
        if self.source is not None:
            self.source.release()
            self.source = None
        self.latest_jpeg = None
        self.frame_count = 0

    def _ensure_detector(self) -> None:
        if self.detector is None or not self.detector.is_loaded:
            self.detector = VehicleDetector(model_path="data/models/yolov8n.pt")
            self.detector.load_model()

    def _ensure_ocr(self) -> None:
        if self.ocr is None or not self.ocr.is_loaded:
            self.ocr = PlateOCR(langs=["en"])
            self.ocr.load_model()

    # --- Background capture loop ---

    def _capture_loop(self) -> None:
        while self.is_streaming and self.source is not None:
            ret, frame = self.source.read_frame()
            if not ret or frame is None:
                time.sleep(0.05)
                continue

            self.frame_count += 1
            self._run_pipeline(frame)
            self._render(frame)
            time.sleep(0.03)

    def _run_pipeline(self, frame: np.ndarray) -> None:
        """Run detection and OCR on full-resolution frame."""
        if not self.mode.run_detect:
            return
        if self.detector is None or not self.detector.is_loaded:
            return
        if self.frame_count % DETECT_EVERY_N != 0:
            return

        detections = self.detector.detect(frame)
        if self.mode.show_boxes:
            self.last_detections = detections

        # Plate OCR
        plates: list[PlateResult] = []
        if (self.mode.run_ocr
                and self.ocr is not None and self.ocr.is_loaded
                and self.frame_count % OCR_EVERY_N == 0):
            veh_bboxes = [d.bbox for d in detections if d.class_id in VEHICLE_CLASS_IDS]
            if veh_bboxes:
                plates = self.ocr.read_plates(frame, veh_bboxes)
                self.last_plates = plates

        self._log_event(detections, plates)

    def _log_event(self, detections: list[Detection], plates: list[PlateResult]) -> None:
        """Append a detection/plate event to the event log."""
        if self.mode.show_boxes and detections:
            counts: dict[str, int] = {}
            for d in detections:
                counts[d.class_name] = counts.get(d.class_name, 0) + 1
            event: dict = {
                "frame": self.frame_count,
                "time": time.strftime("%H:%M:%S"),
                "type": "summary",
                "summary": ", ".join(f"{c} {n}" for n, c in counts.items()),
                "counts": counts,
                "total": len(detections),
            }
            if plates:
                event["plates"] = [{"text": p.text, "confidence": round(p.confidence, 2)} for p in plates]
            self._append_event(event)
        elif plates:
            self._append_event({
                "frame": self.frame_count,
                "time": time.strftime("%H:%M:%S"),
                "type": "plate",
                "total": 0,
                "plates": [{"text": p.text, "confidence": round(p.confidence, 2)} for p in plates],
            })

    def _append_event(self, event: dict) -> None:
        self.events.append(event)
        if len(self.events) > MAX_EVENTS:
            self.events.pop(0)

    def _render(self, frame: np.ndarray) -> None:
        """Draw overlays on frame and encode to JPEG."""
        orig_h, orig_w = frame.shape[:2]
        display = resize_frame(frame, DISPLAY_WIDTH)
        disp_h, disp_w = display.shape[:2]
        sx, sy = disp_w / orig_w, disp_h / orig_h

        # Detection boxes
        for det in self.last_detections if self.mode.show_boxes else []:
            self._draw_detection(display, det, sx, sy)

        # Plate labels
        for plate in self.last_plates:
            dx1, dy2 = int(plate.vehicle_bbox[0] * sx), int(plate.vehicle_bbox[3] * sy)
            cv2.putText(display, f"PLATE: {plate.text}", (dx1, dy2 + 20),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)

        # Info overlay
        n_det = len(self.last_detections) if self.mode.show_boxes else 0
        cv2.putText(display, time.strftime("%Y-%m-%d %H:%M:%S"), (10, 25),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        cv2.putText(display, f"Detected: {n_det} objects | Frame: {self.frame_count}",
                    (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 200), 1)
        if self.last_plates:
            cv2.putText(display, "Plates: " + ", ".join(p.text for p in self.last_plates),
                        (10, 72), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)

        _, jpeg = cv2.imencode(".jpg", display, [cv2.IMWRITE_JPEG_QUALITY, JPEG_QUALITY])
        with self._lock:
            self.latest_jpeg = jpeg.tobytes()

    @staticmethod
    def _draw_detection(display: np.ndarray, det: Detection, sx: float, sy: float) -> None:
        x1, y1, x2, y2 = det.bbox
        dx1, dy1, dx2, dy2 = int(x1 * sx), int(y1 * sy), int(x2 * sx), int(y2 * sy)
        color = CLASS_COLORS.get(det.class_name, (0, 255, 0))
        cv2.rectangle(display, (dx1, dy1), (dx2, dy2), color, 2)
        label = f"{det.class_name} {det.confidence:.0%}"
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
        cv2.rectangle(display, (dx1, dy1 - th - 8), (dx1 + tw + 4, dy1), color, -1)
        cv2.putText(display, label, (dx1 + 2, dy1 - 4),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)


# ---------------------------------------------------------------------------
# Flask app & routes
# ---------------------------------------------------------------------------

app = Flask(__name__, template_folder="templates", static_folder="static")
app.json.ensure_ascii = False

stream = StreamManager()


def _create_source(source_type: str, url: str, **kwargs) -> CameraSource:
    """Create a camera source from type string and URL."""
    match source_type:
        case "snapshot":
            return SnapshotSource(url, interval=kwargs.get("interval", 2.0))
        case "mjpeg":
            return MJPEGSource(url)
        case "rtsp":
            return RTSPSource(url)
        case "file":
            return FileSource(url, loop=True)
        case "webcam":
            return WebcamSource(int(url) if url.isdigit() else 0)
        case "youtube":
            return YouTubeSource(url)
        case _:
            raise ValueError(f"Unknown source type: {source_type}")


def _safe_str(value: object) -> str:
    """Encode a value to ASCII-safe string for JSON on Windows."""
    return str(value).encode("ascii", "replace").decode()


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/presets")
def api_presets():
    return jsonify(get_presets())


@app.route("/api/test-connect", methods=["POST"])
def api_test_connect():
    """Test if a camera source is reachable."""
    data = request.json
    source_type = data.get("type", "snapshot")
    url = data.get("url", "")

    if not url:
        return jsonify({"ok": False, "error": "URL is required"}), 400

    try:
        if source_type == "snapshot":
            resp = requests.get(url, timeout=10)
            if resp.status_code == 200 and len(resp.content) > 1000:
                arr = np.frombuffer(resp.content, dtype=np.uint8)
                frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
                if frame is not None:
                    h, w = frame.shape[:2]
                    return jsonify({"ok": True, "message": f"Connected! Image: {w}x{h}"})
            return jsonify({"ok": False, "error": f"HTTP {resp.status_code}"})

        source = _create_source(source_type, url)
        connected = source.connect()
        if connected:
            ret, frame = source.read_frame()
            info = source.source_info
            source.release()
            if ret and frame is not None:
                h, w = frame.shape[:2]
                result: dict = {"ok": True, "message": f"Connected! Frame: {w}x{h}"}
                if info.get("title"):
                    result["title"] = info["title"]
                if info.get("is_live") is not None:
                    result["is_live"] = info["is_live"]
                return jsonify(result)
        error_msg = getattr(source, "_error", "") or "Cannot read frames"
        source.release()
        return jsonify({"ok": False, "error": error_msg})
    except Exception as e:
        return jsonify({"ok": False, "error": _safe_str(e)}), 500


@app.route("/api/start", methods=["POST"])
def api_start():
    """Start streaming from a camera source."""
    data = request.json
    source_type = data.get("type", "snapshot")
    url = data.get("url", "")
    interval = data.get("interval", 2.0)
    mode = StreamMode(data.get("mode", "detect"))

    if not url:
        return jsonify({"ok": False, "error": "URL is required"}), 400

    try:
        source = _create_source(source_type, url, interval=interval)
        if not source.connect():
            error_msg = getattr(source, "_error", "") or "Failed to connect"
            return jsonify({"ok": False, "error": error_msg})

        stream.start(source, mode)

        info = {k: _safe_str(v) if isinstance(v, str) else v
                for k, v in source.source_info.items()}
        return jsonify({"ok": True, "source_info": info})
    except Exception as e:
        return jsonify({"ok": False, "error": _safe_str(e)}), 500


@app.route("/api/stop", methods=["POST"])
def api_stop():
    stream.stop()
    return jsonify({"ok": True})


@app.route("/stream.mjpeg")
def stream_mjpeg():
    """MJPEG stream endpoint."""
    def generate() -> Generator[bytes, None, None]:
        while stream.is_streaming:
            jpeg = stream.latest_jpeg
            if jpeg is None:
                time.sleep(0.05)
                continue
            yield b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + jpeg + b"\r\n"
            time.sleep(0.03)

    return Response(generate(), mimetype="multipart/x-mixed-replace; boundary=frame")


@app.route("/api/events")
def api_events():
    """SSE endpoint for real-time detection events."""
    def generate() -> Generator[str, None, None]:
        last_idx = 0
        while True:
            current_len = len(stream.events)
            if current_len > last_idx:
                for evt in stream.events[last_idx:current_len]:
                    yield f"data: {json.dumps(evt)}\n\n"
                last_idx = current_len
            yield f"data: {json.dumps({'type': 'status', 'streaming': stream.is_streaming, 'frame_count': stream.frame_count, 'total_detections': len(stream.events)})}\n\n"
            time.sleep(1)

    return Response(generate(), mimetype="text/event-stream")


def run_server(host: str = "0.0.0.0", port: int = 5555, debug: bool = False) -> None:
    """Start the web server."""
    print(f"[WebUI] http://localhost:{port}")
    app.run(host=host, port=port, debug=debug, threaded=True)


if __name__ == "__main__":
    run_server(debug=True)
