package com.trafficcam.mng.adapter.outbound.persistence.entity

import jakarta.persistence.*
import java.math.BigDecimal
import java.time.Instant

@Entity
@Table(name = "detection_events")
class DetectionEventEntity(
    @Id @Column(columnDefinition = "CHAR(36)") var id: String = "",
    @Column(name = "camera_id", nullable = false, columnDefinition = "CHAR(36)") var cameraId: String = "",
    @Column(nullable = false) var timestamp: Instant = Instant.now(),
    @Column(name = "object_type", nullable = false, length = 50) var objectType: String = "",
    @Column(nullable = false, precision = 5, scale = 4) var confidence: BigDecimal = BigDecimal.ZERO,
    @Column(name = "bounding_box", nullable = false, columnDefinition = "JSON") var boundingBox: String = "{}",
    @Column(name = "snapshot_url", length = 500) var snapshotUrl: String? = null,
    @Column(name = "plate_text", length = 20) var plateText: String? = null,
    @Column(columnDefinition = "JSON") var metadata: String? = null,
    @Column(name = "created_at", nullable = false, updatable = false) var createdAt: Instant = Instant.now(),
)
