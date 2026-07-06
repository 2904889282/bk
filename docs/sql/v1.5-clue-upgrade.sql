-- ============================================================
-- v1.5 升级脚本：线索攻坚战体系完整升级
-- 适用数据库：beike_platform
-- 执行顺序：在 v1.4-upgrade.sql 之后执行
-- 设计依据：战略督战纪要——线索管理规则、战役化机制、客户分层、LTC流程
-- ============================================================

-- ==========================================
-- 1. biz_campaign 战役表增强
-- ==========================================
ALTER TABLE biz_campaign ADD COLUMN target_amount DECIMAL(14,2) DEFAULT 0 COMMENT '目标金额(元)' AFTER target_count;
ALTER TABLE biz_campaign ADD COLUMN description TEXT COMMENT '战役描述/目标要求' AFTER status;
ALTER TABLE biz_campaign ADD COLUMN priority VARCHAR(8) DEFAULT 'NORMAL' COMMENT '优先级(HIGH/NORMAL)' AFTER description;
ALTER TABLE biz_campaign ADD COLUMN manager_name VARCHAR(64) COMMENT '战役负责人' AFTER priority;

-- ==========================================
-- 2. biz_clue 线索主表增强（补齐纪要要求字段）
-- ==========================================
ALTER TABLE biz_clue ADD COLUMN source_type VARCHAR(32) COMMENT '线索来源(产品发布会/技术交流会/客户走访/市场活动/其他)' AFTER campaign_id;
ALTER TABLE biz_clue ADD COLUMN source_activity_name VARCHAR(128) COMMENT '来源活动名称' AFTER source_type;
ALTER TABLE biz_clue ADD COLUMN industry VARCHAR(32) COMMENT '客户所属行业' AFTER client_circle;
ALTER TABLE biz_clue ADD COLUMN value_quadrant VARCHAR(8) COMMENT '价值象限(核心/甜点/成长/淘汰)' AFTER industry;
ALTER TABLE biz_clue ADD COLUMN maintenance_freq INT DEFAULT 30 COMMENT '维护频率(天)' AFTER value_quadrant;
ALTER TABLE biz_clue ADD COLUMN next_maintenance_date DATE COMMENT '下次维护时间' AFTER maintenance_freq;
ALTER TABLE biz_clue ADD COLUMN maintenance_methods VARCHAR(128) COMMENT '维护方式(多个逗号分隔)' AFTER next_maintenance_date;
ALTER TABLE biz_clue ADD COLUMN pain_point TEXT COMMENT '客户痛点' AFTER requirement_desc;
ALTER TABLE biz_clue ADD COLUMN expected_target TEXT COMMENT '预期目标' AFTER pain_point;
ALTER TABLE biz_clue ADD COLUMN budget_amount DECIMAL(12,2) COMMENT '预算范围(万)' AFTER budget;
ALTER TABLE biz_clue ADD COLUMN matched_products VARCHAR(256) COMMENT '匹配产品(逗号分隔S/A/B/C级别产品)' AFTER expected_target;
ALTER TABLE biz_clue ADD COLUMN recommended_products TEXT COMMENT '推荐核心产品组合方案' AFTER matched_products;

-- ==========================================
-- 3. biz_clue_contact 客户决策人表增强
-- ==========================================
ALTER TABLE biz_clue_contact ADD COLUMN influence_weight INT DEFAULT 1 COMMENT '影响力权重(1-5)' AFTER attitude;
ALTER TABLE biz_clue_contact ADD COLUMN interaction_records TEXT COMMENT '对接记录(JSON格式，时间+内容)' AFTER remarks;
ALTER TABLE biz_clue_contact ADD COLUMN personal_focus TEXT COMMENT '个人关注点' AFTER interaction_records;
ALTER TABLE biz_clue_contact ADD COLUMN relations VARCHAR(256) COMMENT '关系标注(关联其他决策人ID+关系描述)' AFTER personal_focus;

-- ==========================================
-- 4. biz_clue_follow 跟进记录表增强
-- ==========================================
ALTER TABLE biz_clue_follow ADD COLUMN contact_person VARCHAR(64) COMMENT '对接人姓名' AFTER follow_type;
ALTER TABLE biz_clue_follow ADD COLUMN weekly_review_notes TEXT COMMENT '周度评审指导意见' AFTER next_plan;
ALTER TABLE biz_clue_follow ADD COLUMN attachment_urls TEXT COMMENT '附件URL(JSON数组)' AFTER weekly_review_notes;

-- ==========================================
-- 5. biz_clue_opportunity_review 商机评审表增强
-- ==========================================
ALTER TABLE biz_clue_opportunity_review ADD COLUMN reject_reason TEXT COMMENT '驳回原因' AFTER opinion;
ALTER TABLE biz_clue_opportunity_review ADD COLUMN supplement_items TEXT COMMENT '待补充内容清单(JSON)' AFTER reject_reason;
ALTER TABLE biz_clue_opportunity_review ADD COLUMN pipeline_id BIGINT COMMENT '关联商机ID' AFTER opportunity_level;

-- ==========================================
-- 6. 新建 biz_clue_solution 方案库表
-- ==========================================
CREATE TABLE IF NOT EXISTS biz_clue_solution (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '方案ID',
    clue_id BIGINT NOT NULL COMMENT '线索ID',
    solution_type VARCHAR(32) NOT NULL COMMENT '方案类型(需求调研/方案文档/报价方案/竞品分析/演示材料/其他)',
    title VARCHAR(256) NOT NULL COMMENT '方案标题',
    description TEXT COMMENT '方案说明',
    product_levels VARCHAR(64) COMMENT '匹配产品等级(S/A/B/C逗号分隔)',
    file_name VARCHAR(256) COMMENT '文件名',
    file_url VARCHAR(512) COMMENT '文件URL',
    file_size BIGINT COMMENT '文件大小(字节)',
    version INT DEFAULT 1 COMMENT '版本号',
    is_current TINYINT DEFAULT 1 COMMENT '是否当前版本',
    is_pool TINYINT DEFAULT 0 COMMENT '是否沉淀至全局资料库',
    create_by BIGINT COMMENT '创建人',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_by BIGINT COMMENT '更新人',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    is_deleted INT DEFAULT 0 COMMENT '逻辑删除',
    INDEX idx_clue_id (clue_id),
    INDEX idx_solution_type (solution_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='方案库表';

-- ==========================================
-- 7. 新建 biz_clue_log 操作日志表
-- ==========================================
CREATE TABLE IF NOT EXISTS biz_clue_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '日志ID',
    clue_id BIGINT NOT NULL COMMENT '线索ID',
    action_type VARCHAR(32) NOT NULL COMMENT '操作类型(创建/编辑/状态变更/跟进记录/商机评审/转商机/转项目/资料上传/资料删除/决策人变更/战役变更/批量操作/删除/恢复)',
    action_summary VARCHAR(512) COMMENT '变更摘要',
    detail_json TEXT COMMENT '变更详情(JSON)',
    operator_id BIGINT COMMENT '操作人ID',
    operator_name VARCHAR(64) COMMENT '操作人姓名',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    PRIMARY KEY (id),
    INDEX idx_clue_id (clue_id),
    INDEX idx_action_type (action_type),
    INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志表';

-- ==========================================
-- 8. 新建 biz_clue_file 资料库表
-- ==========================================
CREATE TABLE IF NOT EXISTS biz_clue_file (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '文件ID',
    clue_id BIGINT NOT NULL COMMENT '线索ID',
    file_type VARCHAR(32) NOT NULL COMMENT '文件分类(需求调研/方案文档/报价资料/竞品分析/会议纪要/客户提供资料/其他)',
    file_name VARCHAR(256) NOT NULL COMMENT '文件名',
    file_url VARCHAR(512) NOT NULL COMMENT '文件存储URL',
    file_size BIGINT COMMENT '文件大小(字节)',
    file_ext VARCHAR(16) COMMENT '文件扩展名',
    mime_type VARCHAR(128) COMMENT 'MIME类型',
    is_pool TINYINT DEFAULT 0 COMMENT '是否沉淀至全局资料库',
    description VARCHAR(512) COMMENT '文件描述',
    create_by BIGINT COMMENT '创建人',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
    update_by BIGINT COMMENT '更新人',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    is_deleted INT DEFAULT 0 COMMENT '逻辑删除',
    INDEX idx_clue_id (clue_id),
    INDEX idx_file_type (file_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资料库表';

-- ==========================================
-- 9. biz_iron_triangle_task 铁三角任务表增强
-- ==========================================
ALTER TABLE biz_iron_triangle_task ADD COLUMN collaborator_ids VARCHAR(256) COMMENT '协作人ID列表' AFTER assignee_id;
ALTER TABLE biz_iron_triangle_task ADD COLUMN sync_conclusion TEXT COMMENT '同步结论' AFTER deliverable;
ALTER TABLE biz_iron_triangle_task ADD COLUMN discussion_notes TEXT COMMENT '沟通记录' AFTER sync_conclusion;

-- ==========================================
-- 10. 初始化一条战役数据（演示用）
-- ==========================================
INSERT INTO biz_campaign (name, start_date, end_date, target_count, target_amount, status, description, priority, manager_name)
VALUES ('5-6月线索攻坚战', '2025-05-01', '2025-06-30', 100, 50000000, 'ACTIVE', '集中进攻传统大厂和AI大厂，以AI内容生产和KOC达人矩阵为核心产品线，目标新增100条有效线索，商机转化率不低于30%', 'HIGH', '张明')
ON DUPLICATE KEY UPDATE name=name;
