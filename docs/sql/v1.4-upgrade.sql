-- ============================================================
-- v1.4 升级脚本：商机联动闭环
-- 适用数据库：beike_platform
-- 在 v1.3-clue-upgrade.sql 之后执行
-- ============================================================

ALTER TABLE biz_clue ADD COLUMN converted_opportunity_id BIGINT DEFAULT NULL COMMENT '已转换商机ID' AFTER related_project_id;
