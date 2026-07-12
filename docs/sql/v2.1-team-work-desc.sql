-- 项目详情面板 — 铁三角工作描述字段
-- 为 biz_project_team 表新增 work_description TEXT 列

ALTER TABLE biz_project_team
    ADD COLUMN work_description TEXT COMMENT '工作描述';
