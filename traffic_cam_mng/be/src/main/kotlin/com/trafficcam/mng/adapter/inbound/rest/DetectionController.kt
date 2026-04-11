package com.trafficcam.mng.adapter.inbound.rest

import com.trafficcam.mng.application.service.DetectionResponse
import com.trafficcam.mng.application.service.DetectionService
import com.trafficcam.mng.application.service.IngestDetectionRequest
import com.trafficcam.mng.common.exception.UnauthorizedException
import com.trafficcam.mng.common.response.ApiResponse
import com.trafficcam.mng.common.security.UserPrincipal
import org.springframework.beans.factory.annotation.Value
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/detections")
class DetectionController(private val detectionService: DetectionService) {

    @GetMapping
    fun search(
        @AuthenticationPrincipal p: UserPrincipal,
        @RequestParam(required = false) cameraId: String?,
        @RequestParam(required = false) objectType: String?,
        @RequestParam(required = false) plateText: String?,
        @PageableDefault(size = 20) pageable: Pageable,
    ): ApiResponse<Any> {
        val page = detectionService.search(p, cameraId, objectType, plateText, pageable)
        return ApiResponse.ok(mapOf(
            "items" to page.content, "totalItems" to page.totalElements,
            "totalPages" to page.totalPages, "currentPage" to page.number,
            "pageSize" to page.size, "hasNext" to page.hasNext(),
        ), "DETECTION_LIST", "Detections retrieved")
    }

    @GetMapping("/{id}")
    fun get(@PathVariable id: String): ApiResponse<DetectionResponse> =
        ApiResponse.ok(detectionService.getById(id), "DETECTION_DETAIL", "Detection retrieved")

    @GetMapping("/stats")
    fun stats(
        @AuthenticationPrincipal p: UserPrincipal,
        @RequestParam(defaultValue = "7") days: Int,
    ): ApiResponse<Map<String, Any>> =
        ApiResponse.ok(detectionService.getStats(p, days), "DETECTION_STATS", "Stats retrieved")
}

@RestController
@RequestMapping("/api/internal")
class InternalApiController(
    private val detectionService: DetectionService,
    @Value("\${app.internal-api-key}") private val internalApiKey: String,
) {

    @PostMapping("/detections")
    fun ingest(
        @RequestHeader("X-API-Key") apiKey: String,
        @RequestBody request: IngestDetectionRequest,
    ): ApiResponse<DetectionResponse> {
        validateApiKey(apiKey)
        return ApiResponse.ok(detectionService.ingest(request), "DETECTION_INGESTED", "Detection saved")
    }

    @PostMapping("/detections/batch")
    fun ingestBatch(
        @RequestHeader("X-API-Key") apiKey: String,
        @RequestBody requests: List<IngestDetectionRequest>,
    ): ApiResponse<List<DetectionResponse>> {
        validateApiKey(apiKey)
        return ApiResponse.ok(detectionService.ingestBatch(requests), "DETECTION_BATCH_INGESTED", "Batch saved")
    }

    private fun validateApiKey(key: String) {
        if (key != internalApiKey) throw UnauthorizedException("INTERNAL_INVALID_KEY", "Invalid API key")
    }
}
