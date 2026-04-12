package com.trafficcam.mng.adapter.inbound.rest

import com.trafficcam.mng.application.dto.user.*
import com.trafficcam.mng.application.service.StorageService
import com.trafficcam.mng.application.service.UserService
import com.trafficcam.mng.common.response.ApiResponse
import com.trafficcam.mng.common.security.UserPrincipal
import jakarta.validation.Valid
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("/api/v1/users")
class UserController(
    private val userService: UserService,
    private val storageService: StorageService,
) {

    // --- Self operations ---

    @GetMapping("/me")
    fun getProfile(@AuthenticationPrincipal principal: UserPrincipal): ApiResponse<UserResponse> {
        val result = userService.getProfile(principal.userId)
        return ApiResponse.ok(result, "USER_PROFILE", "Profile retrieved")
    }

    @PutMapping("/me")
    fun updateProfile(
        @AuthenticationPrincipal principal: UserPrincipal,
        @Valid @RequestBody request: UpdateUserRequest,
    ): ApiResponse<UserResponse> {
        val result = userService.updateProfile(principal.userId, request)
        return ApiResponse.ok(result, "USER_UPDATED", "Profile updated")
    }

    @PutMapping("/me/avatar", consumes = ["multipart/form-data"])
    fun uploadAvatar(
        @AuthenticationPrincipal principal: UserPrincipal,
        @RequestParam("file") file: MultipartFile,
    ): ApiResponse<Map<String, String>> {
        val url = storageService.uploadAvatar(principal.userId, file)
        userService.updateProfile(principal.userId, UpdateUserRequest(avatarUrl = url))
        return ApiResponse.ok(mapOf("avatarUrl" to url), "USER_AVATAR_UPDATED", "Avatar uploaded")
    }

    @PutMapping("/me/password")
    fun changePassword(
        @AuthenticationPrincipal principal: UserPrincipal,
        @Valid @RequestBody request: ChangePasswordRequest,
    ): ApiResponse<Nothing> {
        userService.changePassword(principal.userId, request)
        return ApiResponse.ok(code = "USER_PASSWORD_CHANGED", message = "Password changed")
    }

    @GetMapping("/me/sessions")
    fun getSessions(@AuthenticationPrincipal principal: UserPrincipal): ApiResponse<List<SessionResponse>> {
        val result = userService.getSessions(principal.userId)
        return ApiResponse.ok(result, "USER_SESSIONS", "Sessions retrieved")
    }

    @GetMapping("/me/notification-prefs")
    fun getNotificationPrefs(@AuthenticationPrincipal principal: UserPrincipal): ApiResponse<Map<String, Boolean>> =
        ApiResponse.ok(userService.getNotificationPrefs(principal.userId), "USER_NOTIF_PREFS", "Preferences retrieved")

    @PutMapping("/me/notification-prefs")
    fun updateNotificationPrefs(
        @AuthenticationPrincipal principal: UserPrincipal,
        @RequestBody prefs: Map<String, Boolean>,
    ): ApiResponse<Nothing> {
        userService.updateNotificationPrefs(principal.userId, prefs)
        return ApiResponse.ok(code = "USER_NOTIF_PREFS_UPDATED", message = "Updated")
    }

    @DeleteMapping("/me/sessions/{sessionId}")
    fun revokeSession(
        @AuthenticationPrincipal principal: UserPrincipal,
        @PathVariable sessionId: String,
    ): ApiResponse<Nothing> {
        userService.revokeSession(principal.userId, sessionId)
        return ApiResponse.ok(code = "SESSION_REVOKED", message = "Session revoked")
    }

    // --- Admin operations ---

    @GetMapping
    fun listUsers(
        @AuthenticationPrincipal principal: UserPrincipal,
        @PageableDefault(size = 20) pageable: Pageable,
    ): ApiResponse<Any> {
        val page = userService.listUsers(principal, pageable)
        return ApiResponse.ok(
            data = mapOf(
                "items" to page.content,
                "totalItems" to page.totalElements,
                "totalPages" to page.totalPages,
                "currentPage" to page.number,
                "pageSize" to page.size,
                "hasNext" to page.hasNext(),
                "hasPrevious" to page.hasPrevious(),
            ),
            code = "USER_LIST",
            message = "Users retrieved",
        )
    }

    @GetMapping("/{id}")
    fun getUser(
        @AuthenticationPrincipal principal: UserPrincipal,
        @PathVariable id: String,
    ): ApiResponse<UserResponse> {
        val result = userService.getUserById(id, principal)
        return ApiResponse.ok(result, "USER_DETAIL", "User retrieved")
    }

    @PostMapping
    fun createUser(
        @AuthenticationPrincipal principal: UserPrincipal,
        @Valid @RequestBody request: CreateUserRequest,
    ): ApiResponse<UserResponse> {
        val result = userService.createUser(request, principal)
        return ApiResponse.ok(result, "USER_CREATED", "User created")
    }

    @PutMapping("/{id}/lock")
    fun lockUser(
        @AuthenticationPrincipal principal: UserPrincipal,
        @PathVariable id: String,
        @RequestBody request: LockUserRequest,
    ): ApiResponse<UserResponse> {
        val result = userService.lockUser(id, request, principal)
        return ApiResponse.ok(result, "USER_LOCKED", "User locked")
    }

    @PutMapping("/{id}/unlock")
    fun unlockUser(
        @AuthenticationPrincipal principal: UserPrincipal,
        @PathVariable id: String,
    ): ApiResponse<UserResponse> {
        val result = userService.unlockUser(id, principal)
        return ApiResponse.ok(result, "USER_UNLOCKED", "User unlocked")
    }
}
