CREATE TABLE notifications (
    id              CHAR(36)      NOT NULL PRIMARY KEY,
    user_id         CHAR(36)      NOT NULL,
    type            VARCHAR(50)   NOT NULL,
    title           VARCHAR(200)  NOT NULL,
    message         VARCHAR(1000) NOT NULL,
    data            JSON          NULL,
    is_read         BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_notifications_user (user_id),
    INDEX idx_notifications_user_read (user_id, is_read),
    INDEX idx_notifications_created (created_at),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
