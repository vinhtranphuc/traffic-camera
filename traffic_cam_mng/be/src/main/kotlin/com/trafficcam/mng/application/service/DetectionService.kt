package com.trafficcam.mng.application.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.trafficcam.mng.adapter.outbound.persistence.entity.DetectionEventEntity
import com.trafficcam.mng.adapter.outbound.persistence.repository.JpaAdminAssignmentRepository
import com.trafficcam.mng.adapter.outbound.persistence.repository.JpaCameraRepository
import com.trafficcam.mng.adapter.outbound.persistence.repository.JpaDetectionEventRepository
import com.trafficcam.mng.common.exception.NotFoundException
import com.trafficcam.mng.common.security.UserPrincipal
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.*

data class DetectionResponse(
    val id: String, val cameraId: String, val cameraName: String?,
    val timestamp: String, val objectType: String, val confidence: BigDecimal,
    val boundingBox: Map<String, Any>, val snapshotUrl: String?,
    val plateText: String?, val metadata: Map<String, Any>?,
)

data class IngestDetectionRequest(
    val cameraId: String, val objectType: String, val confidence: BigDecimal,
    val boundingBox: Map<String, Any>, val snapshotUrl: String? = null,
    val plateText: String? = null, val metadata: Map<String, Any>? = null,
    val timestamp: String? = null,
)

@Service
class DetectionService(
    private val detectionRepo: JpaDetectionEventRepository,
    private val cameraRepo: JpaCameraRepository,
    private val assignmentRepo: JpaAdminAssignmentRepository,
    private val messagingTemplate: SimpMessagingTemplate,
    private val objectMapper: ObjectMapper,
) {

    fun search(
        principal: UserPrincipal,
        cameraId: String?,
        objectType: String?,
        plateText: String?,
        pageable: Pageable,
    ): Page<DetectionResponse> {
        if (plateText != null) {
            return detectionRepo.findByPlateTextContainingIgnoreCase(plateText, pageable).map { it.toResponse() }
        }
        val cameraIds = getScopedCameraIds(principal)
        if (cameraIds.isEmpty()) return Page.empty()
        val filtered = if (cameraId != null) listOf(cameraId).filter { it in cameraIds } else cameraIds
        return detectionRepo.findByCameraIdIn(filtered, pageable).map { it.toResponse() }
    }

    fun getById(id: String): DetectionResponse {
        val event = detectionRepo.findById(id)
            .orElseThrow { NotFoundException("DETECTION_NOT_FOUND", "Detection not found") }
        return event.toResponse()
    }

    @Transactional
    fun ingest(request: IngestDetectionRequest): DetectionResponse {
        val camera = cameraRepo.findById(request.cameraId).orElse(null)
        val event = DetectionEventEntity(
            id = UUID.randomUUID().toString(),
            cameraId = request.cameraId,
            timestamp = request.timestamp?.let { Instant.parse(it) } ?: Instant.now(),
            objectType = request.objectType,
            confidence = request.confidence,
            boundingBox = objectMapper.writeValueAsString(request.boundingBox),
            snapshotUrl = request.snapshotUrl,
            plateText = request.plateText,
            metadata = request.metadata?.let { objectMapper.writeValueAsString(it) },
        )
        detectionRepo.save(event)

        val resp = event.toResponse()
        messagingTemplate.convertAndSend("/topic/detections/${request.cameraId}", resp)
        return resp
    }

    @Transactional
    fun ingestBatch(requests: List<IngestDetectionRequest>): List<DetectionResponse> =
        requests.map { ingest(it) }

    fun getStats(principal: UserPrincipal, days: Int): Map<String, Any> {
        val cameraIds = getScopedCameraIds(principal)
        if (cameraIds.isEmpty()) return mapOf("total" to 0, "byType" to emptyMap<String, Long>(), "byDate" to emptyList<Any>())
        val since = Instant.now().minus(days.toLong(), ChronoUnit.DAYS)
        val total = detectionRepo.countByCameraIdInAndTimestampAfter(cameraIds, since)
        val byType = detectionRepo.countByObjectTypeForCameras(cameraIds, since)
            .associate { (it[0] as String) to (it[1] as Long) }
        val byDate = detectionRepo.countByDateForCameras(cameraIds, since)
            .map { mapOf("date" to it[0].toString(), "count" to it[1]) }
        return mapOf("total" to total, "byType" to byType, "byDate" to byDate)
    }

    private fun getScopedCameraIds(principal: UserPrincipal): List<String> {
        val cameras = when {
            principal.isCustomer() -> cameraRepo.findByOwnerId(principal.userId, Pageable.unpaged()).content
            principal.isAdmin() -> {
                val ids = assignmentRepo.findCustomerIdsByAdminId(principal.userId) + principal.userId
                cameraRepo.findByOwnerIdIn(ids, Pageable.unpaged()).content
            }
            else -> cameraRepo.findAll()
        }
        return cameras.map { it.id }
    }

    private fun DetectionEventEntity.toResponse(): DetectionResponse {
        val camera = cameraRepo.findById(cameraId).orElse(null)
        return DetectionResponse(
            id = id, cameraId = cameraId, cameraName = camera?.name,
            timestamp = timestamp.toString(), objectType = objectType,
            confidence = confidence, boundingBox = objectMapper.readValue(boundingBox),
            snapshotUrl = snapshotUrl, plateText = plateText,
            metadata = metadata?.let { objectMapper.readValue(it) },
        )
    }
}
