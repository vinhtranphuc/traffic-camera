package com.trafficcam.mng.application.dto.auth

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class LoginRequest(
    @field:NotBlank val username: String,
    @field:NotBlank val password: String,
)

data class RegisterRequest(
    @field:NotBlank @field:Size(min = 3, max = 50) val username: String,
    @field:NotBlank @field:Size(min = 6) val password: String,
    @field:NotBlank val fullName: String,
    val email: String? = null,
    val phone: String? = null,
)

data class RefreshTokenRequest(
    @field:NotBlank val refreshToken: String,
)

data class LoginResponse(
    val accessToken: String,
    val refreshToken: String,
    val tokenType: String = "Bearer",
    val user: UserInfo,
)

data class UserInfo(
    val id: String,
    val username: String,
    val fullName: String,
    val role: String,
    val email: String?,
    val phone: String?,
    val avatarUrl: String?,
)
