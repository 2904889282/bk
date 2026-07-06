package com.beike.common.config;

import java.lang.annotation.*;

/**
 * 标记方法使用从库(只读)数据源。
 * 不加此注解默认走主库(读写)。
 *
 * 用法:
 * @SlaveDataSource
 * public List<Pipeline> listPipelines() { ... }
 */
@Target({ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface SlaveDataSource {}
