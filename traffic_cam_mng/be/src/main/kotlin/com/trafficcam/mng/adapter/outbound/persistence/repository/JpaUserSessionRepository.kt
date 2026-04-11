package com.trafficcam.mng.adapter.outbound.persistence.repository

import com.trafficcam.mng.adapter.outbound.persistence.entity.UserSessionEntity
import org.springframework.data.jpa.repository.JpaRepository
import java.util.*

interface JpaUserSessionRepository : JpaRepository<UserSessionEntity, String> {
    fun findByRefreshToken(refreshToken: String): Optional<UserSessionEntity>
    fun findByUserIdAndIsActiveTrue(userId: String): List<UserSessionEntity>
    fun findByUserId(userId: String): List<UserSessionEntity>
    fun deleteByUserIdAndIsActiveTrue(userId: String)
}
