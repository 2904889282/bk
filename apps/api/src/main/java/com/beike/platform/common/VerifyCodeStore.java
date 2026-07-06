package com.beike.platform.common;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 内存验证码存储（单机，重启失效）
 * 生产环境应替换为 Redis
 */
@Component
public class VerifyCodeStore {

    private final Map<String, CodeEntry> store = new ConcurrentHashMap<>();

    /** 保存验证码，有效期 5 分钟 */
    public void put(String key, String code) {
        store.put(key, new CodeEntry(code, System.currentTimeMillis() + 5 * 60 * 1000));
    }

    /** 验证并消费（一次性） */
    public boolean verify(String key, String code) {
        CodeEntry entry = store.get(key);
        if (entry == null) return false;
        if (System.currentTimeMillis() > entry.expireAt) {
            store.remove(key);
            return false;
        }
        if (entry.code.equals(code)) {
            store.remove(key);
            return true;
        }
        return false;
    }

    /** 清理过期 */
    public void cleanExpired() {
        long now = System.currentTimeMillis();
        store.entrySet().removeIf(e -> now > e.getValue().expireAt);
    }

    private record CodeEntry(String code, long expireAt) {}
}
