-- ============================================================
-- v1.3 升级脚本：线索作战体系（战役+商机评审+铁三角+资源协同）
-- 适用数据库：beike_platform
-- 执行顺序：在 v1.2-upgrade.sql 之后执行
-- ============================================================

-- 1. biz_campaign 战役表
CREATE TABLE IF NOT EXISTS biz_campaign (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '战役ID',
    name VARCHAR(128) NOT NULL COMMENT '战役名称',
    start_date DATE COMMENT '开始日期',
    end_date DATE COMMENT '结束日期',
    target_count INT DEFAULT 0 COMMENT '目标线索数',
    status VARCHAR(16) DEFAULT 'ACTIVE' COMMENT '状态(ACTIVE/COMPLETED/PAUSED)',
    create_by BIGINT COMMENT '创建人',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_by BIGINT COMMENT '更新人',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    is_deleted INT DEFAULT 0 COMMENT '逻辑删除(0正常/1已删)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='战役表';

-- 2. biz_clue 新增字段
ALTER TABLE biz_clue ADD COLUMN clue_number VARCHAR(20) DEFAULT NULL COMMENT '线索编号(XS-YYYYMM-NNN)';
ALTER TABLE biz_clue ADD COLUMN campaign_id BIGINT DEFAULT NULL COMMENT '所属战役ID';
ALTER TABLE biz_clue ADD COLUMN client_circle VARCHAR(16) DEFAULT NULL COMMENT '客户圈层(第一圈层/第二圈层/第三圈层/第四圈层)';
ALTER TABLE biz_clue ADD COLUMN health_status VARCHAR(8) DEFAULT 'normal' COMMENT '健康度(normal/yellow/red)';
ALTER TABLE biz_clue ADD COLUMN opportunity_amount DECIMAL(12,2) DEFAULT NULL COMMENT '预计商机金额';
ALTER TABLE biz_clue ADD COLUMN last_follow_time DATETIME DEFAULT NULL COMMENT '上次跟进时间';
ALTER TABLE biz_clue ADD COLUMN convert_status VARCHAR(16) DEFAULT NULL COMMENT '转化状态';
ALTER TABLE biz_clue ADD UNIQUE INDEX uk_clue_number (clue_number) COMMENT '线索编号唯一索引';
ALTER TABLE biz_clue ADD INDEX idx_campaign_id (campaign_id) COMMENT '战役索引';
ALTER TABLE biz_clue ADD INDEX idx_health_status (health_status) COMMENT '健康度索引';

-- 3. biz_clue_contact 客户决策人表
CREATE TABLE IF NOT EXISTS biz_clue_contact (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '决策人ID',
    clue_id BIGINT NOT NULL COMMENT '线索ID',
    name VARCHAR(64) NOT NULL COMMENT '决策人姓名',
    position VARCHAR(64) COMMENT '职位',
    level VARCHAR(8) DEFAULT '执行层' COMMENT '层级(决策层/管理层/执行层)',
    contact_info VARCHAR(128) COMMENT '联系方式',
    attitude VARCHAR(8) DEFAULT '中立' COMMENT '态度(支持/中立/反对)',
    remarks TEXT COMMENT '关键言论/备注',
    create_by BIGINT COMMENT '创建人',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_by BIGINT COMMENT '更新人',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    is_deleted INT DEFAULT 0 COMMENT '逻辑删除',
    INDEX idx_clue_id (clue_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='客户决策人表';

-- 4. biz_clue_opportunity_review 商机评审表
CREATE TABLE IF NOT EXISTS biz_clue_opportunity_review (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '评审ID',
    clue_id BIGINT NOT NULL COMMENT '线索ID',
    reviewer_id BIGINT COMMENT '评审人ID',
    conclusion VARCHAR(8) COMMENT '评审结论(通过/驳回/待补充)',
    opinion TEXT COMMENT '评审意见',
    opportunity_code VARCHAR(20) COMMENT '商机编号(OP-YYYYMM-NNN)',
    opportunity_level VARCHAR(4) COMMENT '商机等级(S/A/B/C)',
    expected_duration INT COMMENT '预计成交周期(天)',
    create_by BIGINT COMMENT '创建人',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_by BIGINT COMMENT '更新人',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    is_deleted INT DEFAULT 0 COMMENT '逻辑删除',
    INDEX idx_clue_id (clue_id),
    UNIQUE INDEX uk_opportunity_code (opportunity_code) COMMENT '商机编号唯一'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商机评审表';

-- 5. biz_clue_resource 资源协同表
CREATE TABLE IF NOT EXISTS biz_clue_resource (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '资源ID',
    clue_id BIGINT NOT NULL COMMENT '线索ID',
    resource_type VARCHAR(32) NOT NULL COMMENT '资源类型',
    applicant_id BIGINT COMMENT '申请人ID',
    status VARCHAR(16) DEFAULT 'PENDING' COMMENT '状态(PENDING/APPROVED/REJECTED/COMPLETED)',
    apply_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '申请时间',
    effect_notes TEXT COMMENT '使用效果说明',
    create_by BIGINT COMMENT '创建人',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_by BIGINT COMMENT '更新人',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    is_deleted INT DEFAULT 0 COMMENT '逻辑删除',
    INDEX idx_clue_id (clue_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资源协同表';

-- 6. biz_iron_triangle_task 铁三角任务表
CREATE TABLE IF NOT EXISTS biz_iron_triangle_task (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '任务ID',
    clue_id BIGINT NOT NULL COMMENT '线索ID',
    role VARCHAR(8) NOT NULL COMMENT '角色(AR/SR/FR)',
    assignee_id BIGINT COMMENT '负责人ID',
    task_title VARCHAR(256) NOT NULL COMMENT '任务标题',
    status VARCHAR(16) DEFAULT 'TODO' COMMENT '状态(TODO/DOING/DONE)',
    deadline DATE COMMENT '截止日期',
    deliverable TEXT COMMENT '交付物描述',
    create_by BIGINT COMMENT '创建人',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_by BIGINT COMMENT '更新人',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    is_deleted INT DEFAULT 0 COMMENT '逻辑删除',
    INDEX idx_clue_id (clue_id),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='铁三角任务表';
