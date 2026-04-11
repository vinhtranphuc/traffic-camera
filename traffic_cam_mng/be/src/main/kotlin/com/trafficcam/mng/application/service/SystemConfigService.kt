package com.trafficcam.mng.application.service

import com.trafficcam.mng.adapter.outbound.persistence.repository.JpaSystemConfigRepository
import com.trafficcam.mng.common.exception.NotFoundException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

data class ConfigResponse(val key: String, val value: String, val category: String, val description: String?)

@Service
class SystemConfigService(private val configRepo: JpaSystemConfigRepository) {

    fun getAll(): Map<String, List<ConfigResponse>> =
        configRepo.findAll().map { ConfigResponse(it.configKey, it.configValue, it.category, it.description) }
            .groupBy { it.category }

    fun getByKey(key: String): ConfigResponse {
        val c = configRepo.findByConfigKey(key)
            .orElseThrow { NotFoundException("CONFIG_NOT_FOUND", "Config '$key' not found") }
        return ConfigResponse(c.configKey, c.configValue, c.category, c.description)
    }

    @Transactional
    fun update(key: String, value: String, updatedBy: String): ConfigResponse {
        val c = configRepo.findByConfigKey(key)
            .orElseThrow { NotFoundException("CONFIG_NOT_FOUND", "Config '$key' not found") }
        c.configValue = value
        c.updatedBy = updatedBy
        c.updatedAt = Instant.now()
        configRepo.save(c)
        return ConfigResponse(c.configKey, c.configValue, c.category, c.description)
    }

    fun getEnabledSources(): List<String> =
        configRepo.findByCategory("VIDEO_SOURCE")
            .filter { it.configValue == "true" }
            .map { it.configKey.removePrefix("source_type.").removeSuffix(".enabled").uppercase() }

    fun getOauthProviders(): Map<String, Boolean> =
        configRepo.findByCategory("OAUTH")
            .filter { it.configKey.endsWith(".enabled") }
            .associate { it.configKey.removePrefix("oauth.").removeSuffix(".enabled") to (it.configValue == "true") }

    fun getFirebaseConfig(): Map<String, String> =
        configRepo.findByCategory("FIREBASE")
            .associate { it.configKey.removePrefix("firebase.") to it.configValue }
}
