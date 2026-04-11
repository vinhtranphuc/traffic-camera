package com.trafficcam.mng.adapter.inbound.rest

import com.trafficcam.mng.application.service.CameraService
import com.trafficcam.mng.application.service.DetectionService
import com.trafficcam.mng.common.response.ApiResponse
import com.trafficcam.mng.common.security.UserPrincipal
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/dashboard")
class DashboardController(
    private val cameraService: CameraService,
    private val detectionService: DetectionService,
) {

    @GetMapping("/summary")
    fun summary(@AuthenticationPrincipal p: UserPrincipal): ApiResponse<Map<String, Any>> {
        val statusSummary = cameraService.getStatusSummary(p)
        val totalCameras = statusSummary.values.sum()
        val activeCameras = statusSummary.getOrDefault("ACTIVE", 0L)
        val detectionStats = detectionService.getStats(p, 1)
        return ApiResponse.ok(mapOf(
            "totalCameras" to totalCameras,
            "activeCameras" to activeCameras,
            "cameraStatus" to statusSummary,
            "todayDetections" to (detectionStats["total"] ?: 0),
        ), "DASHBOARD_SUMMARY", "Summary retrieved")
    }

    @GetMapping("/detection-trend")
    fun detectionTrend(
        @AuthenticationPrincipal p: UserPrincipal,
        @RequestParam(defaultValue = "7") days: Int,
    ): ApiResponse<Map<String, Any>> =
        ApiResponse.ok(detectionService.getStats(p, days), "DASHBOARD_TREND", "Trend retrieved")

    @GetMapping("/camera-status")
    fun cameraStatus(@AuthenticationPrincipal p: UserPrincipal): ApiResponse<Map<String, Long>> =
        ApiResponse.ok(cameraService.getStatusSummary(p), "DASHBOARD_CAMERA_STATUS", "Camera status")
}
