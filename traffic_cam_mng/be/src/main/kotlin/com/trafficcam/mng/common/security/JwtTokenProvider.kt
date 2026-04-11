package com.trafficcam.mng.common.security

import io.jsonwebtoken.*
import io.jsonwebtoken.security.Keys
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.util.*
import javax.crypto.SecretKey

@Component
class JwtTokenProvider(
    @Value("\${app.jwt.secret}") private val jwtSecret: String,
    @Value("\${app.jwt.access-expiration-ms}") private val accessExpirationMs: Long,
    @Value("\${app.jwt.refresh-expiration-ms}") private val refreshExpirationMs: Long,
) {
    private val key: SecretKey by lazy {
        Keys.hmacShaKeyFor(jwtSecret.toByteArray())
    }

    fun generateAccessToken(userId: String, username: String, role: String): String {
        val now = Date()
        return Jwts.builder()
            .subject(userId)
            .claim("username", username)
            .claim("role", role)
            .issuedAt(now)
            .expiration(Date(now.time + accessExpirationMs))
            .signWith(key)
            .compact()
    }

    fun generateRefreshToken(): String = UUID.randomUUID().toString()

    fun getRefreshExpirationMs(): Long = refreshExpirationMs

    fun getUserIdFromToken(token: String): String =
        parseToken(token).payload.subject

    fun getRoleFromToken(token: String): String =
        parseToken(token).payload.get("role", String::class.java)

    fun getUsernameFromToken(token: String): String =
        parseToken(token).payload.get("username", String::class.java)

    fun validateToken(token: String): Boolean {
        return try {
            parseToken(token)
            true
        } catch (e: JwtException) {
            false
        } catch (e: IllegalArgumentException) {
            false
        }
    }

    private fun parseToken(token: String): Jws<Claims> =
        Jwts.parser().verifyWith(key).build().parseSignedClaims(token)
}
