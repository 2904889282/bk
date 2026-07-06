package com.beike.common.security.crypto;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * AES-256-GCM 加密 — 认证加密模式，防篡改
 * 密钥通过环境变量或 KMS 注入: BEIKE_AES_KEY
 */
@Component
public class AesEncryptor {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_TAG_LENGTH = 128;
    private static final int IV_LENGTH = 12;

    private final SecretKeySpec keySpec;

    public AesEncryptor(@Value("${beike.security.aes-key:}") String key) {
        byte[] keyBytes;
        if (key.isEmpty()) {
            keyBytes = new byte[32];
            new SecureRandom().nextBytes(keyBytes);   // 开发环境随机密钥
        } else {
            keyBytes = Base64.getDecoder().decode(key);
        }
        this.keySpec = new SecretKeySpec(keyBytes, "AES");
    }

    /** 加密 → Base64(IV + Ciphertext + Tag) */
    public String encrypt(String plainText) {
        try {
            byte[] iv = new byte[IV_LENGTH];
            new SecureRandom().nextBytes(iv);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, keySpec, spec);
            byte[] cipherText = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

            byte[] combined = new byte[IV_LENGTH + cipherText.length];
            System.arraycopy(iv, 0, combined, 0, IV_LENGTH);
            System.arraycopy(cipherText, 0, combined, IV_LENGTH, cipherText.length);
            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new CryptoException("加密失败", e);
        }
    }

    /** 解密 */
    public String decrypt(String cipherText) {
        try {
            byte[] combined = Base64.getDecoder().decode(cipherText);
            byte[] iv = new byte[IV_LENGTH];
            byte[] encrypted = new byte[combined.length - IV_LENGTH];
            System.arraycopy(combined, 0, iv, 0, IV_LENGTH);
            System.arraycopy(combined, IV_LENGTH, encrypted, 0, encrypted.length);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, keySpec, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
            return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new CryptoException("解密失败", e);
        }
    }

    public static class CryptoException extends RuntimeException {
        public CryptoException(String msg, Throwable cause) { super(msg, cause); }
    }
}
