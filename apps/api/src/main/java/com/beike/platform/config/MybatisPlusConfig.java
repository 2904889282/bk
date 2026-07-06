package com.beike.platform.config;

import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.core.handlers.MetaObjectHandler;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.DataPermissionInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import com.beike.platform.common.CustomDataPermissionHandler;
import org.apache.ibatis.reflection.MetaObject;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;

@Configuration
public class MybatisPlusConfig {

    /**
     * MyBatis-Plus 拦截器链。
     * 拦截器顺序至关重要：DataPermissionInterceptor 必须在 PaginationInnerInterceptor 之前，
     * 否则分页生成的 COUNT / LIMIT 语句会导致权限条件拼接错位。
     */
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor(CustomDataPermissionHandler handler) {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();

        // 1. 数据权限拦截器（优先执行，修改 WHERE 后再分页）
        interceptor.addInnerInterceptor(new DataPermissionInterceptor(handler));

        // 2. 分页拦截器
        PaginationInnerInterceptor pagination = new PaginationInnerInterceptor(DbType.MYSQL);
        pagination.setMaxLimit(500L);
        interceptor.addInnerInterceptor(pagination);

        return interceptor;
    }

    /** 审计字段自动填充 */
    @Bean
    public MetaObjectHandler metaObjectHandler() {
        return new MetaObjectHandler() {
            @Override
            public void insertFill(MetaObject metaObject) {
                Long userId = getCurrentUserId();
                this.strictInsertFill(metaObject, "createBy", Long.class, userId);
                this.strictInsertFill(metaObject, "createTime", LocalDateTime.class, LocalDateTime.now());
                this.strictInsertFill(metaObject, "updateBy", Long.class, userId);
                this.strictInsertFill(metaObject, "updateTime", LocalDateTime.class, LocalDateTime.now());
            }

            @Override
            public void updateFill(MetaObject metaObject) {
                Long userId = getCurrentUserId();
                this.strictUpdateFill(metaObject, "updateBy", Long.class, userId);
                this.strictUpdateFill(metaObject, "updateTime", LocalDateTime.class, LocalDateTime.now());
            }

            private Long getCurrentUserId() {
                try {
                    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                    if (auth != null && auth.getPrincipal() instanceof Long) {
                        return (Long) auth.getPrincipal();
                    }
                } catch (Exception ignored) {}
                return 0L;
            }
        };
    }
}
