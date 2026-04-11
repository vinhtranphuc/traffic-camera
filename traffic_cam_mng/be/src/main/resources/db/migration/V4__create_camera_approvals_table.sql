CREATE TABLE camera_approvals (
    id              CHAR(36)     NOT NULL PRIMARY KEY,
    camera_id       CHAR(36)     NOT NULL,
    requested_by    CHAR(36)     NOT NULL,
    reviewed_by     CHAR(36)     NULL,
    status          ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    reason          VARCHAR(500) NULL,
    snapshot_config JSON         NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at     TIMESTAMP    NULL,

    INDEX idx_approvals_camera (camera_id),
    INDEX idx_approvals_status (status),
    INDEX idx_approvals_requested_by (requested_by),
    INDEX idx_approvals_reviewed_by (reviewed_by),
    CONSTRAINT fk_approvals_camera FOREIGN KEY (camera_id) REFERENCES cameras(id) ON DELETE CASCADE,
    CONSTRAINT fk_approvals_requested_by FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_approvals_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
