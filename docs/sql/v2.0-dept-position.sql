-- v2.0: 部门层级化 + 职位独立管理
-- 执行前请备份数据库

START TRANSACTION;

-- 1. 部门表加层级支持
ALTER TABLE sys_dept
    ADD COLUMN IF NOT EXISTS parent_id BIGINT DEFAULT NULL COMMENT '父部门ID(顶级部门为NULL)',
    ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0 COMMENT '排序号',
    ADD INDEX idx_parent (parent_id);

-- 2. 职位表
CREATE TABLE IF NOT EXISTS sys_position (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(64) NOT NULL COMMENT '职位名称',
    sort_order INT DEFAULT 0 COMMENT '排序号',
    is_deleted INT DEFAULT 0 COMMENT '逻辑删除',
    INDEX idx_name (name)
) COMMENT '职位表';

-- 初始化默认职位
INSERT INTO sys_position (name, sort_order) VALUES
    ('总经理', 1),
    ('副总经理', 2),
    ('总监', 3),
    ('经理', 4),
    ('主管', 5),
    ('专员', 6),
    ('助理', 7)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 3. 用户表加职位关联
ALTER TABLE sys_user
    ADD COLUMN IF NOT EXISTS position_id BIGINT DEFAULT NULL COMMENT '职位ID',
    ADD INDEX idx_position (position_id);

-- 4. 把现有的一级/二级嵌套部门名拆成层级
-- 例如 "平台事业群/平台一部" → parent_id 指向 "平台事业群"
UPDATE sys_dept SET sort_order = 0 WHERE sort_order IS NULL;

COMMIT;

-- 验证
SELECT 'sys_dept columns:' AS info;
SHOW COLUMNS FROM sys_dept;
SELECT 'sys_position:' AS info;
SELECT * FROM sys_position WHERE is_deleted = 0;
SELECT 'migration done' AS status;
