package com.trafficcam.mng.adapter.outbound.persistence.entity

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "user_sessions")
class UserSessionEntity(
    @Id
    @Column(columnDefinition = "CHAR(36)")
    var id: String = "",

    @Column(name = "user_id", nullable = false, columnDefinition = "CHAR(36)")
    var userId: String = "",

    @Column(name = "refresh_token", nullable = false, unique = true, length = 500)
    var refreshToken: String = "",

    @Column(name = "device_info", length = 500)
    var deviceInfo: String? = null,

    @Column(name = "ip_address", length = 45)
    var ipAddress: String? = null,

    @Column(name = "fcm_token", length = 500)
    var fcmToken: String? = null,

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true,

    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: Instant = Instant.now(),

    @Column(name = "last_active_at", nullable = false)
    var lastActiveAt: Instant = Instant.now(),

    @Column(name = "expires_at", nullable = false)
    var expiresAt: Instant = Instant.now(),
)
