package com.trafficcam.mng.application.service

import com.trafficcam.mng.adapter.outbound.persistence.entity.RoleEnum
import com.trafficcam.mng.adapter.outbound.persistence.entity.UserEntity
import com.trafficcam.mng.adapter.outbound.persistence.entity.UserSessionEntity
import com.trafficcam.mng.adapter.outbound.persistence.repository.JpaUserRepository
import com.trafficcam.mng.adapter.outbound.persistence.repository.JpaUserSessionRepository
import com.trafficcam.mng.application.dto.auth.*
import com.trafficcam.mng.common.exception.*
import com.trafficcam.mng.common.security.JwtTokenProvider
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.*

@Service
class AuthService(
    private val userRepo: JpaUserRepository,
    private val sessionRepo: JpaUserSessionRepository,
    private val passwordEncoder: PasswordEncoder,
    private val jwtTokenProvider: JwtTokenProvider,
) {

    @Transactional
    fun login(request: LoginRequest, deviceInfo: String?, ipAddress: String?): LoginResponse {
        val user = userRepo.findByUsername(request.username)
            .orElseThrow { UnauthorizedException("AUTH_INVALID", "Invalid username or password") }

        if (!passwordEncoder.matches(request.password, user.passwordHash)) {
            throw UnauthorizedException("AUTH_INVALID", "Invalid username or password")
        }

        if (user.isLocked) {
            throw ForbiddenException("AUTH_LOCKED", "Account is locked: ${user.lockedReason ?: "Contact administrator"}")
        }

        val accessToken = jwtTokenProvider.generateAccessToken(user.id, user.username, user.role.name)
        val refreshToken = jwtTokenProvider.generateRefreshToken()

        val session = UserSessionEntity(
            id = UUID.randomUUID().toString(),
            userId = user.id,
            refreshToken = passwordEncoder.encode(refreshToken),
            deviceInfo = deviceInfo,
            ipAddress = ipAddress,
            createdAt = Instant.now(),
            lastActiveAt = Instant.now(),
            expiresAt = Instant.now().plusMillis(jwtTokenProvider.getRefreshExpirationMs()),
        )
        sessionRepo.save(session)

        return LoginResponse(
            accessToken = accessToken,
            refreshToken = refreshToken,
            user = user.toUserInfo(),
        )
    }

    @Transactional
    fun register(request: RegisterRequest): LoginResponse {
        if (userRepo.existsByUsername(request.username)) {
            throw ConflictException("AUTH_USERNAME_EXISTS", "Username '${request.username}' already taken")
        }
        if (request.email != null && userRepo.existsByEmail(request.email)) {
            throw ConflictException("AUTH_EMAIL_EXISTS", "Email '${request.email}' already registered")
        }

        val user = UserEntity(
            id = UUID.randomUUID().toString(),
            username = request.username,
            passwordHash = passwordEncoder.encode(request.password),
            role = RoleEnum.CUSTOMER,
            fullName = request.fullName,
            email = request.email,
            phone = request.phone,
        )
        userRepo.save(user)

        val accessToken = jwtTokenProvider.generateAccessToken(user.id, user.username, user.role.name)
        val refreshToken = jwtTokenProvider.generateRefreshToken()

        val session = UserSessionEntity(
            id = UUID.randomUUID().toString(),
            userId = user.id,
            refreshToken = passwordEncoder.encode(refreshToken),
            createdAt = Instant.now(),
            lastActiveAt = Instant.now(),
            expiresAt = Instant.now().plusMillis(jwtTokenProvider.getRefreshExpirationMs()),
        )
        sessionRepo.save(session)

        return LoginResponse(
            accessToken = accessToken,
            refreshToken = refreshToken,
            user = user.toUserInfo(),
        )
    }

    @Transactional
    fun refresh(request: RefreshTokenRequest): LoginResponse {
        val sessions = sessionRepo.findAll()
        val session = sessions.find { s ->
            s.isActive && passwordEncoder.matches(request.refreshToken, s.refreshToken)
        } ?: throw UnauthorizedException("AUTH_REFRESH_INVALID", "Invalid or expired refresh token")

        if (session.expiresAt.isBefore(Instant.now())) {
            session.isActive = false
            sessionRepo.save(session)
            throw UnauthorizedException("AUTH_REFRESH_EXPIRED", "Refresh token expired")
        }

        val user = userRepo.findById(session.userId)
            .orElseThrow { UnauthorizedException("AUTH_USER_NOT_FOUND", "User not found") }

        if (user.isLocked) {
            throw ForbiddenException("AUTH_LOCKED", "Account is locked")
        }

        // Rotate refresh token
        val newRefreshToken = jwtTokenProvider.generateRefreshToken()
        session.refreshToken = passwordEncoder.encode(newRefreshToken)
        session.lastActiveAt = Instant.now()
        session.expiresAt = Instant.now().plusMillis(jwtTokenProvider.getRefreshExpirationMs())
        sessionRepo.save(session)

        val accessToken = jwtTokenProvider.generateAccessToken(user.id, user.username, user.role.name)

        return LoginResponse(
            accessToken = accessToken,
            refreshToken = newRefreshToken,
            user = user.toUserInfo(),
        )
    }

    @Transactional
    fun logout(userId: String, refreshToken: String?) {
        if (refreshToken != null) {
            val sessions = sessionRepo.findByUserIdAndIsActiveTrue(userId)
            sessions.find { passwordEncoder.matches(refreshToken, it.refreshToken) }?.let {
                it.isActive = false
                sessionRepo.save(it)
            }
        }
    }

    @Transactional
    fun logoutAll(userId: String) {
        val sessions = sessionRepo.findByUserIdAndIsActiveTrue(userId)
        sessions.forEach { it.isActive = false }
        sessionRepo.saveAll(sessions)
    }

    private fun UserEntity.toUserInfo() = UserInfo(
        id = id,
        username = username,
        fullName = fullName,
        role = role.name,
        email = email,
        phone = phone,
        avatarUrl = avatarUrl,
    )
}
