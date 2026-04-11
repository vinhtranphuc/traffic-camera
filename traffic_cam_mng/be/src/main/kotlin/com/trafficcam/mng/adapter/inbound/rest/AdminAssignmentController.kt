package com.trafficcam.mng.adapter.inbound.rest

import com.trafficcam.mng.adapter.outbound.persistence.entity.AdminCustomerAssignmentEntity
import com.trafficcam.mng.adapter.outbound.persistence.repository.JpaAdminAssignmentRepository
import com.trafficcam.mng.adapter.outbound.persistence.repository.JpaUserRepository
import com.trafficcam.mng.common.exception.NotFoundException
import com.trafficcam.mng.common.response.ApiResponse
import com.trafficcam.mng.common.security.UserPrincipal
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import java.time.Instant

@RestController
@RequestMapping("/api/v1/admin-assignments")
class AdminAssignmentController(
    private val assignmentRepo: JpaAdminAssignmentRepository,
    private val userRepo: JpaUserRepository,
) {

    @GetMapping
    fun list(): ApiResponse<List<Map<String, Any?>>> {
        val assignments = assignmentRepo.findAll().map { a ->
            val admin = userRepo.findById(a.adminId).orElse(null)
            val customer = userRepo.findById(a.customerId).orElse(null)
            mapOf(
                "adminId" to a.adminId, "adminName" to admin?.fullName,
                "customerId" to a.customerId, "customerName" to customer?.fullName,
                "assignedAt" to a.assignedAt.toString(),
            )
        }
        return ApiResponse.ok(assignments, "ASSIGNMENT_LIST", "Assignments retrieved")
    }

    @PostMapping
    fun assign(
        @AuthenticationPrincipal p: UserPrincipal,
        @RequestBody body: Map<String, String>,
    ): ApiResponse<Nothing> {
        val adminId = body["adminId"] ?: throw NotFoundException("MISSING_ADMIN_ID", "adminId required")
        val customerId = body["customerId"] ?: throw NotFoundException("MISSING_CUSTOMER_ID", "customerId required")
        val assignment = AdminCustomerAssignmentEntity(
            adminId = adminId, customerId = customerId,
            assignedAt = Instant.now(), assignedBy = p.userId,
        )
        assignmentRepo.save(assignment)
        return ApiResponse.ok(code = "ASSIGNMENT_CREATED", message = "Customer assigned to admin")
    }

    @DeleteMapping("/{adminId}/{customerId}")
    fun remove(@PathVariable adminId: String, @PathVariable customerId: String): ApiResponse<Nothing> {
        assignmentRepo.deleteById(com.trafficcam.mng.adapter.outbound.persistence.entity.AdminCustomerAssignmentId(adminId, customerId))
        return ApiResponse.ok(code = "ASSIGNMENT_REMOVED", message = "Assignment removed")
    }

    @GetMapping("/admins/{adminId}/customers")
    fun adminCustomers(@PathVariable adminId: String): ApiResponse<List<Map<String, Any?>>> {
        val customerIds = assignmentRepo.findCustomerIdsByAdminId(adminId)
        val customers = customerIds.mapNotNull { id ->
            userRepo.findById(id).orElse(null)?.let {
                mapOf("id" to it.id, "username" to it.username, "fullName" to it.fullName)
            }
        }
        return ApiResponse.ok(customers, "ADMIN_CUSTOMERS", "Admin's customers")
    }

    @GetMapping("/unassigned-customers")
    fun unassigned(): ApiResponse<List<Map<String, Any?>>> {
        val ids = assignmentRepo.findUnassignedCustomerIds()
        val customers = ids.mapNotNull { id ->
            userRepo.findById(id).orElse(null)?.let {
                mapOf("id" to it.id, "username" to it.username, "fullName" to it.fullName)
            }
        }
        return ApiResponse.ok(customers, "UNASSIGNED_CUSTOMERS", "Unassigned customers")
    }
}
