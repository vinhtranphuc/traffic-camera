package com.trafficcam.mng.common.config

import com.trafficcam.mng.common.security.JwtAuthenticationFilter
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpMethod
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
class SecurityConfig(
    private val jwtAuthenticationFilter: JwtAuthenticationFilter,
) {

    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .csrf { it.disable() }
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
            .authorizeHttpRequests { auth ->
                auth
                    // Public
                    .requestMatchers("/api/v1/health").permitAll()
                    .requestMatchers("/api/v1/auth/login", "/api/v1/auth/register").permitAll()
                    .requestMatchers("/api/v1/auth/refresh").permitAll()
                    .requestMatchers("/api/v1/auth/forgot-password", "/api/v1/auth/reset-password").permitAll()
                    .requestMatchers("/api/v1/auth/oauth/**").permitAll()
                    .requestMatchers("/api/v1/system-config/public/**").permitAll()
                    .requestMatchers("/actuator/**").permitAll()
                    .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                    .requestMatchers("/ws/**").permitAll()
                    // Internal API
                    .requestMatchers("/api/internal/**").permitAll() // Secured by API key in controller
                    // Role-based
                    .requestMatchers("/api/v1/system-config/**").hasRole("SYSTEM_ADMIN")
                    .requestMatchers("/api/v1/admin-assignments/**").hasAnyRole("SUPER_ADMIN", "SYSTEM_ADMIN")
                    .requestMatchers(HttpMethod.PUT, "/api/v1/camera-approvals/*/approve", "/api/v1/camera-approvals/*/reject")
                        .hasAnyRole("ADMIN", "SUPER_ADMIN", "SYSTEM_ADMIN")
                    // All other endpoints require authentication
                    .anyRequest().authenticated()
            }
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter::class.java)

        return http.build()
    }

    @Bean
    fun passwordEncoder(): PasswordEncoder = BCryptPasswordEncoder()
}
