package com.beike.platform.config;

import com.beike.platform.entity.SysUser;
import com.beike.platform.mapper.SysUserMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * 首次启动时自动插入默认角色、权限和种子用户。
 * 使用 JdbcTemplate 执行种子 SQL，避免通过 SysUserMapper 越权操作无关表。
 */
@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;
    private final SysUserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        initDepts();
        initRoles();
        initPermissions();
        initUsers();
        initRolePermissions();
        log.info("种子数据初始化完成");
    }

    // ================================================================
    // 部门
    // ================================================================
    private void initDepts() {
        execute("INSERT IGNORE INTO sys_dept (id, name, is_deleted) VALUES " +
                "(1, '平台一部', 0), " +
                "(2, '平台二部', 0), " +
                "(3, '平台三部', 0)");
    }

    // ================================================================
    // 角色
    // ================================================================
    private void initRoles() {
        execute("INSERT IGNORE INTO sys_role (id, code, name, is_deleted) VALUES " +
                "(1, 'ROLE_ADMIN', '超级管理员', 0), " +
                "(2, 'ROLE_MANAGER', '部门经理', 0), " +
                "(3, 'ROLE_USER', '普通员工', 0)");
    }

    // ================================================================
    // 权限
    // ================================================================
    private void initPermissions() {
        execute("INSERT IGNORE INTO sys_permission (id, code, name, is_deleted) VALUES " +
                // 商机（pipeline）
                "(1,  'pipeline:list',          '线索列表',   0), " +
                "(2,  'pipeline:create',        '创建线索',   0), " +
                "(3,  'pipeline:edit',          '编辑线索',   0), " +
                "(4,  'pipeline:delete',        '删除线索',   0), " +
                "(5,  'pipeline:import',        '导入线索',   0), " +
                "(6,  'pipeline:batch-delete',  '批量删除',   0), " +
                "(7,  'pipeline:batch-modify',  '批量修改',   0), " +
                "(8,  'recycle:list',           '回收站访问', 0), " +
                // 线索
                "(10, 'clue:list',              '线索列表',   0), " +
                "(11, 'clue:create',            '新建线索',   0), " +
                "(12, 'clue:edit',              '编辑线索',   0), " +
                "(13, 'clue:delete',            '删除线索',   0), " +
                "(14, 'clue:batch',             '批量删除',   0), " +
                "(15, 'clue:convert',           '线索转项目', 0), " +
                // 项目
                "(20, 'project:list',           '项目列表',   0), " +
                "(21, 'project:create',         '新建项目',   0), " +
                "(22, 'project:edit',           '编辑项目',   0), " +
                "(23, 'project:delete',         '删除项目',   0), " +
                // 风险
                "(30, 'risk:list',              '风险列表',   0), " +
                "(31, 'risk:create',            '新增风险',   0), " +
                "(32, 'risk:edit',              '编辑风险',   0), " +
                "(33, 'risk:delete',            '删除风险',   0), " +
                // 人才
                "(40, 'talent:list',            '人才列表',   0), " +
                "(41, 'talent:create',          '新增人才',   0), " +
                "(42, 'talent:edit',            '编辑人才',   0), " +
                "(43, 'talent:delete',          '删除人才',   0), " +
                // 预警
                "(50, 'alert:list',             '预警列表',   0), " +
                "(51, 'alert:create',           '新增预警',   0), " +
                "(52, 'alert:edit',             '编辑预警',   0), " +
                "(53, 'alert:delete',           '删除预警',   0), " +
                // 系统
                "(90, 'system:role',            '角色管理',   0), " +
                "(91, 'system:user:list',       '用户列表',   0), " +
                "(92, 'system:user:create',     '新增用户',   0), " +
                "(93, 'system:user:edit',       '编辑用户',   0), " +
                "(94, 'system:user:delete',     '删除用户',   0), " +
                "(95, 'system:user',            '用户管理',   0), " +
                "(96, 'system:log',             '操作日志',   0)");
    }

    // ================================================================
    // 种子用户
    // ================================================================
    private void initUsers() {
        ensureSeedUser(1L, "admin", "admin123", "管理员", "ADMIN");
        ensureSeedUser(2L, "zhangming", "zm2026", "张明", "MANAGER");

        execute("INSERT IGNORE INTO sys_user_role (user_id, role_id) VALUES (1, 1), (2, 2)");
    }

    private void ensureSeedUser(Long id, String username, String rawPassword, String realName, String roleType) {
        SysUser user = userMapper.selectById(id);
        if (user == null) {
            user = userMapper.selectOne(new LambdaQueryWrapper<SysUser>()
                    .eq(SysUser::getUsername, username));
        }

        boolean create = (user == null);
        if (create) {
            user = new SysUser();
            user.setId(id);
        }

        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setRealName(realName);
        user.setStatus(1);
        user.setDeptId(1L);
        user.setRoleType(roleType);

        if (create) {
            userMapper.insert(user);
        } else {
            userMapper.updateById(user);
        }
    }

    // ================================================================
    // 角色-权限绑定
    // ================================================================
    private void initRolePermissions() {
        // 管理员拥有全部权限
        execute("INSERT IGNORE INTO sys_role_permission (role_id, permission_id) " +
                "SELECT 1, id FROM sys_permission");

        // 部门经理拥有业务权限（无系统管理 id >= 90）
        execute("INSERT IGNORE INTO sys_role_permission (role_id, permission_id) " +
                "SELECT 2, id FROM sys_permission WHERE id < 90");

        // 普通员工仅查看权限
        execute("INSERT IGNORE INTO sys_role_permission (role_id, permission_id) " +
                "SELECT 3, id FROM sys_permission WHERE code LIKE '%:list'");
    }

    // ================================================================
    // 辅助方法
    // ================================================================

    /**
     * 执行种子 SQL。INSERT IGNORE 保证幂等，重复执行不会报错。
     * 仅预期内的数据完整性异常（重复键等）静默处理；
     * 连接失败、表不存在等意外异常需向上抛出，防止静默丢失种子数据。
     */
    private void execute(String sql) {
        try {
            jdbcTemplate.update(sql);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            // INSERT IGNORE 幂等，预期内：数据已存在
            log.debug("Seed data already exists, skipped: {}", e.getMessage());
        }
    }
}
