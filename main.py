"""Traffic Camera Detection System - CLI Entry Point.

Usage:
    ENV=dev python main.py
    ENV=test python main.py
    ENV=prod python main.py
"""

import sys

from traffic_cam.config import get_config
from traffic_cam.output.display import FrameDisplay
from traffic_cam.pipeline.detector import VehicleDetector
from traffic_cam.sources import create_source
from traffic_cam.utils.helpers import resize_frame


def main() -> None:
    """Run the traffic camera detection pipeline."""
    config = get_config()
    print(f"[Main] Environment: {config.__class__.__name__}")
    print(f"[Main] Source: {config.CAMERA_SOURCE} -> {config.CAMERA_URL}")

    source = create_source(config)
    display = FrameDisplay()
    detector = VehicleDetector(
        model_path=f"{config.MODEL_PATH}/yolov8n.pt",
        confidence=config.CONFIDENCE_THRESHOLD,
    )
    detector.load_model()

    if not source.connect():
        print("[Main] Failed to connect. Exiting.")
        sys.exit(1)

    print("[Main] Press 'q' to quit.")
    frame_count = 0

    try:
        while True:
            ret, frame = source.read_frame()
            if not ret or frame is None:
                continue

            frame_count += 1
            frame = resize_frame(frame, config.FRAME_WIDTH)

            detections = None
            if frame_count % config.PROCESS_EVERY_N == 0:
                detections = detector.detect(frame)

            if display.show(frame, detections) == ord("q"):
                break
    except KeyboardInterrupt:
        print("\n[Main] Interrupted.")
    finally:
        source.release()
        display.close()


if __name__ == "__main__":
    main()
