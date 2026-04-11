CREATE TABLE user_sessions (
    id              CHAR(36)     NOT NULL PRIMARY KEY,
    user_id         CHAR(36)     NOT NULL,
    refresh_token   VARCHAR(500) NOT NULL UNIQUE,
    device_info     VARCHAR(500) NULL,
    ip_address      VARCHAR(45)  NULL,
    fcm_token       VARCHAR(500) NULL,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_active_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at      TIMESTAMP    NOT NULL,

    INDEX idx_sessions_user (user_id),
    INDEX idx_sessions_refresh (refresh_token),
    INDEX idx_sessions_active (is_active),
    CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
