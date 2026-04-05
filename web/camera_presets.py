"""Pre-configured public traffic camera presets."""

CAMERA_PRESETS: list[dict] = [
    # --- Caltrans District 7 (Los Angeles) ---
    {
        "id": "caltrans-i110-ave26",
        "name": "I-110 / Avenue 26 Off Ramp",
        "group": "Caltrans - Los Angeles",
        "type": "snapshot",
        "url": "https://cwwp2.dot.ca.gov/data/d7/cctv/image/i110196avenue26offramp/i110196avenue26offramp.jpg",
        "interval": 2.0,
    },
    {
        "id": "caltrans-i5-slauson",
        "name": "I-5 / Slauson Ave",
        "group": "Caltrans - Los Angeles",
        "type": "snapshot",
        "url": "https://cwwp2.dot.ca.gov/data/d7/cctv/image/i52slausonave/i52slausonave.jpg",
        "interval": 2.0,
    },
    {
        "id": "caltrans-i5-triggs",
        "name": "I-5 / Triggs",
        "group": "Caltrans - Los Angeles",
        "type": "snapshot",
        "url": "https://cwwp2.dot.ca.gov/data/d7/cctv/image/i57triggs/i57triggs.jpg",
        "interval": 2.0,
    },
    {
        "id": "caltrans-i10-alameda",
        "name": "I-10 / Alameda St",
        "group": "Caltrans - Los Angeles",
        "type": "snapshot",
        "url": "https://cwwp2.dot.ca.gov/data/d7/cctv/image/i10alamedast/i10alamedast.jpg",
        "interval": 2.0,
    },
    {
        "id": "caltrans-us101-vineland",
        "name": "US-101 / Vineland Ave",
        "group": "Caltrans - Los Angeles",
        "type": "snapshot",
        "url": "https://cwwp2.dot.ca.gov/data/d7/cctv/image/us101vinelandave/us101vinelandave.jpg",
        "interval": 2.0,
    },
    # --- Caltrans District 4 (San Francisco / Bay Area) ---
    {
        "id": "caltrans-i80-bay-bridge",
        "name": "I-80 / Bay Bridge Toll Plaza",
        "group": "Caltrans - Bay Area",
        "type": "snapshot",
        "url": "https://cwwp2.dot.ca.gov/data/d4/cctv/image/i80baybridgetollplaza/i80baybridgetollplaza.jpg",
        "interval": 2.0,
    },
    # --- TfL JamCam (London) ---
    {
        "id": "tfl-00001-07450",
        "name": "A406 Billet Road",
        "group": "TfL - London",
        "type": "snapshot",
        "url": "https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.07450.jpg",
        "interval": 5.0,
    },
    {
        "id": "tfl-00001-01onal",
        "name": "A1 Holloway Road",
        "group": "TfL - London",
        "type": "snapshot",
        "url": "https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.01596.jpg",
        "interval": 5.0,
    },
    {
        "id": "tfl-00001-02108",
        "name": "A40 Western Ave",
        "group": "TfL - London",
        "type": "snapshot",
        "url": "https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.02108.jpg",
        "interval": 5.0,
    },
    # --- Da Nang, Vietnam (YouTube Live) ---
    {
        "id": "dn-cau-rong",
        "name": "Nut giao thong Tay Cau Rong",
        "group": "Da Nang - YouTube Live",
        "type": "youtube",
        "url": "https://www.youtube.com/watch?v=5wLzH_GrRl8",
    },
    {
        "id": "dn-nguyen-hue",
        "name": "Cong truong Nguyen Hue",
        "group": "Da Nang - YouTube Live",
        "type": "youtube",
        "url": "https://www.youtube.com/watch?v=sJvEFrG0wq0",
    },
    {
        "id": "dn-benh-vien-c",
        "name": "Cong sau Benh vien C",
        "group": "Da Nang - YouTube Live",
        "type": "youtube",
        "url": "https://www.youtube.com/watch?v=oif_zZFIfB4",
    },
    {
        "id": "dn-benh-vien-view",
        "name": "View Cong trinh Benh vien",
        "group": "Da Nang - YouTube Live",
        "type": "youtube",
        "url": "https://www.youtube.com/watch?v=x8tUUv-NGXs",
    },
    {
        "id": "dn-phuong-tran",
        "name": "PTZ Phuong Tran",
        "group": "Da Nang - YouTube Live",
        "type": "youtube",
        "url": "https://www.youtube.com/watch?v=G_G8A6JU_LI",
    },
]


def get_presets() -> list[dict]:
    """Return all camera presets."""
    return CAMERA_PRESETS


def get_preset_by_id(preset_id: str) -> dict | None:
    """Find a preset by its ID."""
    for preset in CAMERA_PRESETS:
        if preset["id"] == preset_id:
            return preset
    return None


def get_groups() -> list[str]:
    """Return unique group names."""
    return list(dict.fromkeys(p["group"] for p in CAMERA_PRESETS))
