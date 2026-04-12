package com.trafficcam.mng.adapter.outbound.persistence.repository

import com.trafficcam.mng.adapter.outbound.persistence.entity.DetectionEventEntity
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.time.Instant

interface JpaDetectionEventRepository : JpaRepository<DetectionEventEntity, String> {
    fun findByCameraIdAndTimestampBetween(cameraId: String, from: Instant, to: Instant, pageable: Pageable): Page<DetectionEventEntity>
    fun findByCameraIdIn(cameraIds: List<String>, pageable: Pageable): Page<DetectionEventEntity>
    fun findByPlateTextContainingIgnoreCase(plateText: String, pageable: Pageable): Page<DetectionEventEntity>

    @Query("SELECT d.objectType, COUNT(d) FROM DetectionEventEntity d WHERE d.cameraId IN :cameraIds AND d.timestamp >= :since GROUP BY d.objectType")
    fun countByObjectTypeForCameras(cameraIds: List<String>, since: Instant): List<Array<Any>>

    @Query("SELECT FUNCTION('DATE', d.timestamp), COUNT(d) FROM DetectionEventEntity d WHERE d.cameraId IN :cameraIds AND d.timestamp >= :since GROUP BY FUNCTION('DATE', d.timestamp) ORDER BY FUNCTION('DATE', d.timestamp)")
    fun countByDateForCameras(cameraIds: List<String>, since: Instant): List<Array<Any>>

    fun countByCameraIdInAndTimestampAfter(cameraIds: List<String>, since: Instant): Long

    fun countByCameraId(cameraId: String): Long
}
