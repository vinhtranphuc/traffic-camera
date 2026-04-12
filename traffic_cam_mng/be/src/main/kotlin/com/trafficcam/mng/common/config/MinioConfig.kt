package com.trafficcam.mng.common.config

import io.minio.BucketExistsArgs
import io.minio.MakeBucketArgs
import io.minio.MinioClient
import jakarta.annotation.PostConstruct
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class MinioConfig(
    @Value("\${app.minio.endpoint}") private val endpoint: String,
    @Value("\${app.minio.access-key}") private val accessKey: String,
    @Value("\${app.minio.secret-key}") private val secretKey: String,
    @Value("\${app.minio.bucket}") val bucket: String,
) {

    @Bean
    fun minioClient(): MinioClient = MinioClient.builder()
        .endpoint(endpoint)
        .credentials(accessKey, secretKey)
        .build()

    @Bean
    fun minioBucketInitializer(client: MinioClient): BucketInitializer {
        return BucketInitializer(client, bucket)
    }

    class BucketInitializer(private val client: MinioClient, private val bucket: String) {
        @PostConstruct
        fun init() {
            try {
                val exists = client.bucketExists(BucketExistsArgs.builder().bucket(bucket).build())
                if (!exists) {
                    client.makeBucket(MakeBucketArgs.builder().bucket(bucket).build())
                }
            } catch (_: Exception) {
                // Ignore - bucket init failure shouldn't crash app
            }
        }
    }
}
