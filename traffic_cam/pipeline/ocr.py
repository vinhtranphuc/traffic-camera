"""License plate OCR using PaddleOCR."""

from dataclasses import dataclass

import numpy as np


@dataclass
class PlateResult:
    """OCR result for a license plate."""

    text: str
    confidence: float
    bbox: tuple[int, int, int, int]


class PlateOCR:
    """PaddleOCR-based license plate reader.

    Currently a placeholder that returns empty results.
    """

    def __init__(self) -> None:
        self._ocr = None
        self._loaded = False

    def load_model(self) -> bool:
        """Load the OCR model."""
        # TODO: Initialize PaddleOCR
        # self._ocr = PaddleOCR(use_angle_cls=True, lang='en')
        print("[OCR] Running in stub mode.")
        return False

    def read_plate(self, plate_image: np.ndarray) -> PlateResult | None:
        """Read text from a cropped license plate image.

        Returns:
            PlateResult or None if OCR not loaded or failed.
        """
        if not self._loaded:
            return None
        # TODO: Run OCR inference
        return None
