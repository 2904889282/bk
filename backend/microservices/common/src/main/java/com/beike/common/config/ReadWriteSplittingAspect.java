package com.beike.common.config;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * 读写分离 AOP：标记 @SlaveDataSource 的方法自动切换到从库
 */
@Aspect
@Order(1)
@Component
public class ReadWriteSplittingAspect {

    @Around("@annotation(com.beike.common.config.SlaveDataSource)")
    public Object routeToSlave(ProceedingJoinPoint pjp) throws Throwable {
        DataSourceContextHolder.setDataSourceType(DataSourceType.SLAVE);
        try {
            return pjp.proceed();
        } finally {
            DataSourceContextHolder.clear();
        }
    }

    // 默认主库拦截 (当事务中有写操作时强制走主库)
    @Around("@annotation(org.springframework.transaction.annotation.Transactional)")
    public Object forceMaster(ProceedingJoinPoint pjp) throws Throwable {
        DataSourceContextHolder.setDataSourceType(DataSourceType.MASTER);
        try {
            return pjp.proceed();
        } finally {
            DataSourceContextHolder.clear();
        }
    }
}
