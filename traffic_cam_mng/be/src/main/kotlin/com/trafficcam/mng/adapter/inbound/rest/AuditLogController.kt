package com.trafficcam.mng.adapter.inbound.rest

import com.trafficcam.mng.application.service.AuditLogResponse
import com.trafficcam.mng.application.service.AuditLogService
import com.trafficcam.mng.common.response.ApiResponse
import com.trafficcam.mng.common.security.UserPrincipal
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/audit-logs")
@PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'SUPER_ADMIN', 'ADMIN')")
class AuditLogController(private val auditService: AuditLogService) {

    @GetMapping
    fun list(
        @AuthenticationPrincipal principal: UserPrincipal,
        @RequestParam(required = false) userId: String?,
        @RequestParam(required = false) entityType: String?,
        @RequestParam(required = false) entityId: String?,
        @RequestParam(required = false) action: String?,
        @PageableDefault(size = 50) pageable: Pageable,
    ): ApiResponse<Any> {
        val page = auditService.list(principal, pageable, userId, entityType, entityId, action)
        return ApiResponse.ok(mapOf(
            "items" to page.content,
            "totalItems" to page.totalElements,
            "totalPages" to page.totalPages,
            "currentPage" to page.number,
            "pageSize" to page.size,
        ), "AUDIT_LIST", "Audit logs retrieved")
    }
}
