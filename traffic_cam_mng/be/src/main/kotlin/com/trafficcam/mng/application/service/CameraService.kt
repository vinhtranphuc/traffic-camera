package com.trafficcam.mng.application.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.trafficcam.mng.adapter.outbound.persistence.entity.*
import com.trafficcam.mng.adapter.outbound.persistence.repository.*
import com.trafficcam.mng.application.dto.camera.*
import com.trafficcam.mng.common.exception.*
import com.trafficcam.mng.common.security.UserPrincipal
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.*

@Service
class CameraService(
    private val cameraRepo: JpaCameraRepository,
    private val approvalRepo: JpaCameraApprovalRepository,
    private val groupRepo: JpaCameraGroupRepository,
    private val userRepo: JpaUserRepository,
    private val assignmentRepo: JpaAdminAssignmentRepository,
    private val objectMapper: ObjectMapper,
    private val notificationService: NotificationService,
    private val auditLog: AuditLogService,
) {

    private val mediamtxApiBase = "http://mediamtx:9997"
    private val registeredPaths = mutableSetOf<String>()

    /** Register an RTSP source with MediaMTX so it can be served as HLS. */
    fun registerMediaMtxPath(cameraId: String, rtspUrl: String) {
        if (registeredPaths.contains(cameraId)) return
        try {
            val client = java.net.http.HttpClient.newHttpClient()
            val json = objectMapper.writeValueAsString(mapOf(
                "source" to rtspUrl,
                "sourceOnDemand" to true,
                "sourceOnDemandStartTimeout" to "15s",
                "sourceOnDemandCloseAfter" to "60s",
            ))
            val uri = java.net.URI.create("$mediamtxApiBase/v3/config/paths/add/$cameraId")
            val req = java.net.http.HttpRequest.newBuilder(uri)
                .header("Content-Type", "application/json")
                .POST(java.net.http.HttpRequest.BodyPublishers.ofString(json))
                .build()
            val resp = client.send(req, java.net.http.HttpResponse.BodyHandlers.ofString())
            // 200 = added, 400 = already exists (path conflict)
            if (resp.statusCode() in 200..299 || resp.body().contains("already")) {
                registeredPaths.add(cameraId)
            }
        } catch (_: Exception) {
            // Don't fail stream-info if MediaMTX unreachable
        }
    }

    fun listCameras(principal: UserPrincipal, pageable: Pageable): Page<CameraResponse> {
        val page = when {
            principal.isCustomer() -> cameraRepo.findByOwnerId(principal.userId, pageable)
            principal.isAdmin() -> {
                val customerIds = assignmentRepo.findCustomerIdsByAdminId(principal.userId) + principal.userId
                cameraRepo.findByOwnerIdIn(customerIds, pageable)
            }
            else -> cameraRepo.findAll(pageable)
        }
        // Batch-load related data to avoid N+1
        val ownerIds = page.content.map { it.ownerId }.toSet()
        val groupIds = page.content.mapNotNull { it.groupId }.toSet()
        val ownerMap = if (ownerIds.isNotEmpty()) userRepo.findAllById(ownerIds).associateBy { it.id } else emptyMap()
        val groupMap = if (groupIds.isNotEmpty()) groupRepo.findAllById(groupIds).associateBy { it.id } else emptyMap()
        return page.map { it.toResponse(ownerMap[it.ownerId], it.groupId?.let { gid -> groupMap[gid] }) }
    }

    fun getCamera(id: String, principal: UserPrincipal): CameraResponse {
        val camera = findCameraOrThrow(id)
        validateCameraAccess(camera, principal)
        return camera.toResponse()
    }

    @Transactional
    fun createCamera(request: CreateCameraRequest, principal: UserPrincipal): CameraResponse {
        val sourceType = parseSourceType(request.sourceType)
        val ownerId = principal.userId

        val needsApproval = principal.isCustomer()

        val camera = CameraEntity(
            id = UUID.randomUUID().toString(),
            name = request.name,
            sourceType = sourceType,
            connectionConfig = objectMapper.writeValueAsString(request.connectionConfig),
            status = if (needsApproval) CameraStatusEnum.PENDING_APPROVAL else CameraStatusEnum.ACTIVE,
            ownerId = ownerId,
            groupId = request.groupId,
            latitude = request.latitude,
            longitude = request.longitude,
            detectionSettings = request.detectionSettings?.let { objectMapper.writeValueAsString(it) },
        )
        cameraRepo.save(camera)

        if (needsApproval) {
            val approval = CameraApprovalEntity(
                id = UUID.randomUUID().toString(),
                cameraId = camera.id,
                requestedBy = principal.userId,
                status = ApprovalStatusEnum.PENDING,
                snapshotConfig = camera.connectionConfig,
            )
            approvalRepo.save(approval)
            notifyAdminsOfApprovalRequest(camera, principal.userId)
        }

        return camera.toResponse()
    }

    private fun notifyAdminsOfApprovalRequest(camera: CameraEntity, requesterId: String) {
        // Find admins assigned to this customer
        val adminIds = assignmentRepo.findAll()
            .filter { it.customerId == requesterId }
            .map { it.adminId }
            .toMutableList()
        // Also notify all super admins
        userRepo.findByRole(RoleEnum.SUPER_ADMIN, org.springframework.data.domain.Pageable.unpaged())
            .content.forEach { adminIds.add(it.id) }
        // If no admin assigned, notify all admins
        if (adminIds.none { userRepo.findById(it).map { u -> u.role == RoleEnum.ADMIN }.orElse(false) }) {
            userRepo.findByRole(RoleEnum.ADMIN, org.springframework.data.domain.Pageable.unpaged())
                .content.forEach { adminIds.add(it.id) }
        }

        val requester = userRepo.findById(requesterId).orElse(null)
        adminIds.distinct().forEach { adminId ->
            notificationService.send(
                userId = adminId,
                type = "CAMERA_APPROVAL_REQUESTED",
                title = "Yêu cầu phê duyệt camera mới",
                message = "${requester?.fullName ?: "Người dùng"} đã yêu cầu phê duyệt camera '${camera.name}'",
                data = mapOf(
                    "cameraId" to camera.id,
                    "cameraName" to camera.name,
                    "requestedBy" to (requester?.fullName ?: ""),
                    "redirectUrl" to "/admin/approvals",
                ),
            )
        }
    }

    @Transactional
    fun updateCamera(id: String, request: UpdateCameraRequest, principal: UserPrincipal): CameraResponse {
        val camera = findCameraOrThrow(id)
        validateCameraAccess(camera, principal)

        val sourceChanged = request.sourceType != null || request.connectionConfig != null

        request.name?.let { camera.name = it }
        request.sourceType?.let { camera.sourceType = parseSourceType(it) }
        request.connectionConfig?.let { camera.connectionConfig = objectMapper.writeValueAsString(it) }
        request.groupId?.let { camera.groupId = it }
        request.latitude?.let { camera.latitude = it }
        request.longitude?.let { camera.longitude = it }
        request.detectionSettings?.let { camera.detectionSettings = objectMapper.writeValueAsString(it) }
        request.roiConfig?.let { camera.roiConfig = objectMapper.writeValueAsString(it) }
        request.scheduleConfig?.let { camera.scheduleConfig = objectMapper.writeValueAsString(it) }
        camera.updatedAt = Instant.now()

        // Source change by customer triggers re-approval
        if (sourceChanged && principal.isCustomer()) {
            camera.status = CameraStatusEnum.PENDING_APPROVAL
            camera.rejectReason = null
            val approval = CameraApprovalEntity(
                id = UUID.randomUUID().toString(),
                cameraId = camera.id,
                requestedBy = principal.userId,
                status = ApprovalStatusEnum.PENDING,
                snapshotConfig = camera.connectionConfig,
            )
            approvalRepo.save(approval)
        }

        return cameraRepo.save(camera).toResponse()
    }

    @Transactional
    fun deleteCamera(id: String, principal: UserPrincipal) {
        val camera = findCameraOrThrow(id)
        validateCameraAccess(camera, principal)
        cameraRepo.delete(camera)
    }

    @Transactional
    fun startCamera(id: String, principal: UserPrincipal): CameraResponse {
        val camera = findCameraOrThrow(id)
        validateCameraAccess(camera, principal)
        if (camera.status != CameraStatusEnum.ACTIVE && camera.status != CameraStatusEnum.STOPPED) {
            throw ValidationException("CAMERA_NOT_ACTIVATABLE", "Camera must be ACTIVE or STOPPED to start")
        }
        camera.status = CameraStatusEnum.ACTIVE
        camera.updatedAt = Instant.now()
        return cameraRepo.save(camera).toResponse()
    }

    @Transactional
    fun stopCamera(id: String, principal: UserPrincipal): CameraResponse {
        val camera = findCameraOrThrow(id)
        validateCameraAccess(camera, principal)
        camera.status = CameraStatusEnum.STOPPED
        camera.updatedAt = Instant.now()
        return cameraRepo.save(camera).toResponse()
    }

    fun getMapCameras(principal: UserPrincipal): List<CameraResponse> {
        val cameras = when {
            principal.isCustomer() -> cameraRepo.findAllWithLocation().filter { it.ownerId == principal.userId }
            principal.isAdmin() -> {
                val ids = assignmentRepo.findCustomerIdsByAdminId(principal.userId) + principal.userId
                cameraRepo.findByOwnerIdInWithLocation(ids)
            }
            else -> cameraRepo.findAllWithLocation()
        }
        return cameras.map { it.toResponse() }
    }

    fun getStatusSummary(principal: UserPrincipal): Map<String, Long> {
        val grouped = when {
            principal.isCustomer() -> cameraRepo.countByStatusGroupedForOwners(listOf(principal.userId))
            principal.isAdmin() -> {
                val ids = assignmentRepo.findCustomerIdsByAdminId(principal.userId) + principal.userId
                cameraRepo.countByStatusGroupedForOwners(ids)
            }
            else -> cameraRepo.countByStatusGrouped()
        }
        return grouped.associate { (it[0] as CameraStatusEnum).name to (it[1] as Long) }
    }

    // --- Approval ---

    fun listApprovals(principal: UserPrincipal, status: String?, pageable: Pageable): Page<CameraApprovalResponse> {
        val approvalStatus = status?.let { ApprovalStatusEnum.valueOf(it) } ?: ApprovalStatusEnum.PENDING
        return approvalRepo.findByStatus(approvalStatus, pageable).map { it.toResponse() }
    }

    fun getApproval(id: String): CameraApprovalResponse {
        val approval = approvalRepo.findById(id)
            .orElseThrow { NotFoundException("APPROVAL_NOT_FOUND", "Approval not found") }
        return approval.toResponse()
    }

    @Transactional
    fun approveCamera(approvalId: String, principal: UserPrincipal): CameraApprovalResponse {
        val approval = approvalRepo.findById(approvalId)
            .orElseThrow { NotFoundException("APPROVAL_NOT_FOUND", "Approval not found") }

        if (approval.status != ApprovalStatusEnum.PENDING) {
            throw ValidationException("APPROVAL_NOT_PENDING", "Approval is not pending")
        }

        approval.status = ApprovalStatusEnum.APPROVED
        approval.reviewedBy = principal.userId
        approval.reviewedAt = Instant.now()
        approvalRepo.save(approval)

        val camera = findCameraOrThrow(approval.cameraId)
        camera.status = CameraStatusEnum.ACTIVE
        camera.rejectReason = null
        camera.updatedAt = Instant.now()
        cameraRepo.save(camera)

        notificationService.send(
            userId = camera.ownerId,
            type = "CAMERA_APPROVED",
            title = "Camera đã được phê duyệt",
            message = "Camera '${camera.name}' đã được phê duyệt và có thể hoạt động",
            data = mapOf("cameraId" to camera.id, "cameraName" to camera.name, "redirectUrl" to "/cameras"),
        )
        auditLog.log("CAMERA_APPROVED", "Camera", camera.id, principal = principal,
            newValue = mapOf("name" to camera.name, "approvalId" to approvalId))

        return approval.toResponse()
    }

    @Transactional
    fun rejectCamera(approvalId: String, reason: String?, principal: UserPrincipal): CameraApprovalResponse {
        val approval = approvalRepo.findById(approvalId)
            .orElseThrow { NotFoundException("APPROVAL_NOT_FOUND", "Approval not found") }

        if (approval.status != ApprovalStatusEnum.PENDING) {
            throw ValidationException("APPROVAL_NOT_PENDING", "Approval is not pending")
        }

        approval.status = ApprovalStatusEnum.REJECTED
        approval.reviewedBy = principal.userId
        approval.reviewedAt = Instant.now()
        approval.reason = reason
        approvalRepo.save(approval)

        val camera = findCameraOrThrow(approval.cameraId)
        camera.status = CameraStatusEnum.REJECTED
        camera.rejectReason = reason
        camera.updatedAt = Instant.now()
        cameraRepo.save(camera)

        notificationService.send(
            userId = camera.ownerId,
            type = "CAMERA_REJECTED",
            title = "Camera đã bị từ chối",
            message = "Camera '${camera.name}' bị từ chối${if (!reason.isNullOrBlank()) ". Lý do: $reason" else ""}",
            data = mapOf("cameraId" to camera.id, "cameraName" to camera.name, "reason" to (reason ?: ""), "redirectUrl" to "/cameras"),
        )
        auditLog.log("CAMERA_REJECTED", "Camera", camera.id, principal = principal,
            newValue = mapOf("name" to camera.name, "reason" to (reason ?: "")))

        return approval.toResponse()
    }

    // --- Camera Groups ---

    fun listGroups(principal: UserPrincipal): List<CameraGroupResponse> {
        val groups = when {
            principal.isCustomer() -> groupRepo.findByOwnerId(principal.userId)
            principal.isAdmin() -> {
                val ids = assignmentRepo.findCustomerIdsByAdminId(principal.userId) + principal.userId
                groupRepo.findByOwnerIdIn(ids)
            }
            else -> groupRepo.findAll()
        }
        return groups.map { g ->
            val count = cameraRepo.findByGroupId(g.id).size.toLong()
            CameraGroupResponse(g.id, g.name, g.description, g.ownerId, count, g.createdAt.toString())
        }
    }

    @Transactional
    fun createGroup(name: String, description: String?, principal: UserPrincipal): CameraGroupResponse {
        val group = CameraGroupEntity(
            id = UUID.randomUUID().toString(),
            name = name,
            description = description,
            ownerId = principal.userId,
        )
        groupRepo.save(group)
        return CameraGroupResponse(group.id, group.name, group.description, group.ownerId, 0, group.createdAt.toString())
    }

    @Transactional
    fun deleteGroup(id: String, principal: UserPrincipal) {
        val group = groupRepo.findById(id)
            .orElseThrow { NotFoundException("GROUP_NOT_FOUND", "Group not found") }
        if (group.ownerId != principal.userId && !principal.isAdminOrAbove()) {
            throw ForbiddenException("GROUP_FORBIDDEN", "Cannot delete this group")
        }
        // Unassign cameras
        cameraRepo.findByGroupId(id).forEach { c -> c.groupId = null; cameraRepo.save(c) }
        groupRepo.delete(group)
    }

    // --- Helpers ---

    private fun findCameraOrThrow(id: String): CameraEntity =
        cameraRepo.findById(id).orElseThrow { NotFoundException("CAMERA_NOT_FOUND", "Camera not found") }

    private fun validateCameraAccess(camera: CameraEntity, principal: UserPrincipal) {
        if (principal.isCustomer() && camera.ownerId != principal.userId) {
            throw ForbiddenException("CAMERA_FORBIDDEN", "Access denied to this camera")
        }
        if (principal.isAdmin()) {
            val customerIds = assignmentRepo.findCustomerIdsByAdminId(principal.userId) + principal.userId
            if (camera.ownerId !in customerIds) {
                throw ForbiddenException("CAMERA_FORBIDDEN", "Access denied to this camera")
            }
        }
    }

    private fun parseSourceType(value: String): SourceTypeEnum =
        try { SourceTypeEnum.valueOf(value) }
        catch (e: IllegalArgumentException) { throw ValidationException("CAMERA_INVALID_SOURCE", "Invalid source type: $value") }

    private fun CameraEntity.toResponse(
        preloadedOwner: UserEntity? = null,
        preloadedGroup: CameraGroupEntity? = null,
    ): CameraResponse {
        val owner = preloadedOwner ?: userRepo.findById(ownerId).orElse(null)
        val group = preloadedGroup ?: groupId?.let { groupRepo.findById(it).orElse(null) }
        return CameraResponse(
            id = id, name = name, sourceType = sourceType.name,
            connectionConfig = objectMapper.readValue(connectionConfig),
            status = status.name, ownerId = ownerId, ownerName = owner?.fullName,
            groupId = groupId, groupName = group?.name,
            latitude = latitude, longitude = longitude,
            detectionSettings = detectionSettings?.let { objectMapper.readValue(it) },
            roiConfig = roiConfig?.let { objectMapper.readValue(it) },
            scheduleConfig = scheduleConfig?.let { objectMapper.readValue(it) },
            thumbnailUrl = thumbnailUrl, rejectReason = rejectReason,
            createdAt = createdAt.toString(), updatedAt = updatedAt.toString(),
        )
    }

    private fun CameraApprovalEntity.toResponse(): CameraApprovalResponse {
        val camera = cameraRepo.findById(cameraId).orElse(null)
        val requester = userRepo.findById(requestedBy).orElse(null)
        return CameraApprovalResponse(
            id = id, cameraId = cameraId, cameraName = camera?.name,
            requestedBy = requestedBy, requestedByName = requester?.fullName,
            reviewedBy = reviewedBy, status = status.name, reason = reason,
            snapshotConfig = snapshotConfig?.let { objectMapper.readValue(it) },
            createdAt = createdAt.toString(), reviewedAt = reviewedAt?.toString(),
        )
    }
}
