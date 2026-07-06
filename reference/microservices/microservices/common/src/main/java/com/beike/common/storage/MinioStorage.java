package com.beike.common.storage;

import io.minio.*;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.concurrent.TimeUnit;

/**
 * MinIO 实现 — 自建对象存储 (S3 兼容)
 * 配置: beike.storage.provider=minio
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "beike.storage.provider", havingValue = "minio", matchIfMissing = true)
public class MinioStorage implements ObjectStorage {

    private final MinioClient minioClient;

    @Override
    public String upload(String bucket, String objectName, InputStream inputStream, String contentType, long size) {
        try {
            boolean found = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucket).build());
            if (!found) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
            }
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucket)
                            .object(objectName)
                            .stream(inputStream, size, -1)
                            .contentType(contentType)
                            .build()
            );
            log.info("MinIO 上传成功: {}/{} ({} bytes)", bucket, objectName, size);
            return getBaseUrl() + "/" + bucket + "/" + objectName;
        } catch (Exception e) {
            log.error("MinIO 上传失败: {}/{}", bucket, objectName, e);
            throw new StorageException("上传失败", e);
        }
    }

    @Override
    public InputStream download(String bucket, String objectName) {
        try {
            return minioClient.getObject(
                    GetObjectArgs.builder().bucket(bucket).object(objectName).build()
            );
        } catch (Exception e) {
            log.error("MinIO 下载失败: {}/{}", bucket, objectName, e);
            throw new StorageException("下载失败", e);
        }
    }

    @Override
    public void delete(String bucket, String objectName) {
        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder().bucket(bucket).object(objectName).build()
            );
            log.info("MinIO 删除成功: {}/{}", bucket, objectName);
        } catch (Exception e) {
            log.error("MinIO 删除失败", e);
            throw new StorageException("删除失败", e);
        }
    }

    @Override
    public String presignedUrl(String bucket, String objectName, int expirySeconds) {
        try {
            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(bucket)
                            .object(objectName)
                            .expiry(expirySeconds, TimeUnit.SECONDS)
                            .build()
            );
        } catch (Exception e) {
            log.error("MinIO 预签名失败", e);
            throw new StorageException("预签名失败", e);
        }
    }

    @Override
    public boolean exists(String bucket, String objectName) {
        try {
            minioClient.statObject(StatObjectArgs.builder().bucket(bucket).object(objectName).build());
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public String provider() {
        return "minio";
    }

    private String getBaseUrl() {
        return "http://localhost:9000";
    }
}
