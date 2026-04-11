package com.trafficcam.mng.application.dto.user

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class CreateUserRequest(
    @field:NotBlank @field:Size(min = 3, max = 50) val username: String,
    @field:NotBlank @field:Size(min = 6) val password: String,
    @field:NotBlank val fullName: String,
    @field:NotBlank val role: String, // ADMIN, CUSTOMER, SUPER_ADMIN
    val email: String? = null,
    val phone: String? = null,
)

data class UpdateUserRequest(
    val fullName: String? = null,
    val email: String? = null,
    val phone: String? = null,
    val avatarUrl: String? = null,
)

data class ChangePasswordRequest(
    @field:NotBlank val currentPassword: String,
    @field:NotBlank @field:Size(min = 6) val newPassword: String,
)

data class LockUserRequest(
    val reason: String? = null,
)

data class UserResponse(
    val id: String,
    val username: String,
    val fullName: String,
    val role: String,
    val email: String?,
    val phone: String?,
    val avatarUrl: String?,
    val isLocked: Boolean,
    val lockedReason: String?,
    val createdAt: String,
)

data class SessionResponse(
    val id: String,
    val deviceInfo: String?,
    val ipAddress: String?,
    val createdAt: String,
    val lastActiveAt: String,
    val isActive: Boolean,
)
