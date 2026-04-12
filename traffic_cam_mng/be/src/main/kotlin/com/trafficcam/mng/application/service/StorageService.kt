package com.trafficcam.mng.application.service

import com.trafficcam.mng.common.exception.ValidationException
import io.minio.MinioClient
import io.minio.PutObjectArgs
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import java.util.*

@Service
class StorageService(
    private val minioClient: MinioClient,
    @Value("\${app.minio.bucket}") private val bucket: String,
) {
    private val allowedImageTypes = setOf("image/jpeg", "image/png", "image/webp", "image/gif")
    private val maxFileSize = 5L * 1024 * 1024 // 5MB

    /** Upload an avatar image and return public URL. */
    fun uploadAvatar(userId: String, file: MultipartFile): String {
        if (file.size > maxFileSize) {
            throw ValidationException("FILE_TOO_LARGE", "Kích thước file vượt quá 5MB")
        }
        val contentType = file.contentType ?: ""
        if (contentType !in allowedImageTypes) {
            throw ValidationException("FILE_INVALID_TYPE", "Chỉ cho phép ảnh JPG, PNG, WebP, GIF")
        }

        val ext = when (contentType) {
            "image/jpeg" -> "jpg"
            "image/png" -> "png"
            "image/webp" -> "webp"
            "image/gif" -> "gif"
            else -> "bin"
        }
        val objectName = "public/avatars/${userId}-${UUID.randomUUID()}.$ext"

        file.inputStream.use { input ->
            minioClient.putObject(
                PutObjectArgs.builder()
                    .bucket(bucket)
                    .`object`(objectName)
                    .stream(input, file.size, -1)
                    .contentType(contentType)
                    .build()
            )
        }

        // Return nginx-proxied URL (assumes /minio proxy or direct public access)
        // For simplicity, use MinIO direct URL through docker network
        return "/minio/$bucket/$objectName"
    }
}
