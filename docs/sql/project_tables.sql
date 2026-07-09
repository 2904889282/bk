-- 项目周报表（小康每周更新的内容）
CREATE TABLE IF NOT EXISTS biz_project_weekly (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL COMMENT '项目ID',
    period_month VARCHAR(7) NOT NULL COMMENT '归属月份(YYYY-MM)',
    week_number INT NOT NULL COMMENT '第几周(1-5)',
    completed_work TEXT COMMENT '本周完成了什么',
    weekly_metrics JSON COMMENT '本周数据指标(JSON)',
    issues TEXT COMMENT '遇到的问题',
    issue_severity VARCHAR(16) DEFAULT 'normal' COMMENT '问题紧急程度: normal/warning/critical',
    next_week_plan TEXT COMMENT '下周计划',
    create_by BIGINT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_by BIGINT,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted INT DEFAULT 0,
    INDEX idx_project_id (project_id),
    INDEX idx_month_week (project_id, period_month, week_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 项目里程碑
CREATE TABLE IF NOT EXISTS biz_project_milestone (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL,
    stage VARCHAR(64) COMMENT '项目阶段',
    milestone VARCHAR(256) COMMENT '里程碑计划',
    planned_date DATE COMMENT '计划日期',
    actual_date DATE COMMENT '实际日期',
    status VARCHAR(16) DEFAULT 'pending' COMMENT 'pending/in_progress/completed/delayed',
    sort_order INT DEFAULT 0,
    create_by BIGINT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_by BIGINT,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted INT DEFAULT 0,
    INDEX idx_project_id (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 项目团队
CREATE TABLE IF NOT EXISTS biz_project_team (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL,
    name VARCHAR(64) NOT NULL COMMENT '姓名',
    dept VARCHAR(64) COMMENT '部门',
    role VARCHAR(64) COMMENT '职务',
    responsibility VARCHAR(8) COMMENT 'R负责/As辅助/I通知/Ap审批',
    sort_order INT DEFAULT 0,
    create_by BIGINT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_by BIGINT,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted INT DEFAULT 0,
    INDEX idx_project_id (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 项目WBS工作分解
CREATE TABLE IF NOT EXISTS biz_project_wbs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL,
    code VARCHAR(16) COMMENT '分解代码(如1.1)',
    task_name VARCHAR(256) COMMENT '任务名称',
    activities TEXT COMMENT '包含活动',
    work_hours DECIMAL(10,1) COMMENT '工时估算',
    human_resources VARCHAR(256) COMMENT '人力资源',
    other_resources VARCHAR(256) COMMENT '其他资源',
    cost_estimate DECIMAL(14,2) COMMENT '费用估算',
    start_date DATE COMMENT '开始时间',
    end_date DATE COMMENT '结束时间',
    deliverable VARCHAR(256) COMMENT '交付件',
    assignees JSON COMMENT '人员分配(JSON: {姓名: R/As/I/Ap})',
    status VARCHAR(16) DEFAULT 'pending' COMMENT 'pending/in_progress/completed',
    sort_order INT DEFAULT 0,
    create_by BIGINT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_by BIGINT,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted INT DEFAULT 0,
    INDEX idx_project_id (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 项目变更记录
CREATE TABLE IF NOT EXISTS biz_project_change (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL,
    change_date DATE COMMENT '变更时间',
    affected_task VARCHAR(256) COMMENT '涉及项目任务',
    change_summary TEXT COMMENT '变更要点',
    change_reason TEXT COMMENT '变更理由',
    applicant VARCHAR(64) COMMENT '申请人',
    approver VARCHAR(64) COMMENT '审批人',
    impact_analysis TEXT COMMENT '影响分析',
    status VARCHAR(16) DEFAULT 'pending' COMMENT 'pending/approved/rejected',
    create_by BIGINT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_by BIGINT,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted INT DEFAULT 0,
    INDEX idx_project_id (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
