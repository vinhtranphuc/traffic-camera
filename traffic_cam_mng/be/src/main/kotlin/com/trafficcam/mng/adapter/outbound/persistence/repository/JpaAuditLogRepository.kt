package com.trafficcam.mng.adapter.outbound.persistence.repository

import com.trafficcam.mng.adapter.outbound.persistence.entity.AuditLogEntity
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import java.time.Instant

interface JpaAuditLogRepository : JpaRepository<AuditLogEntity, String> {
    fun findByUserIdOrderByCreatedAtDesc(userId: String, pageable: Pageable): Page<AuditLogEntity>
    fun findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType: String, entityId: String, pageable: Pageable): Page<AuditLogEntity>
    fun findByActionOrderByCreatedAtDesc(action: String, pageable: Pageable): Page<AuditLogEntity>
    fun findAllByOrderByCreatedAtDesc(pageable: Pageable): Page<AuditLogEntity>
    fun findByUserIdInOrderByCreatedAtDesc(userIds: List<String>, pageable: Pageable): Page<AuditLogEntity>
    fun findByUserIdInAndActionOrderByCreatedAtDesc(userIds: List<String>, action: String, pageable: Pageable): Page<AuditLogEntity>
}
