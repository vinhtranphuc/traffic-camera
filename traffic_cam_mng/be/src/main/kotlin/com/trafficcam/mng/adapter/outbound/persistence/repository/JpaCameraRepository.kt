package com.trafficcam.mng.adapter.outbound.persistence.repository

import com.trafficcam.mng.adapter.outbound.persistence.entity.CameraEntity
import com.trafficcam.mng.adapter.outbound.persistence.entity.CameraStatusEnum
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface JpaCameraRepository : JpaRepository<CameraEntity, String> {
    fun findByOwnerId(ownerId: String, pageable: Pageable): Page<CameraEntity>
    fun findByOwnerIdIn(ownerIds: List<String>, pageable: Pageable): Page<CameraEntity>
    fun findByGroupId(groupId: String): List<CameraEntity>
    fun countByStatus(status: CameraStatusEnum): Long
    fun countByOwnerId(ownerId: String): Long

    @Query("SELECT c FROM CameraEntity c WHERE c.latitude IS NOT NULL AND c.longitude IS NOT NULL")
    fun findAllWithLocation(): List<CameraEntity>

    @Query("SELECT c FROM CameraEntity c WHERE c.ownerId IN :ownerIds AND c.latitude IS NOT NULL")
    fun findByOwnerIdInWithLocation(ownerIds: List<String>): List<CameraEntity>

    @Query("SELECT c.status, COUNT(c) FROM CameraEntity c GROUP BY c.status")
    fun countByStatusGrouped(): List<Array<Any>>

    @Query("SELECT c.status, COUNT(c) FROM CameraEntity c WHERE c.ownerId IN :ownerIds GROUP BY c.status")
    fun countByStatusGroupedForOwners(ownerIds: List<String>): List<Array<Any>>
}
