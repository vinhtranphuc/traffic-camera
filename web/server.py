"""Flask web server for Traffic Camera UI.

Provides:
- Background capture + detection thread
- MJPEG streaming endpoint for live camera view
- REST API for camera presets, connection testing
- SSE endpoint for real-time detection events
"""

import json
import threading
import time
from typing import Generator

import cv2
import numpy as np
import requests
from flask import Flask, Response, jsonify, render_template, request

from traffic_cam.pipeline.detector import TRAFFIC_CLASS_IDS, Detection, VehicleDetector
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

app = Flask(__name__, template_folder="templates", static_folder="static")
app.json.ensure_ascii = False

# --- Global state ---
_active_source: CameraSource | None = None
_source_lock = threading.Lock()
_detector: VehicleDetector | None = None
_ocr: PlateOCR | None = None

_latest_frame: np.ndarray | None = None
_frame_lock = threading.Lock()
_last_detections: list[Detection] = []
_last_plates: list[PlateResult] = []
_detection_events: list[dict] = []
_frame_count = 0
_is_streaming = False
_capture_thread: threading.Thread | None = None
_stream_mode: str = "detect"  # "view" | "detect" | "full"

# Color map per class (BGR)
_COLORS = {
    "car": (0, 255, 0),
    "motorcycle": (0, 200, 255),
    "bus": (255, 100, 0),
    "truck": (0, 100, 255),
    "person": (255, 255, 0),
    "bicycle": (255, 0, 255),
    "traffic light": (0, 255, 255),
    "stop sign": (0, 0, 255),
}


def _init_detector() -> None:
    """Initialize YOLO detector and plate OCR if not already loaded."""
    global _detector, _ocr
    if _detector is None or not _detector.is_loaded:
        _detector = VehicleDetector(
            model_path="data/models/yolov8n.pt", confidence=0.25
        )
        _detector.load_model()
    if _ocr is None or not _ocr.is_loaded:
        _ocr = PlateOCR(langs=["en"])
        _ocr.load_model()


def _create_source(source_type: str, url: str, **kwargs) -> CameraSource:
    """Create a camera source from type and URL."""
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


def _stop_active_source() -> None:
    """Stop and release the currently active source."""
    global _active_source, _is_streaming, _frame_count, _latest_frame
    _is_streaming = False
    # Wait for capture thread to finish
    if _capture_thread and _capture_thread.is_alive():
        _capture_thread.join(timeout=3)
    with _source_lock:
        if _active_source is not None:
            _active_source.release()
            _active_source = None
    _frame_count = 0
    _latest_frame = None


def _capture_loop() -> None:
    """Background thread: read frames, run detection + OCR, render overlays."""
    global _frame_count, _latest_frame, _last_detections, _last_plates

    # Vehicle class IDs for plate OCR
    vehicle_cls = {2, 3, 5, 7}  # car, motorcycle, bus, truck

    while _is_streaming:
        with _source_lock:
            source = _active_source
        if source is None:
            break

        ret, frame = source.read_frame()
        if not ret or frame is None:
            time.sleep(0.05)
            continue

        _frame_count += 1

        # Run detection/OCR on FULL resolution frame, resize only for display
        run_detect = _stream_mode in ("detect", "full", "ocr")
        run_ocr = _stream_mode in ("full", "ocr")
        show_detect = _stream_mode in ("detect", "full")

        if run_detect and _detector and _detector.is_loaded and _frame_count % 3 == 0:
            detections = _detector.detect(frame)
            if show_detect:
                _last_detections = detections

            # Run plate OCR every 9 frames
            plates: list[PlateResult] = []
            if run_ocr and _ocr and _ocr.is_loaded and _frame_count % 9 == 0:
                veh_bboxes = [
                    d.bbox for d in detections if d.class_id in vehicle_cls
                ]
                if veh_bboxes:
                    plates = _ocr.read_plates(frame, veh_bboxes)
                    _last_plates = plates

            if show_detect and detections:
                counts: dict[str, int] = {}
                for det in detections:
                    counts[det.class_name] = counts.get(det.class_name, 0) + 1
                summary = ", ".join(f"{c} {n}" for n, c in counts.items())
                event: dict = {
                    "frame": _frame_count,
                    "time": time.strftime("%H:%M:%S"),
                    "type": "summary",
                    "summary": summary,
                    "counts": counts,
                    "total": len(detections),
                }
                if plates:
                    event["plates"] = [
                        {"text": p.text, "confidence": round(p.confidence, 2)}
                        for p in plates
                    ]
                _detection_events.append(event)
                if len(_detection_events) > 500:
                    _detection_events.pop(0)

            # Log plate-only events (ocr mode or plates without detect log)
            if plates and not show_detect:
                _detection_events.append({
                    "frame": _frame_count,
                    "time": time.strftime("%H:%M:%S"),
                    "type": "plate",
                    "total": 0,
                    "plates": [
                        {"text": p.text, "confidence": round(p.confidence, 2)}
                        for p in plates
                    ],
                })
                if len(_detection_events) > 500:
                    _detection_events.pop(0)

        # Resize for display
        display = resize_frame(frame, 960)
        orig_h, orig_w = frame.shape[:2]
        disp_h, disp_w = display.shape[:2]
        sx, sy = disp_w / orig_w, disp_h / orig_h

        # Draw detections (skip in view/ocr mode)
        for det in (_last_detections if show_detect else []):
            x1, y1, x2, y2 = det.bbox
            dx1, dy1 = int(x1 * sx), int(y1 * sy)
            dx2, dy2 = int(x2 * sx), int(y2 * sy)
            color = _COLORS.get(det.class_name, (0, 255, 0))
            cv2.rectangle(display, (dx1, dy1), (dx2, dy2), color, 2)
            label = f"{det.class_name} {det.confidence:.0%}"
            (tw, th), _ = cv2.getTextSize(
                label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1
            )
            cv2.rectangle(
                display, (dx1, dy1 - th - 8), (dx1 + tw + 4, dy1), color, -1
            )
            cv2.putText(
                display, label, (dx1 + 2, dy1 - 4),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1,
            )

        # Draw plate labels
        for plate in _last_plates:
            x1, y1, x2, y2 = plate.vehicle_bbox
            dx1, dy2 = int(x1 * sx), int(y2 * sy)
            plate_label = f"PLATE: {plate.text}"
            cv2.putText(
                display, plate_label, (dx1, dy2 + 20),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2,
            )

        # Overlay info
        n_det = len(_last_detections) if show_detect else 0
        ts = time.strftime("%Y-%m-%d %H:%M:%S")
        cv2.putText(display, ts, (10, 25),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        det_text = f"Detected: {n_det} objects | Frame: {_frame_count}"
        cv2.putText(display, det_text, (10, 50),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 200), 1)
        if _last_plates:
            plate_text = "Plates: " + ", ".join(p.text for p in _last_plates)
            cv2.putText(display, plate_text, (10, 72),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)

        # Encode and store
        _, jpeg = cv2.imencode(".jpg", display, [cv2.IMWRITE_JPEG_QUALITY, 80])
        with _frame_lock:
            _latest_frame = jpeg.tobytes()

        time.sleep(0.03)


# --- Routes ---

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
                    return jsonify({
                        "ok": True,
                        "message": f"Connected! Image: {w}x{h}",
                        "width": w, "height": h,
                    })
            return jsonify({"ok": False, "error": f"HTTP {resp.status_code}"})
        else:
            source = _create_source(source_type, url)
            connected = source.connect()
            if connected:
                ret, frame = source.read_frame()
                info = source.source_info
                source.release()
                if ret and frame is not None:
                    h, w = frame.shape[:2]
                    result = {
                        "ok": True,
                        "message": f"Connected! Frame: {w}x{h}",
                        "width": w, "height": h,
                    }
                    if info.get("title"):
                        result["title"] = info["title"]
                    if info.get("is_live") is not None:
                        result["is_live"] = info["is_live"]
                    return jsonify(result)
            error_msg = getattr(source, '_error', '') or "Cannot read frames"
            source.release()
            return jsonify({"ok": False, "error": error_msg})
    except Exception as e:
        safe_error = str(e).encode("ascii", "replace").decode()
        return jsonify({"ok": False, "error": safe_error}), 500


@app.route("/api/start", methods=["POST"])
def api_start():
    """Start streaming from a camera source."""
    global _active_source, _is_streaming, _detection_events
    global _last_detections, _last_plates, _capture_thread, _stream_mode

    _stop_active_source()
    _detection_events = []
    _last_detections = []
    _last_plates = []

    data = request.json
    source_type = data.get("type", "snapshot")
    url = data.get("url", "")
    interval = data.get("interval", 2.0)
    _stream_mode = data.get("mode", "detect")  # view | detect | full

    if not url:
        return jsonify({"ok": False, "error": "URL is required"}), 400

    try:
        source = _create_source(source_type, url, interval=interval)
        if not source.connect():
            error_msg = getattr(source, '_error', '') or "Failed to connect"
            return jsonify({"ok": False, "error": error_msg})

        if _stream_mode in ("detect", "full", "ocr"):
            _init_detector()

        with _source_lock:
            _active_source = source
            _is_streaming = True

        # Start background capture + detection thread
        _capture_thread = threading.Thread(
            target=_capture_loop, daemon=True
        )
        _capture_thread.start()

        info = source.source_info
        info_safe = {}
        for k, v in info.items():
            if isinstance(v, str):
                info_safe[k] = v.encode("ascii", "replace").decode()
            else:
                info_safe[k] = v
        return jsonify({"ok": True, "source_info": info_safe})
    except Exception as e:
        safe_error = str(e).encode("ascii", "replace").decode()
        return jsonify({"ok": False, "error": safe_error}), 500


@app.route("/api/stop", methods=["POST"])
def api_stop():
    _stop_active_source()
    return jsonify({"ok": True})


@app.route("/stream.mjpeg")
def stream_mjpeg():
    """MJPEG stream - reads latest processed frame from capture thread."""
    def generate() -> Generator[bytes, None, None]:
        while _is_streaming:
            with _frame_lock:
                jpeg_bytes = _latest_frame
            if jpeg_bytes is None:
                time.sleep(0.05)
                continue
            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n"
                + jpeg_bytes
                + b"\r\n"
            )
            time.sleep(0.03)

    return Response(
        generate(),
        mimetype="multipart/x-mixed-replace; boundary=frame",
    )


@app.route("/api/events")
def api_events():
    """SSE endpoint for real-time detection events."""
    def event_stream() -> Generator[str, None, None]:
        last_idx = 0
        while True:
            current_len = len(_detection_events)
            if current_len > last_idx:
                new_events = _detection_events[last_idx:current_len]
                for evt in new_events:
                    yield f"data: {json.dumps(evt)}\n\n"
                last_idx = current_len

            status = {
                "type": "status",
                "streaming": _is_streaming,
                "frame_count": _frame_count,
                "total_detections": len(_detection_events),
            }
            yield f"data: {json.dumps(status)}\n\n"
            time.sleep(1)

    return Response(event_stream(), mimetype="text/event-stream")


def run_server(host: str = "0.0.0.0", port: int = 5555, debug: bool = False) -> None:
    """Start the web server."""
    print(f"[WebUI] Starting at http://localhost:{port}")
    app.run(host=host, port=port, debug=debug, threaded=True)


if __name__ == "__main__":
    run_server(debug=True)
