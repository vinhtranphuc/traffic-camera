"""Frame display with bounding box overlay."""

import cv2
import numpy as np

from traffic_cam.pipeline.detector import Detection


class FrameDisplay:
    """Display frames with detection overlays using OpenCV."""

    WINDOW_NAME = "Traffic Camera"

    def __init__(self) -> None:
        self._window_created = False

    def show(self, frame: np.ndarray, detections: list[Detection] | None = None) -> int:
        """Display frame with optional detection boxes.

        Args:
            frame: BGR frame to display.
            detections: Optional detection results to overlay.

        Returns:
            Key code pressed, or -1 if no key.
        """
        display_frame = frame.copy()

        if detections:
            for det in detections:
                x1, y1, x2, y2 = det.bbox
                cv2.rectangle(display_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                label = f"{det.class_name} {det.confidence:.2f}"
                cv2.putText(
                    display_frame, label, (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2,
                )

        cv2.imshow(self.WINDOW_NAME, display_frame)
        self._window_created = True
        return cv2.waitKey(1) & 0xFF

    def close(self) -> None:
        """Destroy the display window."""
        if self._window_created:
            cv2.destroyAllWindows()
            self._window_created = False
