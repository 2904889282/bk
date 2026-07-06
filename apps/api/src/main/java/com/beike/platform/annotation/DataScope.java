package com.beike.platform.annotation;

import java.lang.annotation.*;

/**
 * 数据权限注解 — 标注在 Mapper 方法上，由 CustomDataPermissionHandler 通过反射读取，
 * 利用 MultiDataPermissionHandler + JSqlParser 自动注入 WHERE 条件。
 * <p>
 * 使用示例（Mapper 接口）：
 * <pre>{@code
 * @DataScope(userColumn = "owner_id", deptColumn = "dept_id", pkColumn = "id")
 * IPage<PipelineVO> selectPipelinePage(Page<Pipeline> page, @Param("query") PipelinePageDTO dto);
 * }</pre>
 * <p>
 * 注意：该方法对应的 SQL 中主表需使用别名，handler 通过 table.getAlias() 自动拼接。
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface DataScope {

    /** 负责人字段名（如：owner_id） */
    String userColumn() default "owner_id";

    /** 部门字段名（如：dept_id） */
    String deptColumn() default "dept_id";

    /** 主键字段名（用于关联成员表的 IN 子查询） */
    String pkColumn() default "id";
}
