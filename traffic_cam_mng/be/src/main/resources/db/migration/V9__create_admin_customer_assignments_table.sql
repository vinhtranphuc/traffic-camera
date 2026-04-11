CREATE TABLE admin_customer_assignments (
    admin_id        CHAR(36)     NOT NULL,
    customer_id     CHAR(36)     NOT NULL,
    assigned_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    assigned_by     CHAR(36)     NULL,

    PRIMARY KEY (admin_id, customer_id),
    INDEX idx_assignment_customer (customer_id),
    CONSTRAINT fk_assignment_admin FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_assignment_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_assignment_assigned_by FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
