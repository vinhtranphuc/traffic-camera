package com.trafficcam.mng.application.service

import com.trafficcam.mng.adapter.outbound.persistence.entity.RoleEnum
import com.trafficcam.mng.adapter.outbound.persistence.entity.UserEntity
import com.trafficcam.mng.adapter.outbound.persistence.repository.JpaUserRepository
import com.trafficcam.mng.adapter.outbound.persistence.repository.JpaUserSessionRepository
import com.trafficcam.mng.application.dto.user.*
import com.trafficcam.mng.common.exception.*
import com.trafficcam.mng.common.security.UserPrincipal
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.*

@Service
class UserService(
    private val userRepo: JpaUserRepository,
    private val sessionRepo: JpaUserSessionRepository,
    private val passwordEncoder: PasswordEncoder,
) {

    fun getProfile(userId: String): UserResponse {
        val user = findUserOrThrow(userId)
        return user.toResponse()
    }

    @Transactional
    fun updateProfile(userId: String, request: UpdateUserRequest): UserResponse {
        val user = findUserOrThrow(userId)
        request.fullName?.let { user.fullName = it }
        request.email?.let { e ->
            if (userRepo.existsByEmail(e) && user.email != e) {
                throw ConflictException("USER_EMAIL_EXISTS", "Email already in use")
            }
            user.email = e
        }
        request.phone?.let { user.phone = it }
        request.avatarUrl?.let { user.avatarUrl = it }
        user.updatedAt = Instant.now()
        return userRepo.save(user).toResponse()
    }

    @Transactional
    fun changePassword(userId: String, request: ChangePasswordRequest) {
        val user = findUserOrThrow(userId)
        if (!passwordEncoder.matches(request.currentPassword, user.passwordHash)) {
            throw ValidationException("USER_WRONG_PASSWORD", "Current password is incorrect")
        }
        validatePasswordStrength(request.newPassword)
        user.passwordHash = passwordEncoder.encode(request.newPassword)
        user.updatedAt = Instant.now()
        userRepo.save(user)
        // Invalidate all other sessions for security
        sessionRepo.findByUserIdAndIsActiveTrue(userId).forEach { it.isActive = false }
    }

    private fun validatePasswordStrength(password: String) {
        if (password.length < 8) {
            throw ValidationException("PASSWORD_TOO_SHORT", "Mật khẩu tối thiểu 8 ký tự")
        }
        if (!password.any { it.isDigit() }) {
            throw ValidationException("PASSWORD_NO_DIGIT", "Mật khẩu phải có ít nhất 1 chữ số")
        }
        if (!password.any { it.isLetter() }) {
            throw ValidationException("PASSWORD_NO_LETTER", "Mật khẩu phải có ít nhất 1 chữ cái")
        }
    }

    fun getSessions(userId: String): List<SessionResponse> {
        return sessionRepo.findByUserId(userId).map { s ->
            SessionResponse(
                id = s.id,
                deviceInfo = s.deviceInfo,
                ipAddress = s.ipAddress,
                createdAt = s.createdAt.toString(),
                lastActiveAt = s.lastActiveAt.toString(),
                isActive = s.isActive,
            )
        }
    }

    @Transactional
    fun revokeSession(userId: String, sessionId: String) {
        val session = sessionRepo.findById(sessionId)
            .orElseThrow { NotFoundException("SESSION_NOT_FOUND", "Session not found") }
        if (session.userId != userId) {
            throw ForbiddenException("SESSION_FORBIDDEN", "Cannot revoke other user's session")
        }
        session.isActive = false
        sessionRepo.save(session)
    }

    // --- Admin operations ---

    fun listUsers(principal: UserPrincipal, pageable: Pageable): Page<UserResponse> {
        val roles = getAllowedViewRoles(principal)
        return userRepo.findByRoleIn(roles, pageable).map { it.toResponse() }
    }

    fun getUserById(id: String, principal: UserPrincipal): UserResponse {
        val user = findUserOrThrow(id)
        validateViewAccess(principal, user)
        return user.toResponse()
    }

    @Transactional
    fun createUser(request: CreateUserRequest, principal: UserPrincipal): UserResponse {
        val targetRole = try {
            RoleEnum.valueOf(request.role)
        } catch (e: IllegalArgumentException) {
            throw ValidationException("USER_INVALID_ROLE", "Invalid role: ${request.role}")
        }
        validateCreateAccess(principal, targetRole)

        if (userRepo.existsByUsername(request.username)) {
            throw ConflictException("USER_USERNAME_EXISTS", "Username '${request.username}' already taken")
        }

        val user = UserEntity(
            id = UUID.randomUUID().toString(),
            username = request.username,
            passwordHash = passwordEncoder.encode(request.password),
            role = targetRole,
            fullName = request.fullName,
            email = request.email,
            phone = request.phone,
        )
        return userRepo.save(user).toResponse()
    }

    @Transactional
    fun lockUser(id: String, request: LockUserRequest, principal: UserPrincipal): UserResponse {
        val user = findUserOrThrow(id)
        validateManageAccess(principal, user)
        user.isLocked = true
        user.lockedReason = request.reason
        user.lockedAt = Instant.now()
        user.lockedBy = principal.userId
        user.updatedAt = Instant.now()
        // Invalidate all active sessions of locked user
        sessionRepo.findByUserIdAndIsActiveTrue(id).forEach { it.isActive = false }
        return userRepo.save(user).toResponse()
    }

    @Transactional
    fun unlockUser(id: String, principal: UserPrincipal): UserResponse {
        val user = findUserOrThrow(id)
        validateManageAccess(principal, user)
        user.isLocked = false
        user.lockedReason = null
        user.lockedAt = null
        user.lockedBy = null
        user.updatedAt = Instant.now()
        return userRepo.save(user).toResponse()
    }

    // --- Access control helpers ---

    private fun getAllowedViewRoles(principal: UserPrincipal): List<RoleEnum> = when {
        principal.isSystemAdmin() -> listOf(RoleEnum.SUPER_ADMIN)
        principal.isSuperAdmin() -> listOf(RoleEnum.ADMIN, RoleEnum.CUSTOMER)
        principal.isAdmin() -> listOf(RoleEnum.CUSTOMER)
        else -> emptyList()
    }

    private fun validateViewAccess(principal: UserPrincipal, target: UserEntity) {
        if (principal.userId == target.id) return
        if (!principal.isAdminOrAbove()) throw ForbiddenException("USER_FORBIDDEN", "Access denied")
        val allowed = getAllowedViewRoles(principal)
        if (target.role !in allowed) throw ForbiddenException("USER_FORBIDDEN", "Cannot view this user")
    }

    private fun validateCreateAccess(principal: UserPrincipal, targetRole: RoleEnum) {
        val allowed = when {
            principal.isSystemAdmin() -> listOf(RoleEnum.SUPER_ADMIN)
            principal.isSuperAdmin() -> listOf(RoleEnum.ADMIN)
            principal.isAdmin() -> listOf(RoleEnum.CUSTOMER)
            else -> emptyList()
        }
        if (targetRole !in allowed) {
            throw ForbiddenException("USER_CREATE_FORBIDDEN", "Cannot create user with role $targetRole")
        }
    }

    private fun validateManageAccess(principal: UserPrincipal, target: UserEntity) {
        when {
            principal.isSystemAdmin() && target.role == RoleEnum.SUPER_ADMIN -> return
            principal.isSuperAdmin() && target.role in listOf(RoleEnum.ADMIN, RoleEnum.CUSTOMER) -> return
            principal.isAdmin() && target.role == RoleEnum.CUSTOMER -> return
            else -> throw ForbiddenException("USER_MANAGE_FORBIDDEN", "Cannot manage this user")
        }
    }

    private fun findUserOrThrow(id: String): UserEntity =
        userRepo.findById(id).orElseThrow { NotFoundException("USER_NOT_FOUND", "User not found") }

    private fun UserEntity.toResponse() = UserResponse(
        id = id, username = username, fullName = fullName, role = role.name,
        email = email, phone = phone, avatarUrl = avatarUrl,
        isLocked = isLocked, lockedReason = lockedReason, createdAt = createdAt.toString(),
    )
}
