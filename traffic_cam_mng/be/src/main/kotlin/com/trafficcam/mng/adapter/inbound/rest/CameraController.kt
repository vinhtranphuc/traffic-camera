package com.trafficcam.mng.adapter.inbound.rest

import com.trafficcam.mng.adapter.outbound.persistence.repository.JpaDetectionEventRepository
import com.trafficcam.mng.application.dto.camera.*
import com.trafficcam.mng.application.service.CameraService
import com.trafficcam.mng.common.response.ApiResponse
import com.trafficcam.mng.common.security.UserPrincipal
import jakarta.validation.Valid
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/cameras")
class CameraController(
    private val cameraService: CameraService,
    private val detectionRepo: JpaDetectionEventRepository,
) {

    @GetMapping("/{id}/stats")
    fun getStats(@AuthenticationPrincipal p: UserPrincipal, @PathVariable id: String): ApiResponse<Map<String, Any>> {
        cameraService.getCamera(id, p) // access check
        val count = detectionRepo.countByCameraId(id)
        return ApiResponse.ok(mapOf("detectionCount" to count), "CAMERA_STATS", "Stats retrieved")
    }

    @GetMapping
    fun list(
        @AuthenticationPrincipal p: UserPrincipal,
        @PageableDefault(size = 20) pageable: Pageable,
    ): ApiResponse<Any> {
        val page = cameraService.listCameras(p, pageable)
        return ApiResponse.ok(mapOf(
            "items" to page.content, "totalItems" to page.totalElements,
            "totalPages" to page.totalPages, "currentPage" to page.number,
            "pageSize" to page.size, "hasNext" to page.hasNext(), "hasPrevious" to page.hasPrevious(),
        ), "CAMERA_LIST", "Cameras retrieved")
    }

    @PostMapping
    fun create(@AuthenticationPrincipal p: UserPrincipal, @Valid @RequestBody req: CreateCameraRequest): ApiResponse<CameraResponse> =
        ApiResponse.ok(cameraService.createCamera(req, p), "CAMERA_CREATED", "Camera created")

    @GetMapping("/{id}")
    fun get(@AuthenticationPrincipal p: UserPrincipal, @PathVariable id: String): ApiResponse<CameraResponse> =
        ApiResponse.ok(cameraService.getCamera(id, p), "CAMERA_DETAIL", "Camera retrieved")

    @PutMapping("/{id}")
    fun update(@AuthenticationPrincipal p: UserPrincipal, @PathVariable id: String, @Valid @RequestBody req: UpdateCameraRequest): ApiResponse<CameraResponse> =
        ApiResponse.ok(cameraService.updateCamera(id, req, p), "CAMERA_UPDATED", "Camera updated")

    @DeleteMapping("/{id}")
    fun delete(@AuthenticationPrincipal p: UserPrincipal, @PathVariable id: String): ApiResponse<Nothing> {
        cameraService.deleteCamera(id, p)
        return ApiResponse.ok(code = "CAMERA_DELETED", message = "Camera deleted")
    }

    @PutMapping("/{id}/start")
    fun start(@AuthenticationPrincipal p: UserPrincipal, @PathVariable id: String): ApiResponse<CameraResponse> =
        ApiResponse.ok(cameraService.startCamera(id, p), "CAMERA_STARTED", "Camera started")

    @PutMapping("/{id}/stop")
    fun stop(@AuthenticationPrincipal p: UserPrincipal, @PathVariable id: String): ApiResponse<CameraResponse> =
        ApiResponse.ok(cameraService.stopCamera(id, p), "CAMERA_STOPPED", "Camera stopped")

    @GetMapping("/map")
    fun map(@AuthenticationPrincipal p: UserPrincipal): ApiResponse<List<CameraResponse>> =
        ApiResponse.ok(cameraService.getMapCameras(p), "CAMERA_MAP", "Map cameras retrieved")

    @GetMapping("/status-summary")
    fun statusSummary(@AuthenticationPrincipal p: UserPrincipal): ApiResponse<Map<String, Long>> =
        ApiResponse.ok(cameraService.getStatusSummary(p), "CAMERA_STATUS_SUMMARY", "Status summary")

    @GetMapping("/{id}/stream-info")
    fun streamInfo(@AuthenticationPrincipal p: UserPrincipal, @PathVariable id: String): ApiResponse<Map<String, Any?>> {
        val camera = cameraService.getCamera(id, p)
        val config = camera.connectionConfig
        val info: Map<String, Any?> = when (camera.sourceType) {
            "HLS" -> mapOf(
                "type" to "hls",
                "url" to (config["url"] as? String ?: ""),
                "proxied" to false,
            )
            "HTTP_MJPEG" -> mapOf(
                "type" to "mjpeg",
                "url" to (config["url"] as? String ?: ""),
                "proxied" to false,
            )
            "RTSP" -> {
                val rtspUrl = buildRtspUrl(config)
                cameraService.registerMediaMtxPath(camera.id, rtspUrl)
                mapOf(
                    "type" to "hls",
                    "url" to "/hls/${camera.id}/index.m3u8",
                    "proxied" to true,
                )
            }
            else -> mapOf(
                "type" to "unsupported",
                "url" to null,
                "message" to "Browser không hỗ trợ loại stream: ${camera.sourceType}",
            )
        }
        return ApiResponse.ok(info, "STREAM_INFO", "Stream info")
    }

    private fun buildRtspUrl(config: Map<String, Any>): String {
        val host = config["host"] as? String
        if (host.isNullOrBlank()) return config["url"] as? String ?: ""
        val port = config["port"] as? String ?: "554"
        val path = config["path"] as? String ?: ""
        val user = config["username"] as? String
        val pass = config["password"] as? String
        val auth = if (!user.isNullOrBlank()) "${user}:${pass ?: ""}@" else ""
        return "rtsp://${auth}${host}:${port}${path}"
    }
}

@RestController
@RequestMapping("/api/v1/camera-approvals")
class CameraApprovalController(private val cameraService: CameraService) {

    @GetMapping
    fun list(
        @AuthenticationPrincipal p: UserPrincipal,
        @RequestParam(required = false) status: String?,
        @PageableDefault(size = 20) pageable: Pageable,
    ): ApiResponse<Any> {
        val page = cameraService.listApprovals(p, status, pageable)
        return ApiResponse.ok(mapOf(
            "items" to page.content, "totalItems" to page.totalElements,
            "totalPages" to page.totalPages, "currentPage" to page.number,
        ), "APPROVAL_LIST", "Approvals retrieved")
    }

    @GetMapping("/{id}")
    fun get(@PathVariable id: String): ApiResponse<CameraApprovalResponse> =
        ApiResponse.ok(cameraService.getApproval(id), "APPROVAL_DETAIL", "Approval retrieved")

    @PutMapping("/{id}/approve")
    fun approve(@AuthenticationPrincipal p: UserPrincipal, @PathVariable id: String): ApiResponse<CameraApprovalResponse> =
        ApiResponse.ok(cameraService.approveCamera(id, p), "CAMERA_APPROVED", "Camera approved")

    @PutMapping("/{id}/reject")
    fun reject(@AuthenticationPrincipal p: UserPrincipal, @PathVariable id: String, @RequestBody req: ApprovalActionRequest): ApiResponse<CameraApprovalResponse> =
        ApiResponse.ok(cameraService.rejectCamera(id, req.reason, p), "CAMERA_REJECTED", "Camera rejected")
}

@RestController
@RequestMapping("/api/v1/camera-groups")
class CameraGroupController(private val cameraService: CameraService) {

    @GetMapping
    fun list(@AuthenticationPrincipal p: UserPrincipal): ApiResponse<List<CameraGroupResponse>> =
        ApiResponse.ok(cameraService.listGroups(p), "GROUP_LIST", "Groups retrieved")

    @PostMapping
    fun create(@AuthenticationPrincipal p: UserPrincipal, @RequestBody body: Map<String, String>): ApiResponse<CameraGroupResponse> =
        ApiResponse.ok(cameraService.createGroup(body["name"] ?: "", body["description"], p), "GROUP_CREATED", "Group created")

    @DeleteMapping("/{id}")
    fun delete(@AuthenticationPrincipal p: UserPrincipal, @PathVariable id: String): ApiResponse<Nothing> {
        cameraService.deleteGroup(id, p)
        return ApiResponse.ok(code = "GROUP_DELETED", message = "Group deleted")
    }
}
