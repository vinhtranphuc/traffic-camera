package com.trafficcam.mng.adapter.inbound.rest

import com.trafficcam.mng.application.service.NotificationResponse
import com.trafficcam.mng.application.service.NotificationService
import com.trafficcam.mng.common.response.ApiResponse
import com.trafficcam.mng.common.security.UserPrincipal
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/notifications")
class NotificationController(private val notifService: NotificationService) {

    @GetMapping
    fun list(
        @AuthenticationPrincipal p: UserPrincipal,
        @PageableDefault(size = 20) pageable: Pageable,
    ): ApiResponse<Any> {
        val page = notifService.listNotifications(p.userId, pageable)
        return ApiResponse.ok(mapOf(
            "items" to page.content, "totalItems" to page.totalElements,
            "totalPages" to page.totalPages, "currentPage" to page.number,
        ), "NOTIFICATION_LIST", "Notifications retrieved")
    }

    @GetMapping("/unread-count")
    fun unreadCount(@AuthenticationPrincipal p: UserPrincipal): ApiResponse<Map<String, Long>> =
        ApiResponse.ok(mapOf("count" to notifService.getUnreadCount(p.userId)), "NOTIFICATION_UNREAD", "Unread count")

    @PutMapping("/{id}/read")
    fun markRead(@AuthenticationPrincipal p: UserPrincipal, @PathVariable id: String): ApiResponse<Nothing> {
        notifService.markAsRead(id, p.userId)
        return ApiResponse.ok(code = "NOTIFICATION_READ", message = "Marked as read")
    }

    @PutMapping("/read-all")
    fun markAllRead(@AuthenticationPrincipal p: UserPrincipal): ApiResponse<Nothing> {
        notifService.markAllAsRead(p.userId)
        return ApiResponse.ok(code = "NOTIFICATION_ALL_READ", message = "All marked as read")
    }

    @DeleteMapping("/{id}")
    fun delete(@AuthenticationPrincipal p: UserPrincipal, @PathVariable id: String): ApiResponse<Nothing> {
        notifService.deleteNotification(id, p.userId)
        return ApiResponse.ok(code = "NOTIFICATION_DELETED", message = "Notification deleted")
    }
}
