package com.trafficcam.mng.adapter.outbound.persistence.entity

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "system_config")
class SystemConfigEntity(
    @Id @Column(columnDefinition = "CHAR(36)") var id: String = "",
    @Column(name = "config_key", nullable = false, unique = true, length = 100) var configKey: String = "",
    @Column(name = "config_value", nullable = false, columnDefinition = "TEXT") var configValue: String = "",
    @Column(nullable = false, length = 50) var category: String = "",
    @Column(length = 500) var description: String? = null,
    @Column(name = "updated_by", columnDefinition = "CHAR(36)") var updatedBy: String? = null,
    @Column(name = "updated_at", nullable = false) var updatedAt: Instant = Instant.now(),
)
