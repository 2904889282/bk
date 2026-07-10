-- ============================================================
-- v1.2 升级脚本：数据权限体系
-- 适用数据库：beike_platform
-- ============================================================

-- 1. sys_dept 部门/组表
CREATE TABLE IF NOT EXISTS sys_dept (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(64) NOT NULL COMMENT '组/部门名称'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='部门/组表';

-- 2. sys_user 新增字段
ALTER TABLE sys_user ADD COLUMN dept_id BIGINT DEFAULT NULL COMMENT '所属部门ID';
ALTER TABLE sys_user ADD COLUMN role_type VARCHAR(16) DEFAULT 'USER' COMMENT '角色类型(ADMIN超管/MANAGER组长/USER普通员工)';

-- 3. biz_pipeline 商机线索表
CREATE TABLE IF NOT EXISTS biz_pipeline (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(128) NOT NULL COMMENT '商机名称',
    customer VARCHAR(128) COMMENT '客户名称',
    stage VARCHAR(32) NOT NULL DEFAULT 'initial' COMMENT '阶段(initial/requirement/proposal/negotiation/won/lost)',
    amount DECIMAL(12,2) DEFAULT 0 COMMENT '预计金额',
    win_rate INT DEFAULT 0 COMMENT '赢率(0-100)',
    owner_id BIGINT NOT NULL COMMENT '负责人ID',
    dept_id BIGINT NOT NULL COMMENT '负责人所属部门ID(冗余)',
    is_sea TINYINT DEFAULT 0 COMMENT '是否公海(1=公海,0=私海)',
    description TEXT COMMENT '描述',
    next_action VARCHAR(256) COMMENT '下一步行动',
    create_by BIGINT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_by BIGINT,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted TINYINT DEFAULT 0,
    INDEX idx_owner (owner_id),
    INDEX idx_dept (dept_id),
    INDEX idx_stage (stage),
    INDEX idx_sea (is_sea)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商机线索表';

-- 4. biz_pipeline_member 项目团队协作表
CREATE TABLE IF NOT EXISTS biz_pipeline_member (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    pipeline_id BIGINT NOT NULL COMMENT '商机ID',
    user_id BIGINT NOT NULL COMMENT '团队成员ID',
    role VARCHAR(32) DEFAULT '' COMMENT '在项目中的角色(如:售前支持/商务协助)',
    INDEX idx_pipeline (pipeline_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商机团队成员表';

-- 5. 默认部门
INSERT IGNORE INTO sys_dept (id, name) VALUES (1, '平台一部'), (2, '平台二部'), (3, '平台三部');

-- 6. 更新现有用户(默认部门/角色)
UPDATE sys_user SET dept_id = 1, role_type = 'ADMIN' WHERE id = 1;
UPDATE sys_user SET dept_id = 1, role_type = 'MANAGER' WHERE id = 2;

-- 7. 新增权限
INSERT IGNORE INTO sys_permission (code, name, is_deleted) VALUES
('recycle:list', '回收站访问', 0),
('pipeline:list', '线索列表', 0),
('pipeline:create', '新建线索', 0),
('pipeline:edit', '编辑线索', 0),
('pipeline:delete', '删除线索', 0),
('pipeline:sea:view', '查看公海', 0),
('pipeline:sea:assign', '公海分配', 0);

-- 8. 授权给角色(1=管理员, 2=组长)
INSERT IGNORE INTO sys_role_permission (role_id, permission_id)
SELECT 1, id FROM sys_permission WHERE code LIKE 'pipeline:%' OR code = 'recycle:list';
INSERT IGNORE INTO sys_role_permission (role_id, permission_id)
SELECT 2, id FROM sys_permission WHERE (code LIKE 'pipeline:%' AND code NOT IN ('pipeline:sea:assign')) OR code = 'recycle:list';
