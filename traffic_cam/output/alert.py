"""License plate alert system."""

import logging

logger = logging.getLogger(__name__)


class PlateAlert:
    """Alert when specific license plates are detected."""

    def __init__(self) -> None:
        self._watchlist: set[str] = set()

    def add_plate(self, plate: str) -> None:
        """Add a plate number to the watchlist."""
        self._watchlist.add(plate.upper().strip())

    def remove_plate(self, plate: str) -> None:
        """Remove a plate from the watchlist."""
        self._watchlist.discard(plate.upper().strip())

    def check(self, plate_text: str) -> bool:
        """Check if a plate matches the watchlist."""
        normalized = plate_text.upper().strip()
        if normalized in self._watchlist:
            logger.warning("[ALERT] Watchlist plate detected: %s", normalized)
            return True
        return False
