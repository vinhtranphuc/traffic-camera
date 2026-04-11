CREATE TABLE users (
    id              CHAR(36)     NOT NULL PRIMARY KEY,
    username        VARCHAR(50)  NOT NULL UNIQUE,
    email           VARCHAR(255) NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            ENUM('SYSTEM_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'CUSTOMER') NOT NULL,
    full_name       VARCHAR(100) NOT NULL,
    phone           VARCHAR(20)  NULL,
    avatar_url      VARCHAR(500) NULL,
    is_locked       BOOLEAN      NOT NULL DEFAULT FALSE,
    locked_reason   VARCHAR(255) NULL,
    locked_at       TIMESTAMP    NULL,
    locked_by       CHAR(36)     NULL,
    oauth_provider  VARCHAR(20)  NULL,
    oauth_id        VARCHAR(255) NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_users_role (role),
    INDEX idx_users_email (email),
    INDEX idx_users_oauth (oauth_provider, oauth_id),
    CONSTRAINT fk_users_locked_by FOREIGN KEY (locked_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
