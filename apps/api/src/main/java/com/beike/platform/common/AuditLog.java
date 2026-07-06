package com.beike.platform.common;

import java.lang.annotation.*;

/** 操作审计日志注解 - 标记需要自动记录日志的接口 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface AuditLog {
    String module() default "";   // 操作模块
    String action() default "";   // 操作类型
    String detail() default "";   // 描述模板，支持 #{param} 占位符
}
