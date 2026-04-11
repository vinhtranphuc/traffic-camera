package com.trafficcam.mng.adapter.outbound.persistence.repository

import com.trafficcam.mng.adapter.outbound.persistence.entity.NotificationEntity
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query

interface JpaNotificationRepository : JpaRepository<NotificationEntity, String> {
    fun findByUserIdOrderByCreatedAtDesc(userId: String, pageable: Pageable): Page<NotificationEntity>
    fun countByUserIdAndIsReadFalse(userId: String): Long

    @Modifying
    @Query("UPDATE NotificationEntity n SET n.isRead = true WHERE n.userId = :userId AND n.isRead = false")
    fun markAllAsRead(userId: String): Int
}
