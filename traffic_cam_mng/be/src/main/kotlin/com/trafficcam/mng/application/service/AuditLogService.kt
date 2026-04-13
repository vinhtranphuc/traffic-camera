package com.trafficcam.mng.application.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.trafficcam.mng.adapter.outbound.persistence.entity.AuditLogEntity
import com.trafficcam.mng.adapter.outbound.persistence.repository.JpaAdminAssignmentRepository
import com.trafficcam.mng.adapter.outbound.persistence.repository.JpaAuditLogRepository
import com.trafficcam.mng.common.security.UserPrincipal
import jakarta.servlet.http.HttpServletRequest
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.web.context.request.RequestContextHolder
import org.springframework.web.context.request.ServletRequestAttributes
import java.time.Instant
import java.util.*

data class AuditLogResponse(
    val id: String,
    val userId: String?,
    val username: String?,
    val action: String,
    val entityType: String,
    val entityId: String?,
    val oldValue: Any?,
    val newValue: Any?,
    val ipAddress: String?,
    val success: Boolean,
    val errorMessage: String?,
    val createdAt: String,
)

@Service
class AuditLogService(
    private val auditRepo: JpaAuditLogRepository,
    private val assignmentRepo: JpaAdminAssignmentRepository,
    private val objectMapper: ObjectMapper,
) {

    /** Log a successful action. Fire-and-forget style — shouldn't break calling code. */
    fun log(
        action: String,
        entityType: String,
        entityId: String? = null,
        oldValue: Any? = null,
        newValue: Any? = null,
        principal: UserPrincipal? = null,
        userId: String? = null,
        username: String? = null,
    ) {
        try {
            val request = currentRequest()
            val entry = AuditLogEntity(
                id = UUID.randomUUID().toString(),
                userId = principal?.userId ?: userId,
                username = principal?.userName ?: username,
                action = action,
                entityType = entityType,
                entityId = entityId,
                oldValue = oldValue?.let { objectMapper.writeValueAsString(it) },
                newValue = newValue?.let { objectMapper.writeValueAsString(it) },
                ipAddress = request?.remoteAddr,
                userAgent = request?.getHeader("User-Agent")?.take(500),
                success = true,
                createdAt = Instant.now(),
            )
            auditRepo.save(entry)
        } catch (_: Exception) {
            // Never let audit failure break the action
        }
    }

    /**
     * List audit logs with role-based scoping (prompts/3.md):
     *   SystemAdmin + SuperAdmin: see all audit logs
     *   Admin: see only own logs + their managed customers' logs
     *   Customer: forbidden (enforced at controller via @PreAuthorize)
     */
    fun list(
        principal: UserPrincipal,
        pageable: Pageable,
        userId: String? = null,
        entityType: String? = null,
        entityId: String? = null,
        action: String? = null,
    ): Page<AuditLogResponse> {
        val scopedUserIds = scopedUserIds(principal)

        val page = when {
            // Admin scope: enforce scope first
            scopedUserIds != null -> {
                // If explicit userId filter is out of scope, return empty (no leak across scope)
                if (userId != null && userId !in scopedUserIds) return Page.empty(pageable)
                val finalIds = if (userId != null) listOf(userId) else scopedUserIds
                if (finalIds.isEmpty()) return Page.empty(pageable)
                if (action != null) auditRepo.findByUserIdInAndActionOrderByCreatedAtDesc(finalIds, action, pageable)
                else auditRepo.findByUserIdInOrderByCreatedAtDesc(finalIds, pageable)
            }
            // Super/System Admin full scope
            userId != null -> auditRepo.findByUserIdOrderByCreatedAtDesc(userId, pageable)
            entityType != null && entityId != null -> auditRepo.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId, pageable)
            action != null -> auditRepo.findByActionOrderByCreatedAtDesc(action, pageable)
            else -> auditRepo.findAllByOrderByCreatedAtDesc(pageable)
        }
        return page.map { it.toResponse() }
    }

    /** For Admin: returns list of allowed user IDs (self + managed customers). For SA/SysAdmin: null (no scope limit). */
    private fun scopedUserIds(principal: UserPrincipal): List<String>? {
        if (principal.isSystemAdmin() || principal.isSuperAdmin()) return null
        if (principal.isAdmin()) {
            val customerIds = assignmentRepo.findCustomerIdsByAdminId(principal.userId)
            return listOf(principal.userId) + customerIds
        }
        return emptyList() // should be blocked by @PreAuthorize but defense in depth
    }

    private fun AuditLogEntity.toResponse() = AuditLogResponse(
        id = id, userId = userId, username = username, action = action,
        entityType = entityType, entityId = entityId,
        oldValue = oldValue?.let { runCatching { objectMapper.readValue(it, Any::class.java) }.getOrNull() },
        newValue = newValue?.let { runCatching { objectMapper.readValue(it, Any::class.java) }.getOrNull() },
        ipAddress = ipAddress, success = success, errorMessage = errorMessage,
        createdAt = createdAt.toString(),
    )

    private fun currentRequest(): HttpServletRequest? =
        (RequestContextHolder.getRequestAttributes() as? ServletRequestAttributes)?.request
}
