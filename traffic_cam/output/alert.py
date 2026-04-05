"""License plate alert system."""


class PlateAlert:
    """Alert when specific license plates are detected.

    Currently a placeholder - prints to console.
    """

    def __init__(self) -> None:
        self._watchlist: set[str] = set()

    def add_plate(self, plate: str) -> None:
        """Add a plate number to the watchlist."""
        self._watchlist.add(plate.upper().strip())

    def check(self, plate_text: str) -> bool:
        """Check if a plate is on the watchlist.

        Returns:
            True if plate matches watchlist entry.
        """
        normalized = plate_text.upper().strip()
        if normalized in self._watchlist:
            print(f"[ALERT] Watchlist plate detected: {normalized}")
            return True
        return False
