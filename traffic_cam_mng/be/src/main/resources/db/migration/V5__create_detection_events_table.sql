CREATE TABLE detection_events (
    id              CHAR(36)     NOT NULL PRIMARY KEY,
    camera_id       CHAR(36)     NOT NULL,
    timestamp       TIMESTAMP(3) NOT NULL,
    object_type     VARCHAR(50)  NOT NULL,
    confidence      DECIMAL(5,4) NOT NULL,
    bounding_box    JSON         NOT NULL,
    snapshot_url    VARCHAR(500) NULL,
    plate_text      VARCHAR(20)  NULL,
    metadata        JSON         NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_detection_camera (camera_id),
    INDEX idx_detection_timestamp (timestamp),
    INDEX idx_detection_type (object_type),
    INDEX idx_detection_plate (plate_text),
    INDEX idx_detection_camera_time (camera_id, timestamp),
    CONSTRAINT fk_detection_camera FOREIGN KEY (camera_id) REFERENCES cameras(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
