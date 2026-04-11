package com.trafficcam.mng.adapter.outbound.persistence.entity

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "camera_groups")
class CameraGroupEntity(
    @Id @Column(columnDefinition = "CHAR(36)") var id: String = "",
    @Column(nullable = false, length = 100) var name: String = "",
    @Column(length = 500) var description: String? = null,
    @Column(name = "owner_id", nullable = false, columnDefinition = "CHAR(36)") var ownerId: String = "",
    @Column(name = "created_at", nullable = false, updatable = false) var createdAt: Instant = Instant.now(),
    @Column(name = "updated_at", nullable = false) var updatedAt: Instant = Instant.now(),
)
