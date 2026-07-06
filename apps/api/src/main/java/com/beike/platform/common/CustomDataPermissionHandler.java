package com.beike.platform.common;

import com.baomidou.mybatisplus.extension.plugins.handler.MultiDataPermissionHandler;
import com.beike.platform.annotation.DataScope;
import lombok.extern.slf4j.Slf4j;
import net.sf.jsqlparser.expression.Expression;
import net.sf.jsqlparser.expression.LongValue;
import net.sf.jsqlparser.expression.operators.conditional.AndExpression;
import net.sf.jsqlparser.expression.operators.conditional.OrExpression;
import net.sf.jsqlparser.expression.operators.relational.EqualsTo;
import net.sf.jsqlparser.parser.CCJSqlParserUtil;
import net.sf.jsqlparser.schema.Column;
import net.sf.jsqlparser.schema.Table;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;

/**
 * MyBatis-Plus 多表数据权限处理器 — 通过 MappedStatementId 反射获取 @DataScope 注解，
 * 根据当前用户的 roleType 自动构建 JSqlParser Expression 追加到 WHERE 子句。
 * <p>
 * 规则：<br>
 * - ADMIN 超管：不追加条件（看全部）<br>
 * - MANAGER 组长：dept_id = 本部门<br>
 * - USER 普通员工：(owner_id = 本人 OR pk IN 成员表子查询)
 */
@Slf4j
@Component
public class CustomDataPermissionHandler implements MultiDataPermissionHandler {

    /** 需要应用数据权限的主表名（mapper.xml 中的 FROM 表名） */
    private static final String TARGET_TABLE = "biz_pipeline";

    @Override
    public Expression getSqlSegment(Table table, Expression where, String mappedStatementId) {
        // 1. 只针对目标表做权限过滤
        String tableName = table.getName();
        if (!TARGET_TABLE.equals(tableName)) {
            return null;
        }

        // 2. 反射获取 Mapper 方法上的 @DataScope 注解
        DataScope dataScope = getDataScopeAnnotation(mappedStatementId);
        if (dataScope == null) {
            return null;
        }

        // 3. 获取当前登录用户
        SecurityUtils.LoginUser loginUser = SecurityUtils.getLoginUser();
        if (loginUser == null || "ADMIN".equals(loginUser.getRoleType())) {
            return null; // 未登录或超管，不拦截
        }

        // 4. 获取表别名（SQL 中 AS p 或隐式 p）
        String alias = (table.getAlias() != null) ? table.getAlias().getName() : tableName;

        // 5. 根据角色构建条件
        String roleType = loginUser.getRoleType();
        Long userId = loginUser.getUserId();
        Long deptId = loginUser.getDeptId();

        if ("MANAGER".equals(roleType)) {
            // 组长：dept_id = 本组 OR is_sea = 1（公海数据组长也可以看）
            return new OrExpression(
                    eq(alias, dataScope.deptColumn(), deptId),
                    eq(alias, "is_sea", 1L)
            );
        } else {
            // 普通员工：(owner_id = 本人 OR id IN 成员子查询) AND is_sea = 0
            OrExpression ownerOrTeam = new OrExpression(
                    eq(alias, dataScope.userColumn(), userId),
                    buildMemberSubQuery(alias, dataScope.pkColumn(), userId)
            );
            return new AndExpression(ownerOrTeam, eq(alias, "is_sea", 0L));
        }
    }

    /** 构建 column = value */
    private Expression eq(String alias, String column, Long value) {
        return new EqualsTo()
                .withLeftExpression(new Column(alias + "." + column))
                .withRightExpression(new LongValue(value));
    }

    /**
     * 构建 alias.pk IN (SELECT pipeline_id FROM biz_pipeline_member WHERE user_id = ?)
     * 通过 CCJSqlParserUtil 解析 SQL 字符串，避免 jsqlparser 4.9 API 不兼容问题
     */
    private Expression buildMemberSubQuery(String alias, String pkColumn, Long userId) {
        try {
            String cond = alias + "." + pkColumn
                    + " IN (SELECT pipeline_id FROM biz_pipeline_member WHERE user_id = " + userId + ")";
            return CCJSqlParserUtil.parseCondExpression(cond);
        } catch (Exception e) {
            log.error("[DataScope] 构建成员子查询失败", e);
            // 降级：owner_id = userId
            return new EqualsTo()
                    .withLeftExpression(new Column(alias + "." + pkColumn))
                    .withRightExpression(new LongValue(userId));
        }
    }

    /**
     * 通过 MappedStatementId 反射获取 Mapper 方法上的 @DataScope 注解
     * mappedStatementId 格式：com.beike.platform.mapper.PipelineMapper.selectPageWithFilter
     */
    private DataScope getDataScopeAnnotation(String mappedStatementId) {
        try {
            int lastDot = mappedStatementId.lastIndexOf('.');
            if (lastDot == -1) return null;
            String className = mappedStatementId.substring(0, lastDot);
            String methodName = mappedStatementId.substring(lastDot + 1);

            Class<?> clazz = Class.forName(className);
            for (Method method : clazz.getMethods()) {
                if (method.getName().equals(methodName)) {
                    return method.getAnnotation(DataScope.class);
                }
            }
        } catch (ClassNotFoundException e) {
            log.warn("[DataScope] 找不到类: {}", mappedStatementId);
        }
        return null;
    }
}
