-- ============================================================
-- 底座建表脚本 — sys_user + RBAC 全套
-- 适用数据库：beike_platform
-- 为单体后端 v1.4 补齐缺失的核心表
-- ============================================================

CREATE TABLE IF NOT EXISTS sys_user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE,
    password VARCHAR(256) NOT NULL,
    real_name VARCHAR(64),
    email VARCHAR(128),
    phone VARCHAR(16),
    status INT DEFAULT 1,
    dept_id BIGINT DEFAULT NULL,
    role_type VARCHAR(16) DEFAULT 'USER',
    create_by BIGINT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_by BIGINT,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sys_role (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(64),
    code VARCHAR(64) UNIQUE,
    description VARCHAR(256),
    sort INT DEFAULT 0,
    create_by BIGINT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_by BIGINT,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sys_permission (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    parent_id BIGINT DEFAULT 0,
    name VARCHAR(64),
    code VARCHAR(128) UNIQUE,
    type INT COMMENT '0目录1菜单2按钮',
    path VARCHAR(256),
    component VARCHAR(256),
    icon VARCHAR(64),
    sort INT DEFAULT 0,
    visible INT DEFAULT 1,
    create_by BIGINT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_by BIGINT,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sys_user_role (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    UNIQUE KEY uk_ur (user_id, role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sys_role_permission (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    UNIQUE KEY uk_rp (role_id, permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS login_device (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token_jti VARCHAR(128),
    ip VARCHAR(64),
    user_agent VARCHAR(512),
    login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
    active INT DEFAULT 1,
    is_deleted INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 默认管理员 (admin / admin123) bcrypt 加密
INSERT INTO sys_user (id, username, password, real_name, status, role_type) VALUES
(1, 'admin', '$2b$12$LiImHXSuUrccygtcxvQID.PUOLQK1Nve6./XjTklMgbPK3LEssONa', '管理员', 1, 'ADMIN'),
(2, 'zhangming', '$2b$12$BxdG3GCUqNV/KdStLju3Rutj3XoahSY4MK6gbaZfLzEur5iF8FKZi', '张明', 1, 'MANAGER')
ON DUPLICATE KEY UPDATE username=username;

-- 角色
INSERT IGNORE INTO sys_role (id, name, code, sort) VALUES
(1, '超级管理员', 'ROLE_ADMIN', 1),
(2, '部门经理',   'ROLE_MANAGER', 2),
(3, '普通员工',   'ROLE_USER', 3);

-- 用户-角色
INSERT IGNORE INTO sys_user_role (user_id, role_id) VALUES
(1, 1), (2, 2);
