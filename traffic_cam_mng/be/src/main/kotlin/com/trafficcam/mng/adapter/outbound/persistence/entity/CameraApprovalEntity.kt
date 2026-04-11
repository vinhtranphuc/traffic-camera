package com.trafficcam.mng.adapter.outbound.persistence.entity

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "camera_approvals")
class CameraApprovalEntity(
    @Id @Column(columnDefinition = "CHAR(36)") var id: String = "",
    @Column(name = "camera_id", nullable = false, columnDefinition = "CHAR(36)") var cameraId: String = "",
    @Column(name = "requested_by", nullable = false, columnDefinition = "CHAR(36)") var requestedBy: String = "",
    @Column(name = "reviewed_by", columnDefinition = "CHAR(36)") var reviewedBy: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: ApprovalStatusEnum = ApprovalStatusEnum.PENDING,

    @Column(length = 500) var reason: String? = null,
    @Column(name = "snapshot_config", columnDefinition = "JSON") var snapshotConfig: String? = null,
    @Column(name = "created_at", nullable = false, updatable = false) var createdAt: Instant = Instant.now(),
    @Column(name = "reviewed_at") var reviewedAt: Instant? = null,
)

enum class ApprovalStatusEnum { PENDING, APPROVED, REJECTED }
