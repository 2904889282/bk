SET NAMES utf8mb4;
SET time_zone = '+08:00';

CREATE TABLE IF NOT EXISTS sys_dept (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(64) NOT NULL COMMENT '组/部门名称',
    is_deleted INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
    is_deleted INT DEFAULT 0,
    INDEX idx_dept_id (dept_id),
    INDEX idx_role_type (role_type)
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
    type INT,
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
    UNIQUE KEY uk_user_role (user_id, role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sys_role_permission (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    UNIQUE KEY uk_role_permission (role_id, permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sys_login_device (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token_jti VARCHAR(128) NOT NULL,
    device_name VARCHAR(256),
    ip VARCHAR(64),
    user_agent VARCHAR(512),
    login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
    active TINYINT DEFAULT 1,
    INDEX idx_user_id (user_id),
    INDEX idx_jti (token_jti)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sys_operation_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    user_name VARCHAR(64),
    module VARCHAR(64),
    action VARCHAR(64),
    target_id BIGINT,
    detail VARCHAR(1024),
    ip VARCHAR(64),
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_name (user_name),
    INDEX idx_action (action),
    INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS biz_pipeline (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    customer VARCHAR(128),
    stage VARCHAR(32) NOT NULL DEFAULT 'lead',
    amount DECIMAL(12,2) DEFAULT 0,
    win_rate INT DEFAULT 0,
    owner_id BIGINT,
    dept_id BIGINT,
    is_sea TINYINT DEFAULT 0,
    description TEXT,
    next_action VARCHAR(256),
    create_by BIGINT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_by BIGINT,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted TINYINT DEFAULT 0,
    INDEX idx_owner (owner_id),
    INDEX idx_dept (dept_id),
    INDEX idx_stage (stage),
    INDEX idx_sea (is_sea)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS biz_pipeline_member (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    pipeline_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role VARCHAR(32) DEFAULT '',
    INDEX idx_pipeline (pipeline_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS biz_project (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_name VARCHAR(128) NOT NULL,
    client_name VARCHAR(128),
    project_manager VARCHAR(64),
    project_amount DECIMAL(14,2) DEFAULT 0,
    project_status VARCHAR(32) DEFAULT '进行中',
    progress INT DEFAULT 0,
    start_date DATE,
    expected_end DATE,
    actual_end DATE,
    stage VARCHAR(32),
    project_level VARCHAR(8),
    dept_belong VARCHAR(64),
    source_clue_id BIGINT,
    ar_user_id BIGINT,
    sr_user_id BIGINT,
    fr_user_id BIGINT,
    risk_count INT DEFAULT 0,
    description TEXT,
    create_by BIGINT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_by BIGINT,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted INT DEFAULT 0,
    INDEX idx_project_status (project_status),
    INDEX idx_project_manager (project_manager),
    INDEX idx_source_clue_id (source_clue_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS biz_clue (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    clue_name VARCHAR(128) NOT NULL,
    client_company VARCHAR(128),
    client_dept VARCHAR(128),
    client_contact VARCHAR(64),
    beike_owner VARCHAR(64),
    budget VARCHAR(64),
    budget_amount DECIMAL(12,2),
    clue_level VARCHAR(8),
    clue_status VARCHAR(32) DEFAULT '接触',
    review_status VARCHAR(32),
    business_confirmed VARCHAR(32),
    contact_date DATE,
    proposal_date DATE,
    create_date DATE,
    requirement_desc TEXT,
    pain_point TEXT,
    expected_target TEXT,
    clue_evaluation TEXT,
    remark TEXT,
    dept_belong VARCHAR(64),
    comm_record_1 TEXT,
    comm_record_2 TEXT,
    comm_record_3 TEXT,
    comm_record_4 TEXT,
    ar_user_id BIGINT,
    sr_user_id BIGINT,
    fr_user_id BIGINT,
    related_project_id BIGINT,
    converted_opportunity_id BIGINT,
    is_converted INT DEFAULT 0,
    expected_restart DATE,
    clue_number VARCHAR(20) DEFAULT NULL,
    campaign_id BIGINT DEFAULT NULL,
    source_type VARCHAR(32),
    source_activity_name VARCHAR(128),
    client_circle VARCHAR(16),
    industry VARCHAR(32),
    value_quadrant VARCHAR(8),
    maintenance_freq INT DEFAULT 30,
    next_maintenance_date DATE,
    maintenance_methods VARCHAR(128),
    health_status VARCHAR(8) DEFAULT 'normal',
    opportunity_amount DECIMAL(12,2),
    last_follow_time DATETIME,
    convert_status VARCHAR(16),
    matched_products VARCHAR(256),
    recommended_products TEXT,
    relation_1 VARCHAR(256),
    relation_2 VARCHAR(256),
    relation_3 VARCHAR(256),
    create_by BIGINT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_by BIGINT,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted INT DEFAULT 0,
    UNIQUE KEY uk_clue_number (clue_number),
    INDEX idx_campaign_id (campaign_id),
    INDEX idx_health_status (health_status),
    INDEX idx_clue_status (clue_status),
    INDEX idx_client_company (client_company)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS biz_campaign (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    start_date DATE,
    end_date DATE,
    target_count INT DEFAULT 0,
    target_amount DECIMAL(14,2) DEFAULT 0,
    status VARCHAR(16) DEFAULT 'ACTIVE',
    description TEXT,
    priority VARCHAR(8) DEFAULT 'NORMAL',
    manager_name VARCHAR(64),
    create_by BIGINT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_by BIGINT,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS biz_clue_contact (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    clue_id BIGINT NOT NULL,
    name VARCHAR(64) NOT NULL,
    position VARCHAR(64),
    level VARCHAR(8) DEFAULT '执行层',
    contact_info VARCHAR(128),
    attitude VARCHAR(8) DEFAULT '中立',
    remarks TEXT,
    influence_weight INT DEFAULT 1,
    interaction_records TEXT,
    personal_focus TEXT,
    relations VARCHAR(256),
    create_by BIGINT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_by BIGINT,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted INT DEFAULT 0,
    INDEX idx_clue_id (clue_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS biz_clue_follow (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    clue_id BIGINT NOT NULL,
    follow_type VARCHAR(32),
    follow_date DATETIME,
    follow_user_id BIGINT,
    follow_user_name VARCHAR(64),
    contact_person VARCHAR(64),
    core_conclusion VARCHAR(512),
    detail_content TEXT,
    next_plan TEXT,
    next_deadline DATE,
    new_status VARCHAR(32),
    weekly_review_notes TEXT,
    attachment_urls TEXT,
    create_by BIGINT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_by BIGINT,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted INT DEFAULT 0,
    INDEX idx_clue_id (clue_id),
    INDEX idx_follow_date (follow_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS biz_clue_opportunity_review (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    clue_id BIGINT NOT NULL,
    reviewer_id BIGINT,
    conclusion VARCHAR(8),
    opinion TEXT,
    reject_reason TEXT,
    supplement_items TEXT,
    opportunity_code VARCHAR(20),
    opportunity_level VARCHAR(4),
    pipeline_id BIGINT,
    expected_duration INT,
    create_by BIGINT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_by BIGINT,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted INT DEFAULT 0,
    INDEX idx_clue_id (clue_id),
    UNIQUE INDEX uk_opportunity_code (opportunity_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS biz_clue_resource (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    clue_id BIGINT NOT NULL,
    resource_type VARCHAR(32) NOT NULL,
    applicant_id BIGINT,
    status VARCHAR(16) DEFAULT 'PENDING',
    apply_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    effect_notes TEXT,
    create_by BIGINT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_by BIGINT,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted INT DEFAULT 0,
    INDEX idx_clue_id (clue_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS biz_iron_triangle_task (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    clue_id BIGINT NOT NULL,
    role VARCHAR(8) NOT NULL,
    assignee_id BIGINT,
    collaborator_ids VARCHAR(256),
    task_title VARCHAR(256) NOT NULL,
    status VARCHAR(16) DEFAULT 'TODO',
    deadline DATE,
    deliverable TEXT,
    sync_conclusion TEXT,
    discussion_notes TEXT,
    create_by BIGINT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_by BIGINT,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted INT DEFAULT 0,
    INDEX idx_clue_id (clue_id),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS biz_clue_solution (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    clue_id BIGINT NOT NULL,
    solution_type VARCHAR(32) NOT NULL,
    title VARCHAR(256) NOT NULL,
    description TEXT,
    product_levels VARCHAR(64),
    file_name VARCHAR(256),
    file_url VARCHAR(512),
    file_size BIGINT,
    version INT DEFAULT 1,
    is_current TINYINT DEFAULT 1,
    is_pool TINYINT DEFAULT 0,
    create_by BIGINT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_by BIGINT,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted INT DEFAULT 0,
    INDEX idx_clue_id (clue_id),
    INDEX idx_solution_type (solution_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS biz_clue_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    clue_id BIGINT NOT NULL,
    action_type VARCHAR(32) NOT NULL,
    action_summary VARCHAR(512),
    detail_json TEXT,
    operator_id BIGINT,
    operator_name VARCHAR(64),
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_clue_id (clue_id),
    INDEX idx_action_type (action_type),
    INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS biz_clue_file (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    clue_id BIGINT NOT NULL,
    file_type VARCHAR(32) NOT NULL,
    file_name VARCHAR(256) NOT NULL,
    file_url VARCHAR(512) NOT NULL,
    file_size BIGINT,
    file_ext VARCHAR(16),
    mime_type VARCHAR(128),
    is_pool TINYINT DEFAULT 0,
    description VARCHAR(512),
    create_by BIGINT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_by BIGINT,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted INT DEFAULT 0,
    INDEX idx_clue_id (clue_id),
    INDEX idx_file_type (file_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS biz_risk (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT,
    type VARCHAR(128),
    level VARCHAR(16) NOT NULL DEFAULT 'medium',
    description TEXT,
    solution TEXT,
    owner VARCHAR(64),
    status VARCHAR(16) NOT NULL DEFAULT 'open',
    create_by BIGINT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_by BIGINT,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted INT DEFAULT 0,
    INDEX idx_project_id (project_id),
    INDEX idx_status (status),
    INDEX idx_level (level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS biz_talent (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    role VARCHAR(64),
    skills VARCHAR(512),
    current_project VARCHAR(256),
    utilization INT DEFAULT 0,
    status VARCHAR(16) NOT NULL DEFAULT 'normal',
    talent_type VARCHAR(16) DEFAULT 'internal',
    create_by BIGINT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_by BIGINT,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted INT DEFAULT 0,
    INDEX idx_name (name),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS biz_alert (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT,
    type VARCHAR(128),
    level VARCHAR(16) NOT NULL DEFAULT 'medium',
    description TEXT,
    manager VARCHAR(64),
    status VARCHAR(16) NOT NULL DEFAULT 'open',
    create_by BIGINT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_by BIGINT,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted INT DEFAULT 0,
    INDEX idx_project_id (project_id),
    INDEX idx_status (status),
    INDEX idx_level (level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS biz_attachment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    biz_type VARCHAR(32),
    biz_id BIGINT,
    file_name VARCHAR(256),
    file_type VARCHAR(64),
    file_size BIGINT,
    file_url VARCHAR(512),
    upload_user_id BIGINT,
    upload_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_deleted INT DEFAULT 0,
    INDEX idx_biz (biz_type, biz_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO sys_dept (id, name) VALUES
(1, '平台一部'), (2, '平台二部'), (3, '平台三部');

INSERT IGNORE INTO sys_role (id, name, code, sort, is_deleted) VALUES
(1, '超级管理员', 'ROLE_ADMIN', 1, 0),
(2, '部门经理', 'ROLE_MANAGER', 2, 0),
(3, '普通员工', 'ROLE_USER', 3, 0);

INSERT IGNORE INTO sys_permission (id, code, name, is_deleted) VALUES
(1, 'pipeline:list', '线索列表', 0),
(2, 'pipeline:create', '创建线索', 0),
(3, 'pipeline:edit', '编辑线索', 0),
(4, 'pipeline:delete', '删除线索', 0),
(5, 'pipeline:import', '导入线索', 0),
(6, 'pipeline:batch-delete', '批量删除', 0),
(7, 'pipeline:batch-modify', '批量修改', 0),
(8, 'recycle:list', '回收站访问', 0),
(10, 'clue:list', '线索列表', 0),
(11, 'clue:create', '新建线索', 0),
(12, 'clue:edit', '编辑线索', 0),
(13, 'clue:delete', '删除线索', 0),
(14, 'clue:batch', '批量删除', 0),
(15, 'clue:convert', '线索转项目', 0),
(20, 'project:list', '项目列表', 0),
(21, 'project:create', '新建项目', 0),
(22, 'project:edit', '编辑项目', 0),
(23, 'project:delete', '删除项目', 0),
(30, 'risk:list', '风险列表', 0),
(31, 'risk:create', '新增风险', 0),
(32, 'risk:edit', '编辑风险', 0),
(33, 'risk:delete', '删除风险', 0),
(40, 'talent:list', '人才列表', 0),
(41, 'talent:create', '新增人才', 0),
(42, 'talent:edit', '编辑人才', 0),
(43, 'talent:delete', '删除人才', 0),
(50, 'alert:list', '预警列表', 0),
(51, 'alert:create', '新增预警', 0),
(52, 'alert:edit', '编辑预警', 0),
(53, 'alert:delete', '删除预警', 0),
(90, 'system:role', '角色管理', 0),
(91, 'system:user:list', '用户列表', 0),
(92, 'system:user:create', '新增用户', 0),
(93, 'system:user:edit', '编辑用户', 0),
(94, 'system:user:delete', '删除用户', 0),
(95, 'system:user', '用户管理', 0),
(96, 'system:log', '操作日志', 0);

INSERT INTO sys_user (id, username, password, real_name, email, status, dept_id, role_type)
VALUES
(1, 'admin', '$2a$10$XF1Wu1LjJscsmLeXqOmLnuxdIyZzPPQ7xbDyIcP8rN7wcrlF1lse.', '管理员', 'admin@example.com', 1, 1, 'ADMIN')
ON DUPLICATE KEY UPDATE username = VALUES(username);

INSERT IGNORE INTO sys_user_role (user_id, role_id) VALUES (1, 1);
INSERT IGNORE INTO sys_role_permission (role_id, permission_id)
SELECT 1, id FROM sys_permission WHERE is_deleted = 0;
INSERT IGNORE INTO sys_role_permission (role_id, permission_id)
SELECT 2, id FROM sys_permission WHERE is_deleted = 0 AND id < 90;
INSERT IGNORE INTO sys_role_permission (role_id, permission_id)
SELECT 3, id FROM sys_permission WHERE is_deleted = 0 AND code LIKE '%:list';

INSERT IGNORE INTO biz_campaign (id, name, start_date, end_date, target_count, target_amount, status, description, priority, manager_name)
VALUES
(1, '7月线索攻坚沙箱战役', '2026-07-01', '2026-07-31', 30, 3000000, 'ACTIVE', '用于沙箱环境验证线索录入、评审、转商机、看板同步链路。', 'HIGH', '管理员');

INSERT IGNORE INTO biz_clue (
    id, clue_name, client_company, client_dept, client_contact, beike_owner,
    budget, budget_amount, clue_level, clue_status, review_status, business_confirmed,
    contact_date, create_date, requirement_desc, pain_point, expected_target,
    dept_belong, clue_number, campaign_id, source_type, source_activity_name,
    client_circle, industry, value_quadrant, maintenance_freq, next_maintenance_date,
    health_status, opportunity_amount, convert_status, create_by, update_by
) VALUES
(1, 'AI内容生产平台线索', '星河传媒', '数字化中心', '李总', '管理员',
 '100-300万', 180.00, 'A', '接触', '待评审', '否',
 '2026-07-02', '2026-07-02', '希望建设AI内容生产与审核工作台。', '内容生产周期长，审核分散。', '缩短内容制作周期并形成标准审核流程。',
 '平台一部', 'XS-202607-001', 1, '客户走访', '华东客户拜访',
 '第一圈层', '传媒', '核心', 7, '2026-07-09',
 'normal', 180.00, NULL, 1, 1),
(2, '达人矩阵运营线索', '云启消费', '市场部', '王经理', '管理员',
 '50-100万', 80.00, 'B', '沟通', '评审中', '是',
 '2026-07-03', '2026-07-03', '需要沉淀KOC达人矩阵和投放效果分析。', '达人资源分散，复盘口径不统一。', '统一达人资产管理和投放分析。',
 '平台一部', 'XS-202607-002', 1, '市场活动', '增长闭门会',
 '第二圈层', '消费品', '甜点', 14, '2026-07-17',
 'yellow', 80.00, NULL, 1, 1);

INSERT IGNORE INTO biz_clue_opportunity_review
(id, clue_id, reviewer_id, conclusion, opinion, opportunity_code, opportunity_level, expected_duration, create_by, update_by)
VALUES
(1, 2, 1, '待补充', '需要补充预算口径和关键决策人。', 'OP-202607-001', 'B', 45, 1, 1);

INSERT IGNORE INTO biz_pipeline
(id, name, customer, stage, amount, win_rate, owner_id, dept_id, is_sea, description, next_action, create_by, update_by)
VALUES
(1, 'AI内容生产平台商机', '星河传媒', 'lead', 180.00, 40, 1, 1, 0, '由沙箱线索样例生成的商机。', '确认需求范围和评审材料。', 1, 1),
(2, '品牌增长咨询商机', '云启消费', 'verify', 80.00, 55, 1, 1, 0, '用于验证线索看板阶段展示。', '安排二次沟通。', 1, 1);

INSERT IGNORE INTO biz_project
(id, project_name, client_name, project_manager, project_amount, project_status, progress, start_date, stage, project_level, dept_belong, source_clue_id, risk_count, description, create_by, update_by)
VALUES
(1, '沙箱示例项目', '星河传媒', '管理员', 180.00, '进行中', 35, '2026-07-05', '执行', 'A', '平台一部', 1, 1, '用于验证项目管理基础链路。', 1, 1);

INSERT IGNORE INTO biz_risk
(id, project_id, type, level, description, solution, owner, status, create_by, update_by)
VALUES
(1, 1, '需求边界', 'medium', '客户仍在补充内容审核边界。', '推动本周完成需求确认会。', '管理员', 'open', 1, 1);

INSERT IGNORE INTO biz_talent
(id, name, role, skills, current_project, utilization, status, create_by, update_by)
VALUES
(1, '陈晨', '解决方案顾问', 'AI内容,需求分析,方案设计', '沙箱示例项目', 65, 'normal', 1, 1);

INSERT IGNORE INTO biz_alert
(id, project_id, type, level, description, manager, status, create_by, update_by)
VALUES
(1, 1, '跟进提醒', 'medium', '线索健康度为黄灯，需要补齐评审材料。', '管理员', 'open', 1, 1);
