-- ============================================================
-- 单体后端 v1.0 - 新增模块建表脚本
-- 风险 / 人才 / 预警 三张表
-- 严格对齐现有 MyBatis-Plus 实体字段命名（下划线转驼峰）
-- ============================================================

-- 1. 风险表
CREATE TABLE IF NOT EXISTS biz_risk (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    project_id BIGINT COMMENT '关联项目ID',
    type VARCHAR(128) COMMENT '风险项',
    `level` VARCHAR(16) NOT NULL DEFAULT 'medium' COMMENT '影响等级: high/medium/low',
    description TEXT COMMENT '风险描述',
    solution TEXT COMMENT '应对措施',
    owner VARCHAR(64) COMMENT '负责人',
    status VARCHAR(16) NOT NULL DEFAULT 'open' COMMENT '状态: open/resolved',
    create_by BIGINT COMMENT '创建人',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_by BIGINT COMMENT '更新人',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    is_deleted INT DEFAULT 0 COMMENT '逻辑删除: 0未删除 1已删除',
    INDEX idx_project_id (project_id),
    INDEX idx_status (status),
    INDEX idx_level (`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='风险表';

-- 2. 人才表
CREATE TABLE IF NOT EXISTS biz_talent (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    name VARCHAR(64) NOT NULL COMMENT '姓名',
    role VARCHAR(64) COMMENT '角色',
    skills VARCHAR(512) COMMENT '技能标签（逗号分隔）',
    current_project VARCHAR(256) COMMENT '当前项目',
    utilization INT DEFAULT 0 COMMENT '利用率(%)',
    status VARCHAR(16) NOT NULL DEFAULT 'normal' COMMENT '状态: normal/high/overload/idle',
    create_by BIGINT COMMENT '创建人',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_by BIGINT COMMENT '更新人',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    is_deleted INT DEFAULT 0 COMMENT '逻辑删除: 0未删除 1已删除',
    INDEX idx_name (name),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='人才表';

-- 3. 预警表
CREATE TABLE IF NOT EXISTS biz_alert (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    project_id BIGINT COMMENT '关联项目ID',
    type VARCHAR(128) COMMENT '预警类型',
    `level` VARCHAR(16) NOT NULL DEFAULT 'medium' COMMENT '严重程度: high/medium',
    description TEXT COMMENT '问题描述',
    manager VARCHAR(64) COMMENT '负责人',
    status VARCHAR(16) NOT NULL DEFAULT 'open' COMMENT '状态: open/resolved',
    create_by BIGINT COMMENT '创建人',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_by BIGINT COMMENT '更新人',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    is_deleted INT DEFAULT 0 COMMENT '逻辑删除: 0未删除 1已删除',
    INDEX idx_project_id (project_id),
    INDEX idx_status (status),
    INDEX idx_level (`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='预警表';

-- 4. 新增权限（仅 code + name，id 自增）
INSERT INTO sys_permission (code, name, is_deleted) VALUES
('alert:list',   '预警列表',   0),
('alert:create', '新增预警',   0),
('alert:edit',   '编辑预警',   0),
('alert:delete', '删除预警',   0),
('risk:list',    '风险列表',   0),
('risk:create',  '新增风险',   0),
('risk:edit',    '编辑风险',   0),
('risk:delete',  '删除风险',   0),
('talent:list',  '人才列表',   0),
('talent:create','新增人才',   0),
('talent:edit',  '编辑人才',   0),
('talent:delete','删除人才',   0);

-- 5. 角色-权限：管理员 (role_id=1) 拥有全部新增权限
INSERT INTO sys_role_permission (role_id, permission_id)
SELECT 1, id FROM sys_permission WHERE code IN (
  'alert:list','alert:create','alert:edit','alert:delete',
  'risk:list','risk:create','risk:edit','risk:delete',
  'talent:list','talent:create','talent:edit','talent:delete'
);

-- 6. 角色-权限：部门经理 (role_id=2) 拥有所有新增权限
INSERT INTO sys_role_permission (role_id, permission_id)
SELECT 2, id FROM sys_permission WHERE code IN (
  'alert:list','alert:create','alert:edit','alert:delete',
  'risk:list','risk:create','risk:edit','risk:delete',
  'talent:list','talent:create','talent:edit','talent:delete'
);

-- 7. 角色-权限：普通员工 (role_id=3) 仅有查看权限
INSERT INTO sys_role_permission (role_id, permission_id)
SELECT 3, id FROM sys_permission WHERE code IN (
  'alert:list', 'risk:list', 'talent:list'
);
