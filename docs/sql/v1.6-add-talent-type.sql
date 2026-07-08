-- ============================================================
-- v1.6: 人才池内部/外部分类
-- 在 biz_talent 表新增 talent_type 字段
-- ============================================================
ALTER TABLE biz_talent
    ADD COLUMN talent_type VARCHAR(20) DEFAULT 'internal' COMMENT '类型: internal=内部人员 / external=外部人员' AFTER status;
