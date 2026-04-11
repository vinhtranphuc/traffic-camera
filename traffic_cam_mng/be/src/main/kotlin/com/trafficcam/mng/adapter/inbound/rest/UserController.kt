package com.trafficcam.mng.adapter.inbound.rest

import com.trafficcam.mng.application.dto.user.*
import com.trafficcam.mng.application.service.UserService
import com.trafficcam.mng.common.response.ApiResponse
import com.trafficcam.mng.common.security.UserPrincipal
import jakarta.validation.Valid
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/users")
class UserController(
    private val userService: UserService,
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
