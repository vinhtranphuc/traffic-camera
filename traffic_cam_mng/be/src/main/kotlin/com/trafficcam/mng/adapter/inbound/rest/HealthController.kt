package com.trafficcam.mng.adapter.inbound.rest

import com.trafficcam.mng.common.response.ApiResponse
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1")
class HealthController {

    @GetMapping("/health")
    fun health(): ApiResponse<Map<String, String>> =
        ApiResponse.ok(
            data = mapOf("status" to "UP", "service" to "Traffic Camera Management API"),
            code = "HEALTH_OK",
            message = "Service is running",
        )
}
