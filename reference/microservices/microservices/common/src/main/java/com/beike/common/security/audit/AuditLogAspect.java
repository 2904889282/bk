package com.beike.common.security.audit;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.*;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.*;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class AuditLogAspect {
    private final ObjectMapper objectMapper;

    @Around("@annotation(com.beike.common.security.audit.AuditLog)")
    public Object around(ProceedingJoinPoint pjp) throws Throwable {
        var sig = (MethodSignature) pjp.getSignature();
        var audit = sig.getMethod().getAnnotation(AuditLog.class);
        var request = ((ServletRequestAttributes) RequestContextHolder.getRequestAttributes()).getRequest();
        String userId = (String) request.getAttribute("userId");
        String username = (String) request.getAttribute("username");

        Map<String, Object> record = new LinkedHashMap<>();
        record.put("userId", userId);
        record.put("username", username);
        record.put("operation", audit.operation());
        record.put("targetType", audit.targetType());
        record.put("ipAddress", getClientIp(request));
        record.put("userAgent", request.getHeader("User-Agent"));
        record.put("createdAt", LocalDateTime.now().toString());

        // 提取方法参数
        String[] paramNames = sig.getParameterNames();
        Object[] args = pjp.getArgs();
        Map<String, Object> params = new LinkedHashMap<>();
        for (int i = 0; i < paramNames.length; i++) {
            if (args[i] != null && !(args[i] instanceof HttpServletRequest)) {
                params.put(paramNames[i], args[i].toString().substring(0, Math.min(args[i].toString().length(), 500)));
            }
        }
        record.put("params", params);

        try {
            Object result = pjp.proceed();
            record.put("status", 1);
            log.info("AUDIT|{}|{}|{}|{}|{}", username, audit.operation(), audit.targetType(), getClientIp(request), "SUCCESS");
            return result;
        } catch (Throwable e) {
            record.put("status", 0);
            record.put("errorMsg", e.getMessage());
            log.error("AUDIT|{}|{}|{}|{}|FAIL|{}", username, audit.operation(), audit.targetType(), getClientIp(request), e.getMessage());
            throw e;
        } finally {
            // 异步落库 (这里打印 JSON, 实际写入 sys_audit_log)
            log.info("AUDIT_RECORD: {}", objectMapper.writeValueAsString(record));
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty()) ip = request.getHeader("X-Real-IP");
        if (ip == null || ip.isEmpty()) ip = request.getRemoteAddr();
        return ip != null ? ip.split(",")[0].trim() : "unknown";
    }
}
