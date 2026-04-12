package com.trafficcam.mng.application.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.trafficcam.mng.adapter.outbound.persistence.entity.NotificationEntity
import com.trafficcam.mng.adapter.outbound.persistence.repository.JpaNotificationRepository
import com.trafficcam.mng.adapter.outbound.persistence.repository.JpaUserRepository
import com.trafficcam.mng.common.exception.ForbiddenException
import com.trafficcam.mng.common.exception.NotFoundException
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.*

data class NotificationResponse(
    val id: String,
    val type: String,
    val title: String,
    val message: String,
    val data: Map<String, Any>?,
    val isRead: Boolean,
    val createdAt: String,
)

@Service
class NotificationService(
    private val notifRepo: JpaNotificationRepository,
    private val userRepo: JpaUserRepository,
    private val messagingTemplate: SimpMessagingTemplate,
    private val objectMapper: ObjectMapper,
) {

    fun listNotifications(userId: String, pageable: Pageable): Page<NotificationResponse> =
        notifRepo.findByUserIdOrderByCreatedAtDesc(userId, pageable).map { it.toResponse() }

    fun getUnreadCount(userId: String): Long =
        notifRepo.countByUserIdAndIsReadFalse(userId)

    @Transactional
    fun markAsRead(notifId: String, userId: String) {
        val notif = notifRepo.findById(notifId)
            .orElseThrow { NotFoundException("NOTIFICATION_NOT_FOUND", "Notification not found") }
        if (notif.userId != userId) throw ForbiddenException("NOTIFICATION_FORBIDDEN", "Access denied")
        notif.isRead = true
        notifRepo.save(notif)
    }

    @Transactional
    fun markAllAsRead(userId: String) {
        notifRepo.markAllAsRead(userId)
    }

    @Transactional
    fun deleteNotification(notifId: String, userId: String) {
        val notif = notifRepo.findById(notifId)
            .orElseThrow { NotFoundException("NOTIFICATION_NOT_FOUND", "Notification not found") }
        if (notif.userId != userId) throw ForbiddenException("NOTIFICATION_FORBIDDEN", "Access denied")
        notifRepo.delete(notif)
    }

    /**
     * Create and broadcast a notification.
     *
     * Notification is always persisted to DB (user can see it in list),
     * but push delivery (WebSocket toast / FCM) respects user preferences.
     */
    @Transactional
    fun send(
        userId: String,
        type: String,
        title: String,
        message: String,
        data: Map<String, Any>? = null,
    ) {
        val notif = NotificationEntity(
            id = UUID.randomUUID().toString(),
            userId = userId,
            type = type,
            title = title,
            message = message,
            data = data?.let { objectMapper.writeValueAsString(it) },
            createdAt = Instant.now(),
        )
        notifRepo.save(notif)

        // Check user preference for push delivery
        if (shouldPush(userId, type)) {
            messagingTemplate.convertAndSend("/topic/notifications/$userId", notif.toResponse())
        }
    }

    private fun shouldPush(userId: String, type: String): Boolean {
        val user = userRepo.findById(userId).orElse(null) ?: return true
        val prefsJson = user.notificationPrefs ?: return true
        return try {
            @Suppress("UNCHECKED_CAST")
            val prefs = objectMapper.readValue(prefsJson, Map::class.java) as Map<String, Boolean>
            prefs.getOrDefault(type, true) // default: push enabled
        } catch (_: Exception) {
            true
        }
    }

    private fun NotificationEntity.toResponse() = NotificationResponse(
        id = id, type = type, title = title, message = message,
        data = data?.let { @Suppress("UNCHECKED_CAST") (objectMapper.readValue(it, Map::class.java) as Map<String, Any>) },
        isRead = isRead, createdAt = createdAt.toString(),
    )
}
