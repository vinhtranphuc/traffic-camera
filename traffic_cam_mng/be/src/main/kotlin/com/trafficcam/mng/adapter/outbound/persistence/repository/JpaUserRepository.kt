package com.trafficcam.mng.adapter.outbound.persistence.repository

import com.trafficcam.mng.adapter.outbound.persistence.entity.RoleEnum
import com.trafficcam.mng.adapter.outbound.persistence.entity.UserEntity
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import java.util.*

interface JpaUserRepository : JpaRepository<UserEntity, String> {
    fun findByUsername(username: String): Optional<UserEntity>
    fun findByEmail(email: String): Optional<UserEntity>
    fun findByOauthProviderAndOauthId(provider: String, oauthId: String): Optional<UserEntity>
    fun existsByUsername(username: String): Boolean
    fun existsByEmail(email: String): Boolean
    fun findByRole(role: RoleEnum, pageable: Pageable): Page<UserEntity>
    fun findByRoleIn(roles: List<RoleEnum>, pageable: Pageable): Page<UserEntity>
}
