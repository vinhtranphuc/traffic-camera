package com.trafficcam.mng.application.dto.camera

import jakarta.validation.constraints.NotBlank
import java.math.BigDecimal

data class CreateCameraRequest(
    @field:NotBlank val name: String,
    @field:NotBlank val sourceType: String,
    val connectionConfig: Map<String, Any>,
    val groupId: String? = null,
    val latitude: BigDecimal? = null,
    val longitude: BigDecimal? = null,
    val detectionSettings: Map<String, Any>? = null,
)

data class UpdateCameraRequest(
    val name: String? = null,
    val sourceType: String? = null,
    val connectionConfig: Map<String, Any>? = null,
    val groupId: String? = null,
    val latitude: BigDecimal? = null,
    val longitude: BigDecimal? = null,
    val detectionSettings: Map<String, Any>? = null,
    val roiConfig: List<Map<String, Any>>? = null,
    val scheduleConfig: Map<String, Any>? = null,
)

data class ApprovalActionRequest(
    val reason: String? = null,
)

data class CameraResponse(
    val id: String,
    val name: String,
    val sourceType: String,
    val connectionConfig: Map<String, Any>,
    val status: String,
    val ownerId: String,
    val ownerName: String?,
    val groupId: String?,
    val groupName: String?,
    val latitude: BigDecimal?,
    val longitude: BigDecimal?,
    val detectionSettings: Map<String, Any>?,
    val roiConfig: List<Map<String, Any>>?,
    val scheduleConfig: Map<String, Any>?,
    val thumbnailUrl: String?,
    val rejectReason: String?,
    val createdAt: String,
    val updatedAt: String,
)

data class CameraApprovalResponse(
    val id: String,
    val cameraId: String,
    val cameraName: String?,
    val requestedBy: String,
    val requestedByName: String?,
    val reviewedBy: String?,
    val status: String,
    val reason: String?,
    val snapshotConfig: Map<String, Any>?,
    val createdAt: String,
    val reviewedAt: String?,
)

data class CameraGroupResponse(
    val id: String,
    val name: String,
    val description: String?,
    val ownerId: String,
    val cameraCount: Long,
    val createdAt: String,
)
