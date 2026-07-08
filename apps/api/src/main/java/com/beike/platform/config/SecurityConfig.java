package com.beike.platform.config;

import com.beike.platform.common.JwtUtil;
import com.beike.platform.mapper.LoginDeviceMapper;
import com.beike.platform.mapper.SysUserMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.stereotype.Component;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;

    /** CORS 允许的来源，通过配置注入。开发环境默认 *，生产环境必须指定具体域名。 */
    @Value("${beike.cors.allowed-origins:*}")
    private String allowedOrigins;

    // ================================================================
    private static final String[] WHITELIST = {
            "/api/auth/login", "/api/auth/register",
            "/api/auth/refresh", "/api/auth/send-code",
            "/api/auth/reset-password", "/api/auth/login-by-email",
            "/api/dept/list",
            "/api/health", "/api/pipeline/stages",
            "/error", "/actuator/**"
    };

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsSource()))
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(WHITELIST).permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public UrlBasedCorsConfigurationSource corsSource() {
        CorsConfiguration config = new CorsConfiguration();
        // 生产环境必须通过 beike.cors.allowed-origins 配置具体域名，不再允许 * + allowCredentials
        for (String origin : allowedOrigins.split(",")) {
            config.addAllowedOriginPattern(origin.trim());
        }
        config.addAllowedMethod("*");
        config.addAllowedHeader("*");
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

    /** JWT 鉴权拦截器 + 设备黑名单检查 */
    @Component
    @RequiredArgsConstructor
    public static class JwtAuthenticationFilter extends OncePerRequestFilter {

        private final JwtUtil jwtUtil;
        private final SysUserMapper userMapper;
        private final LoginDeviceMapper deviceMapper;

        @Override
        protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                        FilterChain chain) throws ServletException, IOException {
            String header = request.getHeader("Authorization");
            if (header != null && header.startsWith("Bearer ")) {
                String token = header.substring(7);
                if (jwtUtil.validateToken(token)) {
                    // 检查设备是否已被踢下线
                    String jti = jwtUtil.getJti(token);
                    Long activeDevice = deviceMapper.findActiveByJti(jti);
                    if (activeDevice == null) {
                        response.setStatus(401);
                        response.setContentType("application/json;charset=UTF-8");
                        response.getWriter().write("{\"code\":401,\"message\":\"设备已被踢下线，请重新登录\"}");
                        return;
                    }

                    // 更新心跳
                    deviceMapper.heartbeat(jti);

                    Long userId = jwtUtil.getUserId(token);
                    List<SimpleGrantedAuthority> authorities = userMapper.selectPermissionsByUserId(userId)
                            .stream()
                            .map(SimpleGrantedAuthority::new)
                            .collect(Collectors.toList());
                    userMapper.selectRolesByUserId(userId)
                            .stream()
                            .map(SimpleGrantedAuthority::new)
                            .forEach(authorities::add);
                    UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(userId, token, authorities);
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            }
            chain.doFilter(request, response);
        }
    }
}
