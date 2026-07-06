-- ============================================================
-- v1.1 升级脚本：忘记密码 + 微信登录 + 多设备管理
-- ============================================================

-- 1. sys_user 增加微信相关字段
ALTER TABLE sys_user ADD COLUMN wechat_open_id VARCHAR(128) COMMENT '微信OpenID';
ALTER TABLE sys_user ADD COLUMN wechat_union_id VARCHAR(128) COMMENT '微信UnionID';

-- 2. 登录设备表
CREATE TABLE IF NOT EXISTS sys_login_device (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token_jti VARCHAR(64) NOT NULL,
    device_name VARCHAR(256),
    ip VARCHAR(64),
    user_agent VARCHAR(512),
    login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
    active TINYINT DEFAULT 1,
    INDEX idx_user_id (user_id),
    INDEX idx_jti (token_jti)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='登录设备表';

-- 3. 新增权限
INSERT IGNORE INTO sys_permission (code, name, is_deleted) VALUES ('account:devices', '设备管理', 0);
INSERT IGNORE INTO sys_role_permission (role_id, permission_id) SELECT 1, id FROM sys_permission WHERE code = 'account:devices';
INSERT IGNORE INTO sys_role_permission (role_id, permission_id) SELECT 2, id FROM sys_permission WHERE code = 'account:devices';
