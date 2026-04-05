"""Traffic Camera Detection System - Entry Point.

Usage:
    ENV=dev python main.py     # Public MJPEG stream
    ENV=test python main.py    # Local video file
    ENV=prod python main.py    # RTSP stream
"""

import sys

from traffic_cam.config import get_config
from traffic_cam.output.display import FrameDisplay
from traffic_cam.pipeline.detector import VehicleDetector
from traffic_cam.sources import create_source
from traffic_cam.utils.helpers import resize_frame


def main() -> None:
    """Run the traffic camera detection pipeline."""
    # Load config
    config = get_config()
    print(f"[Main] Environment: {config.env_name}")
    print(f"[Main] Source: {config.CAMERA_SOURCE} -> {config.CAMERA_URL}")

    # Initialize components
    source = create_source(config)
    display = FrameDisplay()
    detector = VehicleDetector(
        model_path=f"{config.MODEL_PATH}/yolov8n.pt",
        confidence=config.CONFIDENCE_THRESHOLD,
    )
    detector.load_model()

    # Connect to camera
    if not source.connect():
        print("[Main] Failed to connect to camera source. Exiting.")
        sys.exit(1)

    print("[Main] Starting stream. Press 'q' to quit.")
    frame_count = 0

    try:
        while True:
            ret, frame = source.read_frame()
            if not ret or frame is None:
                print("[Main] No frame received. Retrying...")
                continue

            frame_count += 1

            # Resize for display
            frame = resize_frame(frame, config.FRAME_WIDTH)

            # Run detection every N frames
            detections = None
            if frame_count % config.PROCESS_EVERY_N == 0:
                detections = detector.detect(frame)

            # Display
            key = display.show(frame, detections)
            if key == ord("q"):
                print("[Main] Quit requested.")
                break

    except KeyboardInterrupt:
        print("\n[Main] Interrupted by user.")
    finally:
        source.release()
        display.close()
        print("[Main] Shutdown complete.")


if __name__ == "__main__":
    main()
