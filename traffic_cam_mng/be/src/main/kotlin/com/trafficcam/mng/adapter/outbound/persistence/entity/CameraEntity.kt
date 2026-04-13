package com.trafficcam.mng.adapter.outbound.persistence.entity

import jakarta.persistence.*
import java.math.BigDecimal
import java.time.Instant

@Entity
@Table(name = "cameras")
class CameraEntity(
    @Id @Column(columnDefinition = "CHAR(36)") var id: String = "",
    @Column(nullable = false, length = 100) var name: String = "",

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false)
    var sourceType: SourceTypeEnum = SourceTypeEnum.RTSP,

    @Column(name = "connection_config", nullable = false, columnDefinition = "JSON")
    var connectionConfig: String = "{}",

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: CameraStatusEnum = CameraStatusEnum.PENDING_APPROVAL,

    @Column(name = "owner_id", nullable = false, columnDefinition = "CHAR(36)") var ownerId: String = "",
    @Column(name = "group_id", columnDefinition = "CHAR(36)") var groupId: String? = null,
    @Column(precision = 10, scale = 7) var latitude: BigDecimal? = null,
    @Column(precision = 10, scale = 7) var longitude: BigDecimal? = null,

    @Column(name = "detection_settings", columnDefinition = "JSON") var detectionSettings: String? = null,
    @Column(name = "detection_enabled", nullable = false) var detectionEnabled: Boolean = false,
    @Column(name = "roi_config", columnDefinition = "JSON") var roiConfig: String? = null,
    @Column(name = "schedule_config", columnDefinition = "JSON") var scheduleConfig: String? = null,
    @Column(name = "thumbnail_url", length = 500) var thumbnailUrl: String? = null,
    @Column(name = "reject_reason", length = 500) var rejectReason: String? = null,

    @Column(name = "created_at", nullable = false, updatable = false) var createdAt: Instant = Instant.now(),
    @Column(name = "updated_at", nullable = false) var updatedAt: Instant = Instant.now(),
)

enum class SourceTypeEnum { RTSP, HTTP_MJPEG, WEBRTC, USB, HLS }
enum class CameraStatusEnum { PENDING_APPROVAL, ACTIVE, REJECTED, OFFLINE, ERROR, STOPPED }
