"""Event logger for detection results."""

import csv
from datetime import datetime
from pathlib import Path


class EventLogger:
    """Log detection events to daily CSV files."""

    HEADERS = ["timestamp", "event_type", "class_name", "confidence", "bbox", "plate_text"]

    def __init__(self, log_dir: str = "data/logs") -> None:
        self._log_dir = Path(log_dir)
        self._log_dir.mkdir(parents=True, exist_ok=True)
        self._log_file = self._log_dir / f"events_{datetime.now():%Y%m%d}.csv"
        self._initialized = False

    def _ensure_file(self) -> None:
        if not self._initialized and not self._log_file.exists():
            with open(self._log_file, "w", newline="") as f:
                csv.writer(f).writerow(self.HEADERS)
        self._initialized = True

    def log_detection(
        self,
        class_name: str,
        confidence: float,
        bbox: tuple[int, int, int, int],
        plate_text: str = "",
    ) -> None:
        """Log a single detection event."""
        self._ensure_file()
        with open(self._log_file, "a", newline="") as f:
            csv.writer(f).writerow([
                datetime.now().isoformat(), "detection",
                class_name, f"{confidence:.3f}", str(bbox), plate_text,
            ])
