package com.trafficcam.mng.adapter.outbound.persistence.entity

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "users")
class UserEntity(
    @Id
    @Column(columnDefinition = "CHAR(36)")
    var id: String = "",

    @Column(unique = true, nullable = false, length = 50)
    var username: String = "",

    @Column(unique = true)
    var email: String? = null,

    @Column(name = "password_hash", nullable = false)
    var passwordHash: String = "",

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var role: RoleEnum = RoleEnum.CUSTOMER,

    @Column(name = "full_name", nullable = false, length = 100)
    var fullName: String = "",

    @Column(length = 20)
    var phone: String? = null,

    @Column(name = "avatar_url", length = 500)
    var avatarUrl: String? = null,

    @Column(name = "is_locked", nullable = false)
    var isLocked: Boolean = false,

    @Column(name = "locked_reason")
    var lockedReason: String? = null,

    @Column(name = "locked_at")
    var lockedAt: Instant? = null,

    @Column(name = "locked_by", columnDefinition = "CHAR(36)")
    var lockedBy: String? = null,

    @Column(name = "oauth_provider", length = 20)
    var oauthProvider: String? = null,

    @Column(name = "oauth_id")
    var oauthId: String? = null,

    @Column(name = "notification_prefs", columnDefinition = "JSON")
    var notificationPrefs: String? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now(),
)

enum class RoleEnum {
    SYSTEM_ADMIN, SUPER_ADMIN, ADMIN, CUSTOMER
}
