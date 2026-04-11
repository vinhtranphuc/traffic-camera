package com.trafficcam.mng.adapter.outbound.persistence.entity

import jakarta.persistence.*
import java.io.Serializable
import java.time.Instant

@Entity
@Table(name = "admin_customer_assignments")
@IdClass(AdminCustomerAssignmentId::class)
class AdminCustomerAssignmentEntity(
    @Id @Column(name = "admin_id", columnDefinition = "CHAR(36)") var adminId: String = "",
    @Id @Column(name = "customer_id", columnDefinition = "CHAR(36)") var customerId: String = "",
    @Column(name = "assigned_at", nullable = false) var assignedAt: Instant = Instant.now(),
    @Column(name = "assigned_by", columnDefinition = "CHAR(36)") var assignedBy: String? = null,
)

data class AdminCustomerAssignmentId(
    var adminId: String = "",
    var customerId: String = "",
) : Serializable
