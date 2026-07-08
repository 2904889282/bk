USE beike_admin;

CREATE TABLE IF NOT EXISTS sys_role (
  id VARCHAR(16) PRIMARY KEY, name VARCHAR(64), code VARCHAR(64) UNIQUE,
  description VARCHAR(256), sort INT DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sys_permission (
  id VARCHAR(16) PRIMARY KEY, parent_id VARCHAR(16) DEFAULT '0',
  name VARCHAR(64), code VARCHAR(128) UNIQUE, type INT COMMENT '0目录1菜单2按钮',
  path VARCHAR(256), component VARCHAR(256), icon VARCHAR(64),
  sort INT DEFAULT 0, visible INT DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sys_user_role (
  id VARCHAR(16) PRIMARY KEY, user_id VARCHAR(16) NOT NULL, role_id VARCHAR(16) NOT NULL,
  UNIQUE KEY uk_ur (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS sys_role_permission (
  id VARCHAR(16) PRIMARY KEY, role_id VARCHAR(16) NOT NULL, permission_id VARCHAR(16) NOT NULL,
  UNIQUE KEY uk_rp (role_id, permission_id)
);

-- 角色
INSERT INTO sys_role (id, name, code, description, sort) VALUES
('R001', '超级管理员', 'ROLE_ADMIN', '系统全部权限', 1),
('R002', '部门经理', 'ROLE_MANAGER', '管理本部门线索与项目', 2),
('R003', '普通员工', 'ROLE_USER', '查看与填报', 3)
ON DUPLICATE KEY UPDATE name=name;

-- 菜单权限
INSERT INTO sys_permission (id, parent_id, name, code, type, path, component, icon, sort) VALUES
('P001', '0', '工作台', 'portal', 1, '/', './Portal', 'DashboardOutlined', 1),
('P010', '0', 'LTC线索', 'ltc', 0, '', '', 'FundOutlined', 10),
('P011', 'P010', '线索看板', 'ltc:kanban', 1, '/ltc/kanban', './LTC/Kanban', 'FundOutlined', 11),
('P012', 'P010', '线索列表', 'ltc:pipeline', 1, '/ltc/pipeline', './LTC/Pipeline', 'UnorderedListOutlined', 12),
('P013', 'P010', '预警中心', 'ltc:alerts', 1, '/ltc/alerts', './LTC/Alerts', 'AlertOutlined', 13),
('P014', 'P010', '数据分析', 'ltc:analysis', 1, '/ltc/analysis', './LTC/Analysis', 'PieChartOutlined', 14),
('P015', 'P010', '创建线索', 'pipeline:create', 2, '', '', '', 15),
('P016', 'P010', '删除线索', 'pipeline:delete', 2, '', '', '', 16),
('P017', 'P010', '导入线索', 'pipeline:import', 2, '', '', '', 17),
('P020', '0', '项目管理', 'pm', 0, '', '', 'ProjectOutlined', 20),
('P021', 'P020', '项目看板', 'pm:kanban', 1, '/pm/kanban', './PM/Kanban', 'ProjectOutlined', 21),
('P022', 'P020', '项目列表', 'pm:projects', 1, '/pm/projects', './PM/Projects', 'UnorderedListOutlined', 22),
('P023', 'P020', '风险管理', 'pm:risks', 1, '/pm/risks', './PM/Risks', 'SafetyOutlined', 23),
('P024', 'P020', '人才池', 'pm:talent', 1, '/pm/talent', './PM/Talent', 'TeamOutlined', 24),
('P030', '0', '系统管理', 'admin', 0, '', '', 'SettingOutlined', 90),
('P031', 'P030', '用户管理', 'admin:user', 1, '/admin/users', './Admin/Users', 'UserOutlined', 91),
('P032', 'P030', '角色管理', 'admin:role', 1, '/admin/roles', './Admin/Roles', 'SafetyOutlined', 92),
('P033', 'P030', '用户列表', 'system:user:list', 2, '', '', '', 93),
('P034', 'P030', '新增用户', 'system:user:create', 2, '', '', '', 94),
('P035', 'P030', '编辑用户', 'system:user:edit', 2, '', '', '', 95),
('P036', 'P030', '删除用户', 'system:user:delete', 2, '', '', '', 96)
ON DUPLICATE KEY UPDATE name=name;

-- 角色-权限: 管理员拥有全部
INSERT INTO sys_role_permission (id, role_id, permission_id)
SELECT CONCAT('RP', @rownum:=@rownum+1), 'R001', id FROM sys_permission, (SELECT @rownum:=0) r
ON DUPLICATE KEY UPDATE role_id='R001';

-- 角色-权限: 部门经理 (无系统管理)
INSERT INTO sys_role_permission (id, role_id, permission_id) VALUES
('RPM001','R002','P001'),('RPM002','R002','P010'),('RPM003','R002','P011'),('RPM004','R002','P012'),
('RPM005','R002','P013'),('RPM006','R002','P014'),('RPM007','R002','P015'),('RPM017','R002','P017'),('RPM008','R002','P020'),
('RPM009','R002','P021'),('RPM010','R002','P022'),('RPM011','R002','P023'),('RPM012','R002','P024')
ON DUPLICATE KEY UPDATE permission_id=permission_id;

-- 角色-权限: 普通员工 (仅查看)
INSERT INTO sys_role_permission (id, role_id, permission_id) VALUES
('RPU001','R003','P001'),('RPU002','R003','P010'),('RPU003','R003','P011'),('RPU004','R003','P012'),
('RPU005','R003','P013'),('RPU006','R003','P014'),('RPU007','R003','P020'),('RPU008','R003','P021'),
('RPU009','R003','P022'),('RPU010','R003','P023'),('RPU011','R003','P024')
ON DUPLICATE KEY UPDATE permission_id=permission_id;

-- 用户-角色
INSERT INTO sys_user_role (id, user_id, role_id) VALUES
('UR001','U001','R001'), ('UR002','U002','R002')
ON DUPLICATE KEY UPDATE role_id=role_id;
