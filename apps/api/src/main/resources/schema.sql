-- ============================================================
-- 贝壳统一管理平台 · 完整数据库建表脚本 v2.0
-- 每次启动自动执行（IF NOT EXISTS 保证幂等）
-- ============================================================

-- ==========================================
-- 1. 系统底座（sys_user + RBAC）
-- ==========================================
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

CREATE TABLE IF NOT EXISTS sys_dept (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(64) NOT NULL COMMENT '组/部门名称',
    is_deleted INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sys_operation_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    user_name VARCHAR(64),
    module VARCHAR(64),
    action VARCHAR(64),
    target_id BIGINT,
    detail VARCHAR(512),
    ip VARCHAR(64),
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- 2. 商机管线（biz_pipeline + 成员）
-- ==========================================
CREATE TABLE IF NOT EXISTS biz_pipeline (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(128) NOT NULL COMMENT '商机名称',
    customer VARCHAR(128) COMMENT '客户名称',
    stage VARCHAR(32) NOT NULL DEFAULT 'lead' COMMENT '阶段(lead/verify/opportunity/contract/delivery/cash/closed_lost)',
    amount DECIMAL(12,2) DEFAULT 0 COMMENT '预计金额',
    win_rate INT DEFAULT 0 COMMENT '赢率(0-100)',
    owner_id BIGINT NOT NULL COMMENT '负责人ID',
    dept_id BIGINT NOT NULL COMMENT '负责人所属部门ID',
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS biz_pipeline_member (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    pipeline_id BIGINT NOT NULL COMMENT '商机ID',
    user_id BIGINT NOT NULL COMMENT '团队成员ID',
    role VARCHAR(32) DEFAULT '' COMMENT '在项目中的角色',
    INDEX idx_pipeline (pipeline_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- 3. 线索体系（biz_clue + 关联表）
-- ==========================================
CREATE TABLE IF NOT EXISTS biz_campaign (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(128) NOT NULL COMMENT '战役名称',
    start_date DATE,
    end_date DATE,
    target_count INT DEFAULT 0 COMMENT '目标线索数',
    target_amount DECIMAL(14,2) DEFAULT 0 COMMENT '目标金额(元)',
    status VARCHAR(16) DEFAULT 'ACTIVE' COMMENT 'ACTIVE/COMPLETED/PAUSED',
    description TEXT,
    priority VARCHAR(8) DEFAULT 'NORMAL' COMMENT 'HIGH/NORMAL',
    manager_name VARCHAR(64),
    create_by BIGINT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_by BIGINT,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS biz_clue (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    clue_name VARCHAR(256) NOT NULL COMMENT '线索名称',
    clue_number VARCHAR(20) COMMENT '线索编号(XS-YYYYMM-NNN)',
    client_company VARCHAR(256) COMMENT '甲方公司',
    client_dept VARCHAR(128) COMMENT '甲方部门',
    client_contact VARCHAR(64) COMMENT '甲方对接人',
    beike_owner VARCHAR(64) COMMENT '承接人',
    budget VARCHAR(32) COMMENT '预算量级',
    budget_amount DECIMAL(12,2) COMMENT '预算范围(万)',
    clue_level VARCHAR(16) COMMENT '线索等级(S/A/B/C)',
    clue_status VARCHAR(32) COMMENT '线索状态',
    review_status VARCHAR(16) COMMENT '评审状态',
    business_confirmed VARCHAR(8) COMMENT '商务确认',
    contact_date DATE COMMENT '首次接触日期',
    proposal_date DATE COMMENT '提案日期',
    create_date DATE COMMENT '创建日期',
    requirement_desc TEXT COMMENT '需求描述',
    pain_point TEXT COMMENT '客户痛点',
    expected_target TEXT COMMENT '预期目标',
    matched_products VARCHAR(256) COMMENT '匹配产品',
    recommended_products TEXT COMMENT '推荐核心产品',
    clue_evaluation TEXT COMMENT '线索评估',
    remark TEXT COMMENT '备注',
    dept_belong VARCHAR(64) COMMENT '承接部门',
    campaign_id BIGINT COMMENT '所属战役ID',
    source_type VARCHAR(32) COMMENT '线索来源',
    source_activity_name VARCHAR(128) COMMENT '来源活动名称',
    client_circle VARCHAR(16) COMMENT '客户圈层',
    industry VARCHAR(32) COMMENT '客户所属行业',
    value_quadrant VARCHAR(8) COMMENT '价值象限(核心/甜点/成长/淘汰)',
    maintenance_freq INT DEFAULT 30 COMMENT '维护频率(天)',
    next_maintenance_date DATE COMMENT '下次维护时间',
    maintenance_methods VARCHAR(128) COMMENT '维护方式',
    health_status VARCHAR(8) DEFAULT 'normal' COMMENT '健康度(normal/yellow/red)',
    opportunity_amount DECIMAL(12,2) COMMENT '预计商机金额',
    last_follow_time DATETIME COMMENT '上次跟进时间',
    convert_status VARCHAR(16) COMMENT '转化状态',
    ar_user_id BIGINT COMMENT 'AR负责人ID',
    sr_user_id BIGINT COMMENT 'SR负责人ID',
    fr_user_id BIGINT COMMENT 'FR负责人ID',
    comm_record1 TEXT COMMENT '沟通记录1',
    comm_record2 TEXT COMMENT '沟通记录2',
    comm_record3 TEXT COMMENT '沟通记录3',
    comm_record4 TEXT COMMENT '沟通记录4',
    relation1 VARCHAR(128) COMMENT '关系标注1',
    relation2 VARCHAR(128) COMMENT '关系标注2',
    relation3 VARCHAR(128) COMMENT '关系标注3',
    related_project_id BIGINT COMMENT '关联项目ID',
    converted_opportunity_id BIGINT COMMENT '已转换商机ID',
    is_converted INT DEFAULT 0 COMMENT '是否已转项目',
    create_by BIGINT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_by BIGINT,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted INT DEFAULT 0,
    UNIQUE INDEX uk_clue_number (clue_number),
    INDEX idx_campaign_id (campaign_id),
    INDEX idx_health_status (health_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS biz_clue_follow (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    clue_id BIGINT NOT NULL COMMENT '线索ID',
    follow_type VARCHAR(32) COMMENT '跟进类型',
    follow_date DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '跟进日期',
    follow_user_id BIGINT COMMENT '跟进人ID',
    follow_user_name VARCHAR(64) COMMENT '跟进人姓名',
    contact_person VARCHAR(64) COMMENT '对接人姓名',
    core_conclusion TEXT COMMENT '核心结论',
    detail_content TEXT COMMENT '详细内容',
    next_plan TEXT COMMENT '下一步计划',
    next_deadline DATE COMMENT '下次跟进截止',
    weekly_review_notes TEXT COMMENT '周度评审指导意见',
    attachment_urls TEXT COMMENT '附件URL',
    new_status VARCHAR(32) COMMENT '同步变更的状态',
    status_change_reason VARCHAR(256) COMMENT '状态变更原因',
    create_by BIGINT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_by BIGINT,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted INT DEFAULT 0,
    INDEX idx_clue_id (clue_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS biz_clue_contact (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    clue_id BIGINT NOT NULL COMMENT '线索ID',
    name VARCHAR(64) NOT NULL COMMENT '决策人姓名',
    position VARCHAR(64) COMMENT '职位',
    level VARCHAR(8) DEFAULT '执行层' COMMENT '决策层/管理层/执行层',
    contact_info VARCHAR(128) COMMENT '联系方式',
    attitude VARCHAR(8) DEFAULT '中立' COMMENT '支持/中立/反对',
    influence_weight INT DEFAULT 1 COMMENT '影响力权重(1-5)',
    remarks TEXT COMMENT '关键言论/备注',
    interaction_records TEXT COMMENT '对接记录',
    personal_focus TEXT COMMENT '个人关注点',
    relations VARCHAR(256) COMMENT '关系标注',
    create_by BIGINT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_by BIGINT,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted INT DEFAULT 0,
    INDEX idx_clue_id (clue_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS biz_clue_opportunity_review (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    clue_id BIGINT NOT NULL COMMENT '线索ID',
    reviewer_id BIGINT COMMENT '评审人ID',
    conclusion VARCHAR(8) COMMENT '通过/驳回/待补充',
    opinion TEXT COMMENT '评审意见',
    reject_reason TEXT COMMENT '驳回原因',
    supplement_items TEXT COMMENT '待补充内容',
    opportunity_code VARCHAR(20) COMMENT '商机编号',
    opportunity_level VARCHAR(4) COMMENT '商机等级(S/A/B/C)',
    pipeline_id BIGINT COMMENT '关联商机ID',
    expected_duration INT COMMENT '预计成交周期(天)',
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
    clue_id BIGINT NOT NULL COMMENT '线索ID',
    resource_type VARCHAR(32) NOT NULL COMMENT '资源类型',
    applicant_id BIGINT COMMENT '申请人ID',
    status VARCHAR(16) DEFAULT 'PENDING' COMMENT 'PENDING/APPROVED/REJECTED/COMPLETED',
    apply_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    effect_notes TEXT COMMENT '使用效果说明',
    create_by BIGINT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_by BIGINT,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted INT DEFAULT 0,
    INDEX idx_clue_id (clue_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS biz_iron_triangle_task (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    clue_id BIGINT NOT NULL COMMENT '线索ID',
    role VARCHAR(8) NOT NULL COMMENT 'AR/SR/FR',
    assignee_id BIGINT COMMENT '负责人ID',
    collaborator_ids VARCHAR(256) COMMENT '协作人ID列表',
    task_title VARCHAR(256) NOT NULL COMMENT '任务标题',
    status VARCHAR(16) DEFAULT 'TODO' COMMENT 'TODO/DOING/DONE',
    deadline DATE COMMENT '截止日期',
    deliverable TEXT COMMENT '交付物描述',
    sync_conclusion TEXT COMMENT '同步结论',
    discussion_notes TEXT COMMENT '沟通记录',
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
    clue_id BIGINT NOT NULL COMMENT '线索ID',
    solution_type VARCHAR(32) NOT NULL COMMENT '方案类型',
    title VARCHAR(256) NOT NULL COMMENT '方案标题',
    description TEXT COMMENT '方案说明',
    product_levels VARCHAR(64) COMMENT '匹配产品等级',
    file_name VARCHAR(256) COMMENT '文件名',
    file_url VARCHAR(512) COMMENT '文件URL',
    file_size BIGINT COMMENT '文件大小',
    version INT DEFAULT 1 COMMENT '版本号',
    is_current TINYINT DEFAULT 1 COMMENT '是否当前版本',
    is_pool TINYINT DEFAULT 0 COMMENT '是否沉淀至全局资料库',
    create_by BIGINT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_by BIGINT,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted INT DEFAULT 0,
    INDEX idx_clue_id (clue_id),
    INDEX idx_solution_type (solution_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS biz_clue_file (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    clue_id BIGINT NOT NULL COMMENT '线索ID',
    file_type VARCHAR(32) NOT NULL COMMENT '文件分类',
    file_name VARCHAR(256) NOT NULL COMMENT '文件名',
    file_url VARCHAR(512) NOT NULL COMMENT '文件存储URL',
    file_size BIGINT COMMENT '文件大小',
    file_ext VARCHAR(16) COMMENT '文件扩展名',
    mime_type VARCHAR(128) COMMENT 'MIME类型',
    is_pool TINYINT DEFAULT 0 COMMENT '是否沉淀至全局资料库',
    description VARCHAR(512) COMMENT '文件描述',
    create_by BIGINT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_by BIGINT,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted INT DEFAULT 0,
    INDEX idx_clue_id (clue_id),
    INDEX idx_file_type (file_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS biz_clue_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    clue_id BIGINT NOT NULL COMMENT '线索ID',
    action_type VARCHAR(32) NOT NULL COMMENT '操作类型',
    action_summary VARCHAR(512) COMMENT '变更摘要',
    detail_json TEXT COMMENT '变更详情(JSON)',
    operator_id BIGINT COMMENT '操作人ID',
    operator_name VARCHAR(64) COMMENT '操作人姓名',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_clue_id (clue_id),
    INDEX idx_action_type (action_type),
    INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- 4. 项目管理（biz_project + 关联）
-- ==========================================
CREATE TABLE IF NOT EXISTS biz_project (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_name VARCHAR(256) NOT NULL COMMENT '项目名称',
    client_name VARCHAR(256) COMMENT '甲方公司',
    client_contact VARCHAR(64) COMMENT '甲方对接人',
    project_manager VARCHAR(64) COMMENT '项目经理',
    project_amount DECIMAL(14,2) DEFAULT 0 COMMENT '项目金额',
    project_level VARCHAR(16) DEFAULT 'B' COMMENT '项目等级(S/A/B/C)',
    project_status VARCHAR(32) DEFAULT '进行中' COMMENT '项目状态',
    dept_belong VARCHAR(64) COMMENT '承接部门',
    start_date DATE COMMENT '开始日期',
    expect_end_date DATE COMMENT '预计结束日期',
    actual_end_date DATE COMMENT '实际结束日期',
    progress INT DEFAULT 0 COMMENT '进度(0-100)',
    source_clue_id BIGINT COMMENT '来源线索ID',
    ar_user_id BIGINT COMMENT 'AR负责人ID',
    sr_user_id BIGINT COMMENT 'SR负责人ID',
    fr_user_id BIGINT COMMENT 'FR负责人ID',
    remark TEXT COMMENT '备注',
    stage VARCHAR(32) COMMENT '阶段',
    description TEXT COMMENT '描述',
    create_by BIGINT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_by BIGINT,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS biz_attachment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    biz_type VARCHAR(32) COMMENT '业务类型(clue/project/follow/risk)',
    biz_id BIGINT COMMENT '业务ID',
    file_name VARCHAR(256) COMMENT '文件名',
    file_type VARCHAR(32) COMMENT '文档/图片/音频/其他',
    file_size BIGINT COMMENT '文件大小',
    file_url VARCHAR(512) COMMENT '文件URL',
    upload_user_id BIGINT COMMENT '上传人ID',
    upload_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_deleted INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS biz_risk (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT COMMENT '关联项目ID',
    type VARCHAR(128) COMMENT '风险项',
    `level` VARCHAR(16) NOT NULL DEFAULT 'medium' COMMENT 'high/medium/low',
    description TEXT COMMENT '风险描述',
    solution TEXT COMMENT '应对措施',
    owner VARCHAR(64) COMMENT '负责人',
    status VARCHAR(16) NOT NULL DEFAULT 'open' COMMENT 'open/resolved',
    create_by BIGINT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_by BIGINT,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted INT DEFAULT 0,
    INDEX idx_project_id (project_id),
    INDEX idx_status (status),
    INDEX idx_level (`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS biz_talent (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(64) NOT NULL COMMENT '姓名',
    role VARCHAR(64) COMMENT '角色',
    skills VARCHAR(512) COMMENT '技能标签',
    current_project VARCHAR(256) COMMENT '当前项目',
    utilization INT DEFAULT 0 COMMENT '利用率(%)',
    status VARCHAR(16) NOT NULL DEFAULT 'normal' COMMENT 'normal/high/overload/idle',
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
    project_id BIGINT COMMENT '关联项目ID',
    type VARCHAR(128) COMMENT '预警类型',
    `level` VARCHAR(16) NOT NULL DEFAULT 'medium' COMMENT 'high/medium',
    description TEXT COMMENT '问题描述',
    manager VARCHAR(64) COMMENT '负责人',
    status VARCHAR(16) NOT NULL DEFAULT 'open' COMMENT 'open/resolved',
    create_by BIGINT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_by BIGINT,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted INT DEFAULT 0,
    INDEX idx_project_id (project_id),
    INDEX idx_status (status),
    INDEX idx_level (`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
