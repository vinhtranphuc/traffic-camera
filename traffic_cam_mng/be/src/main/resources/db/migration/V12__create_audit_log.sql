CREATE TABLE audit_logs (
    id              CHAR(36)     NOT NULL PRIMARY KEY,
    user_id         CHAR(36)     NULL,
    username        VARCHAR(100) NULL,
    action          VARCHAR(100) NOT NULL,
    entity_type     VARCHAR(50)  NOT NULL,
    entity_id       VARCHAR(100) NULL,
    old_value       JSON         NULL,
    new_value       JSON         NULL,
    ip_address      VARCHAR(45)  NULL,
    user_agent      VARCHAR(500) NULL,
    success         BOOLEAN      NOT NULL DEFAULT TRUE,
    error_message   VARCHAR(500) NULL,
    created_at      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX idx_audit_user (user_id),
    INDEX idx_audit_action (action),
    INDEX idx_audit_entity (entity_type, entity_id),
    INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
