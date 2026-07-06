package com.beike.common.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.io.InputStream;

/**
 * 腾讯云 COS 实现
 * 配置: beike.storage.provider=cos
 *
 * 需要: cos_api 依赖 (按需引入)
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "beike.storage.provider", havingValue = "cos")
public class CosStorage implements ObjectStorage {

    @Override
    public String upload(String bucket, String objectName, InputStream inputStream, String contentType, long size) {
        log.info("COS 上传: {}/{} ({} bytes)", bucket, objectName, size);
        // 实际使用时接入 cos_api
        throw new UnsupportedOperationException("COS SDK 未引入，请添加 cos_api 依赖后实现");
    }

    @Override public InputStream download(String bucket, String objectName) {
        throw new UnsupportedOperationException("COS 未启用");
    }
    @Override public void delete(String bucket, String objectName) {
        throw new UnsupportedOperationException("COS 未启用");
    }
    @Override public String presignedUrl(String bucket, String objectName, int expirySeconds) {
        throw new UnsupportedOperationException("COS 未启用");
    }
    @Override public boolean exists(String bucket, String objectName) {
        return false;
    }
    @Override public String provider() { return "cos"; }
}
