"""License plate OCR using EasyOCR.

Reads text from vehicle crops, enhances for low-light conditions,
and filters results matching license plate patterns.
"""

import logging
import re
from dataclasses import dataclass

import cv2
import numpy as np

logger = logging.getLogger(__name__)

_MIN_DIGITS = 3
_MIN_LENGTH = 3
_MAX_LENGTH = 14
_MIN_CONFIDENCE = 0.2


@dataclass(frozen=True, slots=True)
class PlateResult:
    """OCR result for a license plate."""

    text: str
    confidence: float
    vehicle_bbox: tuple[int, int, int, int]


class PlateOCR:
    """EasyOCR-based license plate reader."""

    def __init__(self, langs: list[str] | None = None) -> None:
        self._langs = langs or ["en"]
        self._reader = None
        self._loaded = False

    def load_model(self) -> bool:
        """Initialize EasyOCR Reader."""
        try:
            import easyocr
            self._reader = easyocr.Reader(self._langs, gpu=False, verbose=False)
            self._loaded = True
            logger.info("[OCR] Loaded, langs=%s", self._langs)
            return True
        except ImportError:
            logger.warning("[OCR] easyocr not installed.")
        except Exception as e:
            logger.error("[OCR] Init failed: %s", e)
        return False

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    def read_plates(
        self,
        frame: np.ndarray,
        vehicle_bboxes: list[tuple[int, int, int, int]],
    ) -> list[PlateResult]:
        """Read license plates from vehicle regions in a frame."""
        if not self._loaded or self._reader is None:
            return []

        h, w = frame.shape[:2]
        results: list[PlateResult] = []

        for x1, y1, x2, y2 in vehicle_bboxes:
            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = min(w, x2), min(h, y2)
            if x2 - x1 < 20 or y2 - y1 < 15:
                continue

            crop = frame[y1:y2, x1:x2]
            crop = _enhance(crop)

            plate = self._find_plate(crop)
            if plate is None:
                # Fallback: try grayscale
                plate = self._find_plate(cv2.cvtColor(frame[y1:y2, x1:x2], cv2.COLOR_BGR2GRAY))

            if plate:
                results.append(PlateResult(
                    text=plate[0], confidence=plate[1],
                    vehicle_bbox=(x1, y1, x2, y2),
                ))

        return results

    def _find_plate(self, image: np.ndarray) -> tuple[str, float] | None:
        """Run OCR and extract the best plate-like text."""
        try:
            ocr_results = self._reader.readtext(image, detail=1)
        except Exception:
            return None

        if not ocr_results:
            return None

        # Strategy 1: single best result
        best: tuple[str, float] | None = None
        best_score = 0.0
        for _, text, conf in ocr_results:
            if conf < _MIN_CONFIDENCE:
                continue
            clean = _normalize(text)
            if _is_plate_like(clean):
                score = conf * len(clean)
                if score > best_score:
                    best = (clean, conf)
                    best_score = score

        if best:
            return best

        # Strategy 2: combine fragments
        fragments: list[str] = []
        total_conf = 0.0
        for _, text, conf in ocr_results:
            if conf < 0.3:
                continue
            clean = _normalize(text)
            if any(c.isdigit() for c in clean) or (len(clean) <= 3 and clean.isalpha()):
                fragments.append(clean)
                total_conf += conf

        if fragments:
            combined = "".join(fragments)
            avg_conf = total_conf / len(fragments)
            if _is_plate_like(combined):
                return (combined, avg_conf)

        return None


def _enhance(crop: np.ndarray) -> np.ndarray:
    """Enhance a vehicle crop for better OCR (contrast + sharpen)."""
    if crop.shape[1] < 200:
        scale = 200 / crop.shape[1]
        crop = cv2.resize(crop, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)

    lab = cv2.cvtColor(crop, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    l = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8)).apply(l)
    crop = cv2.cvtColor(cv2.merge([l, a, b]), cv2.COLOR_LAB2BGR)

    kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
    return cv2.filter2D(crop, -1, kernel)


def _normalize(text: str) -> str:
    """Normalize OCR text: uppercase, keep only alphanumeric + separators."""
    return re.sub(r"[^A-Z0-9\-\.]", "", text.upper().strip())


def _is_plate_like(text: str) -> bool:
    """Check if text matches a license plate pattern."""
    if not _MIN_LENGTH <= len(text) <= _MAX_LENGTH:
        return False
    digit_count = sum(c.isdigit() for c in text)
    return digit_count >= _MIN_DIGITS
