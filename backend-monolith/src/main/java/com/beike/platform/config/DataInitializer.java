package com.beike.platform.config;

import com.beike.platform.entity.SysUser;
import com.beike.platform.mapper.SysUserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * 首次启动时自动插入默认角色、权限和种子用户
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final SysUserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        initRoles();
        initPermissions();
        initUsers();
        initRolePermissions();
        log.info("✅ 种子数据初始化完成");
    }

    private void initRoles() {
        execute("INSERT IGNORE INTO sys_role (id, code, name, is_deleted) VALUES " +
                "(1, 'ROLE_ADMIN', '超级管理员', 0), " +
                "(2, 'ROLE_MANAGER', '部门经理', 0), " +
                "(3, 'ROLE_USER', '普通员工', 0)");
    }

    private void initPermissions() {
        execute("INSERT IGNORE INTO sys_permission (id, code, name, is_deleted) VALUES " +
                // 管线
                "(1, 'pipeline:create', '创建管线', 0), (2, 'pipeline:edit', '编辑管线', 0), " +
                "(3, 'pipeline:delete', '删除管线', 0), (4, 'pipeline:import', '导入管线', 0), " +
                "(5, 'pipeline:batch-delete', '批量删除', 0), (6, 'pipeline:batch-modify', '批量修改', 0), " +
                // 线索
                "(10, 'clue:list', '线索列表', 0), (11, 'clue:create', '新建线索', 0), " +
                "(12, 'clue:edit', '编辑线索', 0), (13, 'clue:delete', '删除线索', 0), " +
                "(14, 'clue:batch', '批量删除', 0), (15, 'clue:convert', '线索转项目', 0), " +
                // 项目
                "(20, 'project:list', '项目列表', 0), (21, 'project:create', '新建项目', 0), " +
                "(22, 'project:edit', '编辑项目', 0), (23, 'project:delete', '删除项目', 0), " +
                // 风险
                "(30, 'risk:list', '风险列表', 0), (31, 'risk:create', '新增风险', 0), " +
                "(32, 'risk:edit', '编辑风险', 0), (33, 'risk:delete', '删除风险', 0), " +
                // 人才
                "(40, 'talent:list', '人才列表', 0), (41, 'talent:create', '新增人才', 0), " +
                "(42, 'talent:edit', '编辑人才', 0), (43, 'talent:delete', '删除人才', 0), " +
                // 预警
                "(50, 'alert:list', '预警列表', 0), (51, 'alert:create', '新增预警', 0), " +
                "(52, 'alert:edit', '编辑预警', 0), (53, 'alert:delete', '删除预警', 0), " +
                // 系统
                "(90, 'system:role', '角色管理', 0), (91, 'system:user:list', '用户列表', 0), " +
                "(92, 'system:user:create', '新增用户', 0), (93, 'system:user:edit', '编辑用户', 0), " +
                "(94, 'system:user:delete', '删除用户', 0)");
    }

    private void initUsers() {
        // 检查是否已存在
        if (userMapper.selectById(1L) != null) return;

        SysUser admin = new SysUser();
        admin.setUsername("admin");
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setRealName("管理员");
        admin.setStatus(1);
        userMapper.insert(admin);

        SysUser manager = new SysUser();
        manager.setUsername("zhangming");
        manager.setPassword(passwordEncoder.encode("zm2026"));
        manager.setRealName("张明");
        manager.setStatus(1);
        userMapper.insert(manager);

        // 分配用户角色
        execute("INSERT IGNORE INTO sys_user_role (user_id, role_id) VALUES " +
                "(1, 1), (2, 2)");
    }

    private void initRolePermissions() {
        // 管理员拥有全部权限
        execute("INSERT IGNORE INTO sys_role_permission (role_id, permission_id) " +
                "SELECT 1, id FROM sys_permission");

        // 部门经理拥有业务权限（无系统管理 90-94）
        execute("INSERT IGNORE INTO sys_role_permission (role_id, permission_id) " +
                "SELECT 2, id FROM sys_permission WHERE id < 90");

        // 普通员工仅查看权限
        execute("INSERT IGNORE INTO sys_role_permission (role_id, permission_id) " +
                "SELECT 3, id FROM sys_permission WHERE code LIKE '%:list'");
    }

    private void execute(String sql) {
        try {
            userMapper.executeRawSql(sql);
        } catch (Exception e) {
            log.debug("Seed SQL skipped (may already exist): {}", e.getMessage());
        }
    }
}
