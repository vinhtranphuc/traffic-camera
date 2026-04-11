package com.trafficcam.mng.adapter.outbound.persistence.repository

import com.trafficcam.mng.adapter.outbound.persistence.entity.SystemConfigEntity
import org.springframework.data.jpa.repository.JpaRepository
import java.util.*

interface JpaSystemConfigRepository : JpaRepository<SystemConfigEntity, String> {
    fun findByConfigKey(configKey: String): Optional<SystemConfigEntity>
    fun findByCategory(category: String): List<SystemConfigEntity>
    fun findByCategoryIn(categories: List<String>): List<SystemConfigEntity>
}
