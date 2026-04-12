package com.trafficcam.mng.common.exception

import com.trafficcam.mng.common.response.ApiResponse
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice

@RestControllerAdvice
class GlobalExceptionHandler {

    @ExceptionHandler(NotFoundException::class)
    fun handleNotFound(ex: NotFoundException): ResponseEntity<ApiResponse<Nothing>> =
        ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ApiResponse.error(ex.code, ex.message))

    @ExceptionHandler(UnauthorizedException::class)
    fun handleUnauthorized(ex: UnauthorizedException): ResponseEntity<ApiResponse<Nothing>> =
        ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(ApiResponse.error(ex.code, ex.message))

    @ExceptionHandler(ForbiddenException::class)
    fun handleForbidden(ex: ForbiddenException): ResponseEntity<ApiResponse<Nothing>> =
        ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(ApiResponse.error(ex.code, ex.message))

    @ExceptionHandler(ValidationException::class)
    fun handleValidation(ex: ValidationException): ResponseEntity<ApiResponse<Nothing>> =
        ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(ApiResponse.error(ex.code, ex.message))

    @ExceptionHandler(ConflictException::class)
    fun handleConflict(ex: ConflictException): ResponseEntity<ApiResponse<Nothing>> =
        ResponseEntity.status(HttpStatus.CONFLICT)
            .body(ApiResponse.error(ex.code, ex.message))

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleMethodArgumentNotValid(ex: MethodArgumentNotValidException): ResponseEntity<ApiResponse<Nothing>> {
        val errors = ex.bindingResult.fieldErrors.map { "${it.field}: ${it.defaultMessage}" }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(ApiResponse.error("VALIDATION_ERROR", "Validation failed", errors))
    }

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException::class)
    fun handleAccessDenied(ex: org.springframework.security.access.AccessDeniedException): ResponseEntity<ApiResponse<Nothing>> =
        ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(ApiResponse.error("ACCESS_DENIED", "Bạn không có quyền truy cập chức năng này"))

    @ExceptionHandler(org.springframework.security.authorization.AuthorizationDeniedException::class)
    fun handleAuthorizationDenied(ex: org.springframework.security.authorization.AuthorizationDeniedException): ResponseEntity<ApiResponse<Nothing>> =
        ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(ApiResponse.error("ACCESS_DENIED", "Bạn không có quyền truy cập chức năng này"))

    @ExceptionHandler(Exception::class)
    fun handleGeneric(ex: Exception): ResponseEntity<ApiResponse<Nothing>> {
        org.slf4j.LoggerFactory.getLogger(GlobalExceptionHandler::class.java).error("Unhandled exception", ex)
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.error("INTERNAL_ERROR", "An unexpected error occurred"))
    }
}
