package com.trafficcam.mng.adapter.outbound.persistence.repository

import com.trafficcam.mng.adapter.outbound.persistence.entity.CameraGroupEntity
import org.springframework.data.jpa.repository.JpaRepository

interface JpaCameraGroupRepository : JpaRepository<CameraGroupEntity, String> {
    fun findByOwnerId(ownerId: String): List<CameraGroupEntity>
    fun findByOwnerIdIn(ownerIds: List<String>): List<CameraGroupEntity>
}
