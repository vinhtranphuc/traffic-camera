package com.trafficcam.mng.common.security

import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.userdetails.UserDetails

data class UserPrincipal(
    val userId: String,
    val userName: String,
    val role: String,
) : UserDetails {

    override fun getAuthorities(): Collection<GrantedAuthority> =
        listOf(SimpleGrantedAuthority("ROLE_$role"))

    override fun getPassword(): String = ""
    override fun getUsername(): String = userName
    override fun isAccountNonExpired(): Boolean = true
    override fun isAccountNonLocked(): Boolean = true
    override fun isCredentialsNonExpired(): Boolean = true
    override fun isEnabled(): Boolean = true

    fun isSystemAdmin(): Boolean = role == "SYSTEM_ADMIN"
    fun isSuperAdmin(): Boolean = role == "SUPER_ADMIN"
    fun isAdmin(): Boolean = role == "ADMIN"
    fun isCustomer(): Boolean = role == "CUSTOMER"
    fun isAdminOrAbove(): Boolean = role in listOf("SYSTEM_ADMIN", "SUPER_ADMIN", "ADMIN")
}
