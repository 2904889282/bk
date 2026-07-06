package com.beike.auth.security;

import io.jsonwebtoken.Jwts;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.List;
import java.util.Map;

@Component
public class JwtUtil {

    private final SecretKey key;
    private final long expiration;

    public JwtUtil(
            @Value("${beike.jwt.secret:beike-admin-jwt-secret-key-2024-must-be-at-least-256-bits-long!!}") String secret,
            @Value("${beike.jwt.expiration:604800000}") long expiration) {
        this.key = Jwts.SIG.HS256.key().build();
        this.expiration = expiration;
    }

    public String generate(String userId, String username, List<String> roles) {
        return Jwts.builder()
                .subject(userId)
                .claims(Map.of("username", username, "roles", roles))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(key)
                .compact();
    }

    public String getUserId(String token) {
        return Jwts.parser().verifyWith(key).build()
                .parseSignedClaims(token).getPayload().getSubject();
    }

    @SuppressWarnings("unchecked")
    public List<String> getRoles(String token) {
        return (List<String>) Jwts.parser().verifyWith(key).build()
                .parseSignedClaims(token).getPayload().get("roles", List.class);
    }

    public String getUsername(String token) {
        return Jwts.parser().verifyWith(key).build()
                .parseSignedClaims(token).getPayload().get("username", String.class);
    }

    public boolean validate(String token) {
        try {
            Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
