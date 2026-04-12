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
        from: Instant? = null,
        to: Instant? = null,
        pageable: Pageable,
    ): Page<DetectionResponse> {
        val cameraIds = getScopedCameraIds(principal)
        if (cameraIds.isEmpty()) return Page.empty()
        val scoped = if (cameraId != null) listOf(cameraId).filter { it in cameraIds } else cameraIds
        if (scoped.isEmpty()) return Page.empty()

        val all = detectionRepo.findByCameraIdIn(scoped, Pageable.unpaged()).content
        val filtered = all.filter { e ->
            (objectType.isNullOrBlank() || e.objectType == objectType) &&
            (plateText.isNullOrBlank() || (e.plateText?.contains(plateText, ignoreCase = true) == true)) &&
            (from == null || e.timestamp.isAfter(from)) &&
            (to == null || e.timestamp.isBefore(to))
        }.sortedByDescending { it.timestamp }

        val start = (pageable.pageNumber * pageable.pageSize).coerceAtMost(filtered.size)
        val end = (start + pageable.pageSize).coerceAtMost(filtered.size)
        val pageContent = filtered.subList(start, end).map { it.toResponse() }
        return org.springframework.data.domain.PageImpl(pageContent, pageable, filtered.size.toLong())
    }

    fun exportCsv(
        principal: UserPrincipal,
        cameraId: String?,
        objectType: String?,
        plateText: String?,
        from: Instant? = null,
        to: Instant? = null,
    ): String {
        val cameraIds = getScopedCameraIds(principal)
        if (cameraIds.isEmpty()) return "timestamp,camera,object_type,confidence,plate_text,snapshot_url\n"
        val scoped = if (cameraId != null) listOf(cameraId).filter { it in cameraIds } else cameraIds

        val all = detectionRepo.findByCameraIdIn(scoped, Pageable.unpaged()).content
        val filtered = all.filter { e ->
            (objectType.isNullOrBlank() || e.objectType == objectType) &&
            (plateText.isNullOrBlank() || (e.plateText?.contains(plateText, ignoreCase = true) == true)) &&
            (from == null || e.timestamp.isAfter(from)) &&
            (to == null || e.timestamp.isBefore(to))
        }.sortedByDescending { it.timestamp }

        val sb = StringBuilder()
        sb.append("timestamp,camera,object_type,confidence,plate_text,snapshot_url\n")
        for (e in filtered) {
            val camera = cameraRepo.findById(e.cameraId).orElse(null)
            val camName = camera?.name?.replace(",", ";") ?: e.cameraId
            val plate = e.plateText?.replace(",", ";") ?: ""
            val url = e.snapshotUrl?.replace(",", ";") ?: ""
            sb.append("${e.timestamp},${camName},${e.objectType},${e.confidence},${plate},${url}\n")
        }
        return sb.toString()
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

    /** Today vs yesterday, this week vs last week. */
    fun getTrends(principal: UserPrincipal): Map<String, Any> {
        val cameraIds = getScopedCameraIds(principal)
        if (cameraIds.isEmpty()) return mapOf("today" to 0L, "yesterday" to 0L, "todayChange" to 0, "thisWeek" to 0L, "lastWeek" to 0L, "weekChange" to 0)

        val now = Instant.now()
        val startOfToday = now.truncatedTo(ChronoUnit.DAYS)
        val startOfYesterday = startOfToday.minus(1, ChronoUnit.DAYS)
        val startOfThisWeek = startOfToday.minus(7, ChronoUnit.DAYS)
        val startOfLastWeek = startOfToday.minus(14, ChronoUnit.DAYS)

        val today = detectionRepo.countByCameraIdInAndTimestampAfter(cameraIds, startOfToday)
        val yesterdayAll = detectionRepo.countByCameraIdInAndTimestampAfter(cameraIds, startOfYesterday)
        val yesterday = yesterdayAll - today
        val thisWeekCount = detectionRepo.countByCameraIdInAndTimestampAfter(cameraIds, startOfThisWeek)
        val lastWeekAll = detectionRepo.countByCameraIdInAndTimestampAfter(cameraIds, startOfLastWeek)
        val lastWeek = lastWeekAll - thisWeekCount

        return mapOf(
            "today" to today,
            "yesterday" to yesterday,
            "todayChange" to percentChange(yesterday, today),
            "thisWeek" to thisWeekCount,
            "lastWeek" to lastWeek,
            "weekChange" to percentChange(lastWeek, thisWeekCount),
        )
    }

    /** Detections per hour for camera (last 24h) — for peak hour chart. Always returns 24 bins. */
    fun getPeakHours(principal: UserPrincipal, cameraId: String): List<Map<String, Any>> {
        val byHour = (0..23).associateWith { 0L }.toMutableMap()
        val cameraIds = getScopedCameraIds(principal)
        if (cameraId in cameraIds) {
            val since = Instant.now().minus(24, ChronoUnit.HOURS)
            val events = detectionRepo.findByCameraIdIn(listOf(cameraId), Pageable.unpaged()).content
                .filter { it.timestamp.isAfter(since) }
            for (e in events) {
                val h = e.timestamp.atZone(java.time.ZoneId.systemDefault()).hour
                byHour[h] = (byHour[h] ?: 0) + 1
            }
        }
        return byHour.toSortedMap().map { (h, c) -> mapOf("hour" to h, "count" to c) }
    }

    private fun percentChange(previous: Long, current: Long): Int {
        if (previous == 0L) return if (current == 0L) 0 else 100
        return (((current - previous).toDouble() / previous) * 100).toInt()
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
