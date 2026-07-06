package com.beike.platform.common;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtUtil {
    private static final String SECRET = "beike-platform-v1-secret-key-2026-long-enough-for-hs256";
    private static final long ACCESS_EXPIRE = 2 * 60 * 60 * 1000;      // 2小时
    private static final long REFRESH_EXPIRE = 30 * 24 * 60 * 60 * 1000L; // 30天
    private final SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));

    /** Access Token（短有效期），含 JTI 用于设备管理 */
    public String generateToken(Long userId, String username) {
        return Jwts.builder()
                .subject(userId.toString())
                .claim("username", username)
                .claim("type", "access")
                .id(UUID.randomUUID().toString())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + ACCESS_EXPIRE))
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
                .expiration(new Date(System.currentTimeMillis() + REFRESH_EXPIRE))
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
