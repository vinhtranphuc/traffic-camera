CREATE TABLE system_config (
    id              CHAR(36)     NOT NULL PRIMARY KEY,
    config_key      VARCHAR(100) NOT NULL UNIQUE,
    config_value    TEXT         NOT NULL,
    category        VARCHAR(50)  NOT NULL,
    description     VARCHAR(500) NULL,
    updated_by      CHAR(36)     NULL,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_config_category (category),
    CONSTRAINT fk_config_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
