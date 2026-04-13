"""License plate OCR using EasyOCR.

Locates plate region within vehicle crops via contour detection,
enhances the plate image, then reads text with EasyOCR.
Filters results matching Vietnamese license plate patterns.
"""

import logging
import re
from dataclasses import dataclass

import cv2
import numpy as np

logger = logging.getLogger(__name__)

_MIN_CONFIDENCE = 0.3

# Vietnamese plate patterns:
#   43A-31743, 92A-123.45, 43A1-31743, 51F-123.45
_VN_PLATE_RE = re.compile(
    r"^\d{2}[A-Z]\d?[-.]?\d{3,5}\.?\d{0,2}$"
)


@dataclass(frozen=True, slots=True)
class PlateResult:
    """OCR result for a license plate."""

    text: str
    confidence: float
    vehicle_bbox: tuple[int, int, int, int]


class PlateOCR:
    """EasyOCR-based license plate reader with plate region detection."""

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
            if x2 - x1 < 30 or y2 - y1 < 30:
                continue

            vehicle_crop = frame[y1:y2, x1:x2]

            # Step 1: locate plate region(s) within the vehicle crop
            plate_crops = _find_plate_regions(vehicle_crop)

            # Step 2: OCR each candidate plate region
            plate = None
            for crop in plate_crops:
                enhanced = _enhance_plate(crop)
                plate = self._ocr_plate(enhanced)
                if plate:
                    break

            # Step 3: fallback - try bottom half of vehicle (plates usually there)
            if not plate:
                vh, vw = vehicle_crop.shape[:2]
                bottom = vehicle_crop[vh // 2:, :]
                if bottom.shape[0] > 15 and bottom.shape[1] > 30:
                    enhanced = _enhance_plate(bottom)
                    plate = self._ocr_plate(enhanced)

            if plate:
                results.append(PlateResult(
                    text=plate[0], confidence=plate[1],
                    vehicle_bbox=(x1, y1, x2, y2),
                ))

        return results

    def _ocr_plate(self, image: np.ndarray) -> tuple[str, float] | None:
        """Run OCR on a plate image and return best plate-like text."""
        try:
            ocr_results = self._reader.readtext(image, detail=1)
        except Exception:
            return None

        if not ocr_results:
            return None

        # Collect all text fragments
        fragments: list[tuple[str, float]] = []
        for _, text, conf in ocr_results:
            if conf < _MIN_CONFIDENCE:
                continue
            clean = _normalize(text)
            if clean:
                fragments.append((clean, conf))

        if not fragments:
            return None

        # Strategy 1: check each fragment individually
        best: tuple[str, float] | None = None
        best_score = 0.0
        for text, conf in fragments:
            if _is_vn_plate(text):
                score = conf * len(text)
                if score > best_score:
                    best = (_format_plate(text), conf)
                    best_score = score

        if best:
            return best

        # Strategy 2: combine adjacent fragments (plates can be split)
        if len(fragments) >= 2:
            combined = "".join(t for t, _ in fragments)
            avg_conf = sum(c for _, c in fragments) / len(fragments)
            if _is_vn_plate(combined) and avg_conf >= _MIN_CONFIDENCE:
                return (_format_plate(combined), avg_conf)

        return None


def _find_plate_regions(vehicle_crop: np.ndarray) -> list[np.ndarray]:
    """Detect plate-like rectangular regions in a vehicle crop.

    Uses edge detection + contour finding to locate bright rectangular
    regions that match typical plate aspect ratios (2:1 to 5:1).
    """
    h, w = vehicle_crop.shape[:2]
    gray = cv2.cvtColor(vehicle_crop, cv2.COLOR_BGR2GRAY)

    # Bilateral filter to reduce noise while keeping edges
    gray = cv2.bilateralFilter(gray, 11, 17, 17)

    # Edge detection
    edges = cv2.Canny(gray, 30, 200)

    # Dilate to close gaps in edges
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    edges = cv2.dilate(edges, kernel, iterations=1)

    contours, _ = cv2.findContours(edges, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

    candidates: list[tuple[float, np.ndarray]] = []

    for cnt in contours:
        area = cv2.contourArea(cnt)
        # Plate should be at least 0.5% and at most 30% of vehicle crop
        if area < (h * w * 0.005) or area > (h * w * 0.3):
            continue

        # Approximate contour to polygon
        peri = cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, 0.04 * peri, True)

        # Plates are roughly rectangular (4 corners)
        if len(approx) < 4 or len(approx) > 8:
            continue

        rx, ry, rw, rh = cv2.boundingRect(approx)
        if rh == 0:
            continue

        aspect = rw / rh
        # Vietnamese plates: single-line ~3.5:1, two-line ~1.5:1
        if not (1.2 <= aspect <= 6.0):
            continue

        # Prefer candidates in the lower part of vehicle
        y_bonus = ry / h  # higher value = lower position = more likely plate
        score = area * (0.5 + y_bonus)
        crop = vehicle_crop[ry:ry + rh, rx:rx + rw]
        candidates.append((score, crop))

    # Sort by score descending, return top 3
    candidates.sort(key=lambda x: x[0], reverse=True)
    return [crop for _, crop in candidates[:3]]


def _enhance_plate(crop: np.ndarray) -> np.ndarray:
    """Enhance a plate crop for better OCR."""
    h, w = crop.shape[:2]

    # Upscale small plates
    if w < 200:
        scale = 200 / w
        crop = cv2.resize(crop, None, fx=scale, fy=scale,
                          interpolation=cv2.INTER_CUBIC)

    # Convert to grayscale
    if len(crop.shape) == 3:
        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    else:
        gray = crop

    # CLAHE for contrast
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(4, 4))
    gray = clahe.apply(gray)

    # Adaptive threshold for clean text
    binary = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 15, 4
    )

    # Slight morphological opening to remove noise
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
    binary = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)

    return binary


def _normalize(text: str) -> str:
    """Normalize OCR text: uppercase, keep only alphanumeric + separators."""
    cleaned = text.upper().strip()
    # Common OCR misreads
    cleaned = cleaned.replace("O", "0").replace("I", "1").replace("S", "5")
    cleaned = cleaned.replace("B", "8").replace("G", "6").replace("Z", "2")
    return re.sub(r"[^A-Z0-9\-\.]", "", cleaned)


def _is_vn_plate(text: str) -> bool:
    """Check if text matches a Vietnamese license plate pattern.

    Formats: 43A-31743, 92A12345, 51F1-12345, etc.
    Must start with 2 digits + letter, then 3-5 digits.
    """
    if len(text) < 7 or len(text) > 12:
        return False

    # Must have at least 5 digits total
    digit_count = sum(c.isdigit() for c in text)
    if digit_count < 5:
        return False

    # Must start with 2 digits
    if not (text[0].isdigit() and text[1].isdigit()):
        return False

    # 3rd char should be a letter (province code)
    if len(text) > 2 and text[2].isdigit():
        return False

    return True


def _format_plate(text: str) -> str:
    """Format a plate string with proper separator.

    Input:  43A31743 -> Output: 43A-31743
    """
    # Already has separator
    if "-" in text or "." in text:
        return text

    # Find where letter ends and digits begin after province code
    # Pattern: DD L [D] DDDDD
    m = re.match(r"^(\d{2}[A-Z]\d?)([\d.]+)$", text)
    if m:
        return f"{m.group(1)}-{m.group(2)}"

    return text
