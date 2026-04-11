package com.trafficcam.mng.adapter.inbound.rest

import com.trafficcam.mng.application.dto.auth.*
import com.trafficcam.mng.application.service.AuthService
import com.trafficcam.mng.common.response.ApiResponse
import com.trafficcam.mng.common.security.UserPrincipal
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/auth")
class AuthController(
    private val authService: AuthService,
) {

    @PostMapping("/login")
    fun login(
        @Valid @RequestBody request: LoginRequest,
        httpRequest: HttpServletRequest,
    ): ApiResponse<LoginResponse> {
        val result = authService.login(
            request,
            deviceInfo = httpRequest.getHeader("User-Agent"),
            ipAddress = httpRequest.remoteAddr,
        )
        return ApiResponse.ok(result, "AUTH_LOGIN_SUCCESS", "Login successful")
    }

    @PostMapping("/register")
    fun register(@Valid @RequestBody request: RegisterRequest): ApiResponse<LoginResponse> {
        val result = authService.register(request)
        return ApiResponse.ok(result, "AUTH_REGISTER_SUCCESS", "Registration successful")
    }

    @PostMapping("/refresh")
    fun refresh(@Valid @RequestBody request: RefreshTokenRequest): ApiResponse<LoginResponse> {
        val result = authService.refresh(request)
        return ApiResponse.ok(result, "AUTH_REFRESH_SUCCESS", "Token refreshed")
    }

    @PostMapping("/logout")
    fun logout(
        @AuthenticationPrincipal principal: UserPrincipal,
        @RequestBody(required = false) body: Map<String, String>?,
    ): ApiResponse<Nothing> {
        authService.logout(principal.userId, body?.get("refreshToken"))
        return ApiResponse.ok(code = "AUTH_LOGOUT_SUCCESS", message = "Logged out")
    }

    @PostMapping("/logout-all")
    fun logoutAll(@AuthenticationPrincipal principal: UserPrincipal): ApiResponse<Nothing> {
        authService.logoutAll(principal.userId)
        return ApiResponse.ok(code = "AUTH_LOGOUT_ALL_SUCCESS", message = "All sessions revoked")
    }
}
