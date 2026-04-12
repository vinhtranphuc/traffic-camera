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
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import java.time.Instant

@RestController
@RequestMapping("/api/v1/detections")
class DetectionController(private val detectionService: DetectionService) {

    @GetMapping
    fun search(
        @AuthenticationPrincipal p: UserPrincipal,
        @RequestParam(required = false) cameraId: String?,
        @RequestParam(required = false) objectType: String?,
        @RequestParam(required = false) plateText: String?,
        @RequestParam(required = false) from: String?,
        @RequestParam(required = false) to: String?,
        @PageableDefault(size = 20) pageable: Pageable,
    ): ApiResponse<Any> {
        val fromInstant = from?.takeIf { it.isNotBlank() }?.let { parseInstant(it) }
        val toInstant = to?.takeIf { it.isNotBlank() }?.let { parseInstant(it) }
        val page = detectionService.search(p, cameraId, objectType, plateText, fromInstant, toInstant, pageable)
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

    @GetMapping("/export")
    fun export(
        @AuthenticationPrincipal p: UserPrincipal,
        @RequestParam(required = false) cameraId: String?,
        @RequestParam(required = false) objectType: String?,
        @RequestParam(required = false) plateText: String?,
        @RequestParam(required = false) from: String?,
        @RequestParam(required = false) to: String?,
    ): ResponseEntity<ByteArray> {
        val fromInstant = from?.takeIf { it.isNotBlank() }?.let { parseInstant(it) }
        val toInstant = to?.takeIf { it.isNotBlank() }?.let { parseInstant(it) }
        val csv = detectionService.exportCsv(p, cameraId, objectType, plateText, fromInstant, toInstant)
        val bytes = "\uFEFF$csv".toByteArray(Charsets.UTF_8) // UTF-8 BOM for Excel
        val filename = "detections-${Instant.now().epochSecond}.csv"
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"$filename\"")
            .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
            .body(bytes)
    }

    private fun parseInstant(s: String): Instant = try {
        Instant.parse(s)
    } catch (_: Exception) {
        // Try date-only
        try { Instant.parse("${s}T00:00:00Z") } catch (_: Exception) { Instant.EPOCH }
    }
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
