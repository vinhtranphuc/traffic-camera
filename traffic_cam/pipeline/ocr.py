"""License plate OCR using EasyOCR.

Reads text from vehicle crops, filters for license-plate-like patterns
(alphanumeric, contains digits, reasonable length).
"""

import logging
import re
from dataclasses import dataclass

import cv2
import numpy as np

logger = logging.getLogger(__name__)

# Pattern: at least 2 digits and 2 letters, 4-12 chars total
_PLATE_PATTERN = re.compile(r"^[A-Z0-9\-\.]{4,12}$")


@dataclass
class PlateResult:
    """OCR result for a license plate."""

    text: str
    confidence: float
    vehicle_bbox: tuple[int, int, int, int]


class PlateOCR:
    """EasyOCR-based license plate reader.

    For each detected vehicle, crops the vehicle region, runs OCR,
    and filters results that look like license plates.
    """

    def __init__(self, langs: list[str] | None = None) -> None:
        self._langs = langs or ["en"]
        self._reader = None
        self._loaded = False

    def load_model(self) -> bool:
        """Initialize EasyOCR Reader."""
        try:
            import easyocr
            self._reader = easyocr.Reader(
                self._langs, gpu=False, verbose=False
            )
            self._loaded = True
            logger.info("[OCR] EasyOCR loaded, langs=%s", self._langs)
            return True
        except ImportError:
            logger.warning("[OCR] easyocr not installed.")
            return False
        except Exception as e:
            logger.error("[OCR] Failed to init: %s", e)
            return False

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    def read_plates(
        self,
        frame: np.ndarray,
        vehicle_bboxes: list[tuple[int, int, int, int]],
    ) -> list[PlateResult]:
        """Read license plates from vehicle regions in a frame.

        Args:
            frame: Full BGR frame.
            vehicle_bboxes: List of (x1,y1,x2,y2) vehicle bounding boxes.

        Returns:
            List of PlateResult for detected plates.
        """
        if not self._loaded or self._reader is None:
            return []

        results: list[PlateResult] = []
        h_frame, w_frame = frame.shape[:2]

        for bbox in vehicle_bboxes:
            x1, y1, x2, y2 = bbox
            # Clamp to frame bounds
            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = min(w_frame, x2), min(h_frame, y2)

            bw, bh = x2 - x1, y2 - y1
            if bw < 20 or bh < 15:
                continue

            # Crop full vehicle (plates can be anywhere depending on angle)
            crop = frame[y1:y2, x1:x2]
            if crop.size == 0:
                continue

            # Preprocess for better OCR
            crop = self._preprocess(crop)

            plate = self._extract_plate_text(crop)
            if plate:
                text, conf = plate
                results.append(PlateResult(
                    text=text, confidence=conf, vehicle_bbox=bbox,
                ))

        return results

    @staticmethod
    def _preprocess(crop: np.ndarray) -> np.ndarray:
        """Preprocess vehicle crop for better OCR accuracy."""
        # Upscale small crops
        if crop.shape[1] < 200:
            scale = 200 / crop.shape[1]
            crop = cv2.resize(
                crop, None, fx=scale, fy=scale,
                interpolation=cv2.INTER_CUBIC,
            )
        # Enhance contrast (helps with night / low-light scenes)
        lab = cv2.cvtColor(crop, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        l = clahe.apply(l)
        crop = cv2.cvtColor(cv2.merge([l, a, b]), cv2.COLOR_LAB2BGR)
        # Sharpen
        kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
        crop = cv2.filter2D(crop, -1, kernel)
        return crop

    def _extract_plate_text(
        self, crop: np.ndarray
    ) -> tuple[str, float] | None:
        """Run OCR on a crop and find plate-like text.

        Tries multiple strategies:
        1. Single best OCR result matching plate pattern
        2. Combine adjacent fragments into a full plate string
        3. Try grayscale if color fails
        """
        result = self._try_ocr(crop)
        if result:
            return result
        # Fallback: try grayscale
        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        return self._try_ocr(gray)

    def _try_ocr(
        self, image: np.ndarray
    ) -> tuple[str, float] | None:
        """Run OCR and extract plate-like text."""
        try:
            ocr_results = self._reader.readtext(image, detail=1)
        except Exception:
            return None

        if not ocr_results:
            return None

        # Strategy 1: find single best plate-like result
        best: tuple[str, float] | None = None
        best_score = 0.0

        for _, text, conf in ocr_results:
            if conf < 0.2:
                continue
            clean = self._normalize(text)
            if self._is_plate_like(clean):
                score = conf * len(clean)
                if score > best_score:
                    best = (clean, conf)
                    best_score = score

        if best:
            return best

        # Strategy 2: combine all fragments with decent confidence
        fragments = []
        total_conf = 0.0
        for _, text, conf in ocr_results:
            if conf < 0.3:
                continue
            clean = self._normalize(text)
            # Keep fragments with digits or short alpha
            if any(c.isdigit() for c in clean) or (
                len(clean) <= 3 and clean.isalpha()
            ):
                fragments.append(clean)
                total_conf += conf

        if fragments:
            combined = "".join(fragments)
            avg_conf = total_conf / len(fragments)
            if self._is_plate_like(combined):
                return (combined, avg_conf)

        return None

    @staticmethod
    def _normalize(text: str) -> str:
        """Normalize OCR text for plate matching."""
        clean = text.upper().strip()
        # Remove common noise chars but keep hyphens/dots (plate separators)
        clean = re.sub(r"[^A-Z0-9\-\.]", "", clean)
        return clean

    @staticmethod
    def _is_plate_like(text: str) -> bool:
        """Check if text looks like a license plate."""
        if len(text) < 3 or len(text) > 14:
            return False
        has_digit = any(c.isdigit() for c in text)
        if not has_digit:
            return False
        digit_count = sum(c.isdigit() for c in text)
        # At least 3 digits for a plate
        if digit_count < 3:
            return False
        return True
