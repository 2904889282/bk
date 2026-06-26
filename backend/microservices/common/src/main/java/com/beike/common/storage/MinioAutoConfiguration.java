package com.beike.common.storage;

import io.minio.MinioClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * MinIO 客户端自动配置
 * 仅当 beike.storage.provider=minio 时激活（默认值）
 */
@Configuration
@ConditionalOnProperty(name = "beike.storage.provider", havingValue = "minio", matchIfMissing = true)
public class MinioAutoConfiguration {

    @Value("${beike.storage.minio.endpoint:http://minio:9000}")
    private String endpoint;

    @Value("${beike.storage.minio.access-key:beike_admin}")
    private String accessKey;

    @Value("${beike.storage.minio.secret-key:beike_minio_2024}")
    private String secretKey;

    @Bean
    public MinioClient minioClient() {
        return MinioClient.builder()
                .endpoint(endpoint)
                .credentials(accessKey, secretKey)
                .build();
    }
}
