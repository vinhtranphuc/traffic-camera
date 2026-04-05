"""Helper utility functions for frame processing."""

import cv2
import numpy as np


def resize_frame(frame: np.ndarray, width: int = 640) -> np.ndarray:
    """Resize frame maintaining aspect ratio."""
    h, w = frame.shape[:2]
    if w == width:
        return frame
    ratio = width / w
    return cv2.resize(frame, (width, int(h * ratio)))
