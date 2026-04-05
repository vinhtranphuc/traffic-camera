"""Flask web server for Traffic Camera UI.

Provides:
- MJPEG streaming endpoint for live camera view
- REST API for camera presets, connection testing, detection results
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

from traffic_cam.pipeline.detector import Detection, VehicleDetector
from traffic_cam.sources.base import CameraSource
from traffic_cam.sources.file_source import FileSource
from traffic_cam.sources.mjpeg_source import MJPEGSource
from traffic_cam.sources.rtsp_source import RTSPSource
from traffic_cam.sources.snapshot_source import SnapshotSource
from traffic_cam.sources.webcam_source import WebcamSource
from traffic_cam.sources.youtube_source import YouTubeSource
from traffic_cam.utils.helpers import resize_frame
from web.camera_presets import get_preset_by_id, get_presets

app = Flask(__name__, template_folder="templates", static_folder="static")

# Global state
_active_source: CameraSource | None = None
_active_lock = threading.Lock()
_detector = VehicleDetector()
_last_detections: list[Detection] = []
_detection_events: list[dict] = []
_frame_count = 0
_is_streaming = False


def _create_source(source_type: str, url: str, **kwargs) -> CameraSource:
    """Create a camera source from type and URL."""
    match source_type:
        case "snapshot":
            interval = kwargs.get("interval", 2.0)
            return SnapshotSource(url, interval=interval)
        case "mjpeg":
            return MJPEGSource(url)
        case "rtsp":
            return RTSPSource(url)
        case "file":
            return FileSource(url, loop=True)
        case "webcam":
            device_index = int(url) if url.isdigit() else 0
            return WebcamSource(device_index)
        case "youtube":
            return YouTubeSource(url)
        case _:
            raise ValueError(f"Unknown source type: {source_type}")


def _stop_active_source() -> None:
    """Stop and release the currently active source."""
    global _active_source, _is_streaming, _frame_count
    with _active_lock:
        if _active_source is not None:
            _is_streaming = False
            _active_source.release()
            _active_source = None
            _frame_count = 0


# --- Routes ---

@app.route("/")
def index():
    """Serve the main UI page."""
    return render_template("index.html")


@app.route("/api/presets")
def api_presets():
    """Return list of available camera presets."""
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
                        "size_kb": len(resp.content) // 1024,
                    })
            return jsonify({"ok": False, "error": f"HTTP {resp.status_code}"})
        else:
            source = _create_source(source_type, url)
            connected = source.connect()
            if connected:
                ret, frame = source.read_frame()
                source.release()
                if ret and frame is not None:
                    h, w = frame.shape[:2]
                    return jsonify({
                        "ok": True,
                        "message": f"Connected! Frame: {w}x{h}",
                        "width": w, "height": h,
                    })
            source.release()
            return jsonify({"ok": False, "error": "Cannot read frames"})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/start", methods=["POST"])
def api_start():
    """Start streaming from a camera source."""
    global _active_source, _is_streaming, _detection_events, _last_detections

    _stop_active_source()
    _detection_events = []
    _last_detections = []

    data = request.json
    source_type = data.get("type", "snapshot")
    url = data.get("url", "")
    interval = data.get("interval", 2.0)

    if not url:
        return jsonify({"ok": False, "error": "URL is required"}), 400

    try:
        source = _create_source(source_type, url, interval=interval)
        if not source.connect():
            return jsonify({"ok": False, "error": "Failed to connect"})

        with _active_lock:
            _active_source = source
            _is_streaming = True

        return jsonify({"ok": True, "source_info": source.source_info})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/stop", methods=["POST"])
def api_stop():
    """Stop the active camera stream."""
    _stop_active_source()
    return jsonify({"ok": True})


@app.route("/stream.mjpeg")
def stream_mjpeg():
    """MJPEG video stream endpoint."""
    def generate() -> Generator[bytes, None, None]:
        global _frame_count, _last_detections
        while _is_streaming:
            with _active_lock:
                source = _active_source
            if source is None:
                break

            ret, frame = source.read_frame()
            if not ret or frame is None:
                time.sleep(0.1)
                continue

            _frame_count += 1
            frame = resize_frame(frame, 800)

            # Run detection every 3 frames
            if _frame_count % 3 == 0:
                detections = _detector.detect(frame)
                _last_detections = detections
                if detections:
                    for det in detections:
                        event = {
                            "frame": _frame_count,
                            "time": time.strftime("%H:%M:%S"),
                            "class": det.class_name,
                            "confidence": round(det.confidence, 2),
                            "bbox": list(det.bbox),
                        }
                        _detection_events.append(event)
                        if len(_detection_events) > 200:
                            _detection_events.pop(0)

            # Draw detections on frame
            for det in _last_detections:
                x1, y1, x2, y2 = det.bbox
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                label = f"{det.class_name} {det.confidence:.2f}"
                cv2.putText(frame, label, (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

            # Add timestamp overlay
            ts = time.strftime("%Y-%m-%d %H:%M:%S")
            cv2.putText(frame, ts, (10, 25),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            cv2.putText(frame, f"Frame: {_frame_count}", (10, 50),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)

            _, jpeg = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n"
                + jpeg.tobytes()
                + b"\r\n"
            )

            # Control frame rate
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

            # Send heartbeat with stream status
            status = {
                "type": "status",
                "streaming": _is_streaming,
                "frame_count": _frame_count,
                "total_detections": len(_detection_events),
            }
            yield f"data: {json.dumps(status)}\n\n"
            time.sleep(1)

    return Response(event_stream(), mimetype="text/event-stream")


@app.route("/api/snapshot")
def api_snapshot():
    """Get a single snapshot from the active source."""
    with _active_lock:
        source = _active_source
    if source is None:
        return jsonify({"error": "No active source"}), 400

    ret, frame = source.read_frame()
    if not ret or frame is None:
        return jsonify({"error": "Failed to read frame"}), 500

    frame = resize_frame(frame, 800)
    _, jpeg = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 90])
    return Response(jpeg.tobytes(), mimetype="image/jpeg")


def run_server(host: str = "0.0.0.0", port: int = 5555, debug: bool = False) -> None:
    """Start the web server."""
    print(f"[WebUI] Starting at http://localhost:{port}")
    app.run(host=host, port=port, debug=debug, threaded=True)


if __name__ == "__main__":
    run_server(debug=True)
