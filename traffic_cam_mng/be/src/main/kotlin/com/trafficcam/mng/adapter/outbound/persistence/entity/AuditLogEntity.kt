package com.trafficcam.mng.adapter.outbound.persistence.entity

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "audit_logs")
class AuditLogEntity(
    @Id @Column(columnDefinition = "CHAR(36)") var id: String = "",
    @Column(name = "user_id", columnDefinition = "CHAR(36)") var userId: String? = null,
    @Column(length = 100) var username: String? = null,
    @Column(nullable = false, length = 100) var action: String = "",
    @Column(name = "entity_type", nullable = false, length = 50) var entityType: String = "",
    @Column(name = "entity_id", length = 100) var entityId: String? = null,
    @Column(name = "old_value", columnDefinition = "JSON") var oldValue: String? = null,
    @Column(name = "new_value", columnDefinition = "JSON") var newValue: String? = null,
    @Column(name = "ip_address", length = 45) var ipAddress: String? = null,
    @Column(name = "user_agent", length = 500) var userAgent: String? = null,
    @Column(nullable = false) var success: Boolean = true,
    @Column(name = "error_message", length = 500) var errorMessage: String? = null,
    @Column(name = "created_at", nullable = false, updatable = false) var createdAt: Instant = Instant.now(),
)
