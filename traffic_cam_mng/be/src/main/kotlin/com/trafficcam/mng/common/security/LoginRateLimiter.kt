package com.trafficcam.mng.common.security

import org.springframework.beans.factory.annotation.Autowired
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.stereotype.Component
import java.time.Duration

/**
 * Simple Redis-backed rate limiter for login endpoint.
 * Limits per (username + IP) combo to prevent brute-force.
 */
@Component
class LoginRateLimiter(
    @Autowired(required = false) private val redisTemplate: StringRedisTemplate?,
) {
    private val maxAttempts = 10
    private val windowMinutes = 5L

    fun allow(username: String, ip: String?): Boolean {
        val template = redisTemplate ?: return true // no-op if Redis unavailable
        val key = "login:rate:${username.lowercase()}:${ip ?: "unknown"}"
        val ops = template.opsForValue()
        val count = ops.increment(key) ?: 0
        if (count == 1L) {
            template.expire(key, Duration.ofMinutes(windowMinutes))
        }
        return count <= maxAttempts
    }

    fun reset(username: String, ip: String?) {
        val template = redisTemplate ?: return
        val key = "login:rate:${username.lowercase()}:${ip ?: "unknown"}"
        template.delete(key)
    }
}
