package com.trafficcam.mng.adapter.outbound.persistence.entity

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "notifications")
class NotificationEntity(
    @Id @Column(columnDefinition = "CHAR(36)") var id: String = "",
    @Column(name = "user_id", nullable = false, columnDefinition = "CHAR(36)") var userId: String = "",
    @Column(nullable = false, length = 50) var type: String = "",
    @Column(nullable = false, length = 200) var title: String = "",
    @Column(nullable = false, length = 1000) var message: String = "",
    @Column(columnDefinition = "JSON") var data: String? = null,
    @Column(name = "is_read", nullable = false) var isRead: Boolean = false,
    @Column(name = "created_at", nullable = false, updatable = false) var createdAt: Instant = Instant.now(),
)
