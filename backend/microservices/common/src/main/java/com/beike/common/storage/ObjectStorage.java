package com.beike.common.storage;

import java.io.InputStream;

/**
 * 对象存储统一接口 — MinIO / OSS / COS 三套实现，改配置即可切换
 */
public interface ObjectStorage {

    /** 上传文件，返回访问 URL */
    String upload(String bucket, String objectName, InputStream inputStream, String contentType, long size);

    /** 下载文件 */
    InputStream download(String bucket, String objectName);

    /** 删除文件 */
    void delete(String bucket, String objectName);

    /** 生成预签名下载 URL (有效期秒) */
    String presignedUrl(String bucket, String objectName, int expirySeconds);

    /** 文件是否存在 */
    boolean exists(String bucket, String objectName);

    /** 存储类型标识 */
    String provider();
}
