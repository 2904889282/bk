package com.beike.common.security.audit;
import java.lang.annotation.*;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface AuditLog {
    String operation();              // CREATE / UPDATE / DELETE / EXPORT
    String targetType();             // Pipeline / Project / User
    String detail() default "";
}
