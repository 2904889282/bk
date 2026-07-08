-- v1.6 线索阶段枚举修复
-- 统一 biz_pipeline.stage：旧阶段值 -> 新标准阶段值。

UPDATE biz_pipeline
SET stage = CASE stage
    WHEN 'initial' THEN 'lead'
    WHEN 'requirement' THEN 'verify'
    WHEN 'proposal' THEN 'opportunity'
    WHEN 'negotiation' THEN 'contract'
    WHEN 'won' THEN 'cash'
    WHEN 'lost' THEN 'closed_lost'
    WHEN 'closed' THEN 'closed_lost'
    ELSE stage
END
WHERE stage IN ('initial', 'requirement', 'proposal', 'negotiation', 'won', 'lost', 'closed');

ALTER TABLE biz_pipeline
    MODIFY stage VARCHAR(32) NOT NULL DEFAULT 'lead'
    COMMENT '阶段(lead/verify/opportunity/contract/delivery/cash/closed_lost)';
