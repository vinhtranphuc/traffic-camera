package com.trafficcam.mng.common.response

import java.time.Instant

data class ApiResponse<T>(
    val success: Boolean,
    val code: String,
    val message: String,
    val data: T? = null,
    val errors: List<String>? = null,
    val timestamp: Instant = Instant.now(),
) {
    companion object {
        fun <T> ok(data: T, code: String = "SUCCESS", message: String = "OK"): ApiResponse<T> =
            ApiResponse(success = true, code = code, message = message, data = data)

        fun <T> ok(code: String = "SUCCESS", message: String = "OK"): ApiResponse<T> =
            ApiResponse(success = true, code = code, message = message)

        fun <T> error(code: String, message: String, errors: List<String>? = null): ApiResponse<T> =
            ApiResponse(success = false, code = code, message = message, errors = errors)
    }
}
