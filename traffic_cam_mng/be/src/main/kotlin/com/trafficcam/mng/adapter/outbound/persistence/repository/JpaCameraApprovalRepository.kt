package com.trafficcam.mng.adapter.outbound.persistence.repository

import com.trafficcam.mng.adapter.outbound.persistence.entity.ApprovalStatusEnum
import com.trafficcam.mng.adapter.outbound.persistence.entity.CameraApprovalEntity
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository

interface JpaCameraApprovalRepository : JpaRepository<CameraApprovalEntity, String> {
    fun findByStatus(status: ApprovalStatusEnum, pageable: Pageable): Page<CameraApprovalEntity>
    fun findByCameraId(cameraId: String): List<CameraApprovalEntity>
    fun findByRequestedBy(requestedBy: String, pageable: Pageable): Page<CameraApprovalEntity>
    fun countByStatus(status: ApprovalStatusEnum): Long
}
