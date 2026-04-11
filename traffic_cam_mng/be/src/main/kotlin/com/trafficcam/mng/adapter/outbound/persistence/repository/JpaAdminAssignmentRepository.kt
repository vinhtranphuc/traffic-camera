package com.trafficcam.mng.adapter.outbound.persistence.repository

import com.trafficcam.mng.adapter.outbound.persistence.entity.AdminCustomerAssignmentEntity
import com.trafficcam.mng.adapter.outbound.persistence.entity.AdminCustomerAssignmentId
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface JpaAdminAssignmentRepository : JpaRepository<AdminCustomerAssignmentEntity, AdminCustomerAssignmentId> {
    fun findByAdminId(adminId: String): List<AdminCustomerAssignmentEntity>
    fun findByCustomerId(customerId: String): List<AdminCustomerAssignmentEntity>

    @Query("SELECT a.customerId FROM AdminCustomerAssignmentEntity a WHERE a.adminId = :adminId")
    fun findCustomerIdsByAdminId(adminId: String): List<String>

    @Query("SELECT DISTINCT u.id FROM UserEntity u WHERE u.role = 'CUSTOMER' AND u.id NOT IN (SELECT a.customerId FROM AdminCustomerAssignmentEntity a)")
    fun findUnassignedCustomerIds(): List<String>
}
