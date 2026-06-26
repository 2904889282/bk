package com.beike.common.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.io.InputStream;

/**
 * 阿里云 OSS 实现
 * 配置: beike.storage.provider=oss
 *
 * 需要: aliyun-sdk-oss 依赖 (按需引入)
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "beike.storage.provider", havingValue = "oss")
public class OssStorage implements ObjectStorage {

    @Override
    public String upload(String bucket, String objectName, InputStream inputStream, String contentType, long size) {
        log.info("OSS 上传: {}/{} ({} bytes)", bucket, objectName, size);
        // 实际使用时接入 aliyun-sdk-oss
        throw new UnsupportedOperationException("OSS SDK 未引入，请添加 aliyun-sdk-oss 依赖后实现");
    }

    @Override public InputStream download(String bucket, String objectName) {
        throw new UnsupportedOperationException("OSS 未启用");
    }
    @Override public void delete(String bucket, String objectName) {
        throw new UnsupportedOperationException("OSS 未启用");
    }
    @Override public String presignedUrl(String bucket, String objectName, int expirySeconds) {
        throw new UnsupportedOperationException("OSS 未启用");
    }
    @Override public boolean exists(String bucket, String objectName) {
        return false;
    }
    @Override public String provider() { return "oss"; }
}
