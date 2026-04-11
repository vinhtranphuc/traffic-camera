package com.trafficcam.mng.common.exception

abstract class BaseException(
    val code: String,
    override val message: String,
) : RuntimeException(message)

class NotFoundException(code: String, message: String) : BaseException(code, message)
class UnauthorizedException(code: String, message: String) : BaseException(code, message)
class ForbiddenException(code: String, message: String) : BaseException(code, message)
class ValidationException(code: String, message: String) : BaseException(code, message)
class ConflictException(code: String, message: String) : BaseException(code, message)
