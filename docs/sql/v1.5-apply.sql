-- v1.5 升级 — 安全补字段（仅添加不存在的列）
-- 用法：mysql -u root -proot beike_platform < v1.5-apply.sql

-- biz_campaign 增强
SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE biz_campaign ADD COLUMN target_amount DECIMAL(14,2) DEFAULT 0 COMMENT ''目标金额(元)'' AFTER target_count',
  'SELECT ''SKIP: target_amount''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='beike_platform' AND TABLE_NAME='biz_campaign' AND COLUMN_NAME='target_amount');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE biz_campaign ADD COLUMN description TEXT COMMENT ''战役描述'' AFTER status',
  'SELECT ''SKIP: description''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='beike_platform' AND TABLE_NAME='biz_campaign' AND COLUMN_NAME='description');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE biz_campaign ADD COLUMN priority VARCHAR(8) DEFAULT ''NORMAL'' COMMENT ''优先级'' AFTER description',
  'SELECT ''SKIP: priority''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='beike_platform' AND TABLE_NAME='biz_campaign' AND COLUMN_NAME='priority');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE biz_campaign ADD COLUMN manager_name VARCHAR(64) COMMENT ''战役负责人'' AFTER priority',
  'SELECT ''SKIP: manager_name''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='beike_platform' AND TABLE_NAME='biz_campaign' AND COLUMN_NAME='manager_name');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- biz_clue 12个新字段
SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE biz_clue ADD COLUMN source_type VARCHAR(32) COMMENT ''线索来源'' AFTER campaign_id',
  'SELECT ''SKIP: source_type''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='beike_platform' AND TABLE_NAME='biz_clue' AND COLUMN_NAME='source_type');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE biz_clue ADD COLUMN source_activity_name VARCHAR(128) COMMENT ''来源活动名称'' AFTER source_type',
  'SELECT ''SKIP: source_activity_name''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='beike_platform' AND TABLE_NAME='biz_clue' AND COLUMN_NAME='source_activity_name');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE biz_clue ADD COLUMN pain_point TEXT COMMENT ''客户痛点'' AFTER requirement_desc',
  'SELECT ''SKIP: pain_point''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='beike_platform' AND TABLE_NAME='biz_clue' AND COLUMN_NAME='pain_point');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE biz_clue ADD COLUMN expected_target TEXT COMMENT ''预期目标'' AFTER pain_point',
  'SELECT ''SKIP: expected_target''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='beike_platform' AND TABLE_NAME='biz_clue' AND COLUMN_NAME='expected_target');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE biz_clue ADD COLUMN budget_amount DECIMAL(12,2) COMMENT ''预算范围(万)'' AFTER budget',
  'SELECT ''SKIP: budget_amount''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='beike_platform' AND TABLE_NAME='biz_clue' AND COLUMN_NAME='budget_amount');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE biz_clue ADD COLUMN matched_products VARCHAR(256) COMMENT ''匹配产品'' AFTER expected_target',
  'SELECT ''SKIP: matched_products''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='beike_platform' AND TABLE_NAME='biz_clue' AND COLUMN_NAME='matched_products');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE biz_clue ADD COLUMN recommended_products TEXT COMMENT ''推荐核心产品组合'' AFTER matched_products',
  'SELECT ''SKIP: recommended_products''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='beike_platform' AND TABLE_NAME='biz_clue' AND COLUMN_NAME='recommended_products');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE biz_clue ADD COLUMN industry VARCHAR(32) COMMENT ''客户所属行业'' AFTER client_circle',
  'SELECT ''SKIP: industry''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='beike_platform' AND TABLE_NAME='biz_clue' AND COLUMN_NAME='industry');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE biz_clue ADD COLUMN value_quadrant VARCHAR(8) COMMENT ''价值象限'' AFTER industry',
  'SELECT ''SKIP: value_quadrant''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='beike_platform' AND TABLE_NAME='biz_clue' AND COLUMN_NAME='value_quadrant');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE biz_clue ADD COLUMN maintenance_freq INT DEFAULT 30 COMMENT ''维护频率(天)'' AFTER value_quadrant',
  'SELECT ''SKIP: maintenance_freq''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='beike_platform' AND TABLE_NAME='biz_clue' AND COLUMN_NAME='maintenance_freq');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE biz_clue ADD COLUMN next_maintenance_date DATE COMMENT ''下次维护时间'' AFTER maintenance_freq',
  'SELECT ''SKIP: next_maintenance_date''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='beike_platform' AND TABLE_NAME='biz_clue' AND COLUMN_NAME='next_maintenance_date');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE biz_clue ADD COLUMN maintenance_methods VARCHAR(128) COMMENT ''维护方式'' AFTER next_maintenance_date',
  'SELECT ''SKIP: maintenance_methods''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='beike_platform' AND TABLE_NAME='biz_clue' AND COLUMN_NAME='maintenance_methods');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- biz_clue_contact 4个新字段
SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE biz_clue_contact ADD COLUMN influence_weight INT DEFAULT 1 COMMENT ''影响力权重(1-5)'' AFTER attitude',
  'SELECT ''SKIP: influence_weight''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='beike_platform' AND TABLE_NAME='biz_clue_contact' AND COLUMN_NAME='influence_weight');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE biz_clue_contact ADD COLUMN interaction_records TEXT COMMENT ''对接记录'' AFTER remarks',
  'SELECT ''SKIP: interaction_records''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='beike_platform' AND TABLE_NAME='biz_clue_contact' AND COLUMN_NAME='interaction_records');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE biz_clue_contact ADD COLUMN personal_focus TEXT COMMENT ''个人关注点'' AFTER interaction_records',
  'SELECT ''SKIP: personal_focus''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='beike_platform' AND TABLE_NAME='biz_clue_contact' AND COLUMN_NAME='personal_focus');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE biz_clue_contact ADD COLUMN relations VARCHAR(256) COMMENT ''关系标注'' AFTER personal_focus',
  'SELECT ''SKIP: relations''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='beike_platform' AND TABLE_NAME='biz_clue_contact' AND COLUMN_NAME='relations');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- biz_clue_follow 3个新字段
SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE biz_clue_follow ADD COLUMN contact_person VARCHAR(64) COMMENT ''对接人姓名'' AFTER follow_type',
  'SELECT ''SKIP: contact_person''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='beike_platform' AND TABLE_NAME='biz_clue_follow' AND COLUMN_NAME='contact_person');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE biz_clue_follow ADD COLUMN weekly_review_notes TEXT COMMENT ''周度评审意见'' AFTER next_plan',
  'SELECT ''SKIP: weekly_review_notes''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='beike_platform' AND TABLE_NAME='biz_clue_follow' AND COLUMN_NAME='weekly_review_notes');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE biz_clue_follow ADD COLUMN attachment_urls TEXT COMMENT ''附件URL'' AFTER weekly_review_notes',
  'SELECT ''SKIP: attachment_urls''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='beike_platform' AND TABLE_NAME='biz_clue_follow' AND COLUMN_NAME='attachment_urls');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- biz_clue_opportunity_review 3个新字段
SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE biz_clue_opportunity_review ADD COLUMN reject_reason TEXT COMMENT ''驳回原因'' AFTER opinion',
  'SELECT ''SKIP: reject_reason''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='beike_platform' AND TABLE_NAME='biz_clue_opportunity_review' AND COLUMN_NAME='reject_reason');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE biz_clue_opportunity_review ADD COLUMN supplement_items TEXT COMMENT ''待补充内容'' AFTER reject_reason',
  'SELECT ''SKIP: supplement_items''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='beike_platform' AND TABLE_NAME='biz_clue_opportunity_review' AND COLUMN_NAME='supplement_items');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE biz_clue_opportunity_review ADD COLUMN pipeline_id BIGINT COMMENT ''关联商机ID'' AFTER opportunity_level',
  'SELECT ''SKIP: pipeline_id''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='beike_platform' AND TABLE_NAME='biz_clue_opportunity_review' AND COLUMN_NAME='pipeline_id');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- biz_iron_triangle_task 3个新字段
SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE biz_iron_triangle_task ADD COLUMN collaborator_ids VARCHAR(256) COMMENT ''协作人ID列表'' AFTER assignee_id',
  'SELECT ''SKIP: collaborator_ids''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='beike_platform' AND TABLE_NAME='biz_iron_triangle_task' AND COLUMN_NAME='collaborator_ids');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE biz_iron_triangle_task ADD COLUMN sync_conclusion TEXT COMMENT ''同步结论'' AFTER deliverable',
  'SELECT ''SKIP: sync_conclusion''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='beike_platform' AND TABLE_NAME='biz_iron_triangle_task' AND COLUMN_NAME='sync_conclusion');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE biz_iron_triangle_task ADD COLUMN discussion_notes TEXT COMMENT ''沟通记录'' AFTER sync_conclusion',
  'SELECT ''SKIP: discussion_notes''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='beike_platform' AND TABLE_NAME='biz_iron_triangle_task' AND COLUMN_NAME='discussion_notes');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT '=== v1.5 升级完成 ===' AS result;
