"""Event logger for detection results."""

import csv
from datetime import datetime
from pathlib import Path


class EventLogger:
    """Log detection events to CSV files."""

    def __init__(self, log_dir: str = "data/logs") -> None:
        self._log_dir = Path(log_dir)
        self._log_dir.mkdir(parents=True, exist_ok=True)
        self._log_file = self._log_dir / f"events_{datetime.now():%Y%m%d}.csv"
        self._initialized = False

    def _init_file(self) -> None:
        """Create CSV file with headers if it doesn't exist."""
        if not self._log_file.exists():
            with open(self._log_file, "w", newline="") as f:
                writer = csv.writer(f)
                writer.writerow([
                    "timestamp", "event_type", "class_name",
                    "confidence", "bbox", "plate_text",
                ])
        self._initialized = True

    def log_detection(
        self,
        class_name: str,
        confidence: float,
        bbox: tuple[int, int, int, int],
        plate_text: str = "",
    ) -> None:
        """Log a single detection event."""
        if not self._initialized:
            self._init_file()
        with open(self._log_file, "a", newline="") as f:
            writer = csv.writer(f)
            writer.writerow([
                datetime.now().isoformat(),
                "detection",
                class_name,
                f"{confidence:.3f}",
                f"{bbox}",
                plate_text,
            ])
