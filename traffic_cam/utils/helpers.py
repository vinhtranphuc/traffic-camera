"""Helper utility functions for frame processing."""

import cv2
import numpy as np


def resize_frame(frame: np.ndarray, width: int = 640) -> np.ndarray:
    """Resize frame maintaining aspect ratio.

    Args:
        frame: Input BGR frame.
        width: Target width in pixels.

    Returns:
        Resized frame.
    """
    h, w = frame.shape[:2]
    if w == width:
        return frame
    ratio = width / w
    new_h = int(h * ratio)
    return cv2.resize(frame, (width, new_h))


def preprocess_frame(frame: np.ndarray, width: int = 640) -> np.ndarray:
    """Preprocess frame for detection pipeline.

    Resizes and converts color space if needed.

    Args:
        frame: Input BGR frame.
        width: Target width for resizing.

    Returns:
        Preprocessed frame (BGR).
    """
    frame = resize_frame(frame, width)
    return frame
