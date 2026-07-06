package com.beike.platform.aspect;

import com.beike.platform.common.AuditLog;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class AuditLogAspect {

    private final JdbcTemplate jdbcTemplate;
    private final HttpServletRequest request;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Around("@annotation(auditLog)")
    public Object around(ProceedingJoinPoint pjp, AuditLog auditLog) throws Throwable {
        Object result = pjp.proceed(); // 先执行业务逻辑
        try {
            Long userId = getCurrentUserId();
            String username = getCurrentUserName(userId);
            String args = objectMapper.writeValueAsString(pjp.getArgs());
            if (args.length() > 500) args = args.substring(0, 500);
            String detail = auditLog.detail().isEmpty() ? args : auditLog.detail();

            jdbcTemplate.update(
                "INSERT INTO sys_operation_log (user_id, user_name, module, action, target_id, detail, ip, create_time) VALUES (?,?,?,?,?,?,?,?)",
                userId, username, auditLog.module(), auditLog.action(), null, detail,
                getClientIp(), LocalDateTime.now()
            );
        } catch (Exception e) {
            log.warn("操作日志记录失败", e);
        }
        return result;
    }

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Long) return (Long) auth.getPrincipal();
        return 0L;
    }

    private String getCurrentUserName(Long userId) {
        try {
            return jdbcTemplate.queryForObject("SELECT real_name FROM sys_user WHERE id = ?", String.class, userId);
        } catch (Exception e) { return "匿名用户"; }
    }

    private String getClientIp() {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty()) ip = request.getRemoteAddr();
        return ip;
    }
}
