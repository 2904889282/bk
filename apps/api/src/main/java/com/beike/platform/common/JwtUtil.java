package com.beike.platform.common;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtUtil {
    private final SecretKey key;
    private final long accessExpire;
    private final long refreshExpire;

    public JwtUtil(
            @Value("${beike.jwt.secret:beike-platform-v1-secret-key-2026-long-enough-for-hs256}") String secret,
            @Value("${beike.jwt.access-expire-hours:2}") long accessExpireHours,
            @Value("${beike.jwt.refresh-expire-days:30}") long refreshExpireDays) {
        byte[] secretBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (secretBytes.length < 32) {
            throw new IllegalArgumentException("beike.jwt.secret must be at least 32 bytes for HS256");
        }
        this.key = Keys.hmacShaKeyFor(secretBytes);
        this.accessExpire = accessExpireHours * 60 * 60 * 1000L;
        this.refreshExpire = refreshExpireDays * 24 * 60 * 60 * 1000L;
    }

    /** Access Token（短有效期），含 JTI 用于设备管理 */
    public String generateToken(Long userId, String username) {
        return Jwts.builder()
                .subject(userId.toString())
                .claim("username", username)
                .claim("type", "access")
                .id(UUID.randomUUID().toString())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + accessExpire))
                .signWith(key)
                .compact();
    }

    /** Refresh Token（长有效期），仅用于刷新 Access Token */
    public String generateRefreshToken(Long userId, String username) {
        return Jwts.builder()
                .subject(userId.toString())
                .claim("username", username)
                .claim("type", "refresh")
                .id(UUID.randomUUID().toString())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + refreshExpire))
                .signWith(key)
                .compact();
    }

    public Claims parseToken(String token) {
        return Jwts.parser().verifyWith(key).build()
                .parseSignedClaims(token).getPayload();
    }

    public Long getUserId(String token) {
        return Long.parseLong(parseToken(token).getSubject());
    }

    public String getUsername(String token) {
        return parseToken(token).get("username", String.class);
    }

    /** 获取 JWT ID，用于设备管理（踢下线时标识具体设备） */
    public String getJti(String token) {
        return parseToken(token).getId();
    }

    /** 宽松验证：忽略过期（用于 Refresh Token 即使过期也能拿 userId） */
    public Long getUserIdIgnoreExpiry(String token) {
        try {
            return getUserId(token);
        } catch (ExpiredJwtException e) {
            return Long.parseLong(e.getClaims().getSubject());
        }
    }

    public boolean validateToken(String token) {
        try {
            parseToken(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
