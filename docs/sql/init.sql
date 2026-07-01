-- ============================================================
-- 贝壳线索-项目一体化管理系统 v1.0
-- 数据库初始化脚本（MySQL 8.0+）
-- 字符集：utf8mb4 / utf8mb4_unicode_ci / InnoDB
-- ============================================================

CREATE DATABASE IF NOT EXISTS beike_platform DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE beike_platform;

-- ============================================================
-- 一、系统基础表
-- ============================================================

-- 1.1 用户表
DROP TABLE IF EXISTS sys_user;
CREATE TABLE sys_user (
    id          BIGINT          AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
    username    VARCHAR(50)     NOT NULL COMMENT '登录名',
    password    VARCHAR(255)    NOT NULL COMMENT 'BCrypt加密密码',
    real_name   VARCHAR(50)     NOT NULL COMMENT '真实姓名',
    email       VARCHAR(100)            COMMENT '邮箱',
    phone       VARCHAR(20)             COMMENT '手机号',
    status      TINYINT(1)      NOT NULL DEFAULT 1 COMMENT '1=正常 0=禁用',
    create_by   BIGINT                  COMMENT '创建人',
    create_time DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_by   BIGINT                  COMMENT '更新人',
    update_time DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    is_deleted  TINYINT(1)      NOT NULL DEFAULT 0 COMMENT '0=正常 1=已删除',
    INDEX idx_username (username),
    INDEX idx_status (status)
) ENGINE=InnoDB COMMENT='系统用户表';

-- 1.2 角色表
DROP TABLE IF EXISTS sys_role;
CREATE TABLE sys_role (
    id          BIGINT          AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(50)     NOT NULL COMMENT '角色名',
    code        VARCHAR(50)     NOT NULL COMMENT '角色编码 ROLE_ADMIN/ROLE_MANAGER/ROLE_USER',
    create_by   BIGINT,
    create_time DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_by   BIGINT,
    update_time DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted  TINYINT(1)      NOT NULL DEFAULT 0,
    UNIQUE INDEX uk_code (code)
) ENGINE=InnoDB COMMENT='角色表';

-- 1.3 权限表（16个权限码）
DROP TABLE IF EXISTS sys_permission;
CREATE TABLE sys_permission (
    id          BIGINT          AUTO_INCREMENT PRIMARY KEY,
    code        VARCHAR(30)     NOT NULL COMMENT '权限码 clue:create',
    name        VARCHAR(50)     NOT NULL COMMENT '权限名称',
    module      VARCHAR(30)              COMMENT '归属模块',
    create_by   BIGINT,
    create_time DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_by   BIGINT,
    update_time DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted  TINYINT(1)      NOT NULL DEFAULT 0,
    UNIQUE INDEX uk_code (code)
) ENGINE=InnoDB COMMENT='权限表';

-- 1.4 用户角色关联表
DROP TABLE IF EXISTS sys_user_role;
CREATE TABLE sys_user_role (
    id          BIGINT          AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT          NOT NULL COMMENT '用户ID',
    role_id     BIGINT          NOT NULL COMMENT '角色ID',
    create_time DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE INDEX uk_user_role (user_id, role_id)
) ENGINE=InnoDB COMMENT='用户角色关联表';

-- 1.5 角色权限关联表
DROP TABLE IF EXISTS sys_role_permission;
CREATE TABLE sys_role_permission (
    id              BIGINT      AUTO_INCREMENT PRIMARY KEY,
    role_id         BIGINT      NOT NULL COMMENT '角色ID',
    permission_id   BIGINT      NOT NULL COMMENT '权限ID',
    create_time     DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE INDEX uk_role_perm (role_id, permission_id)
) ENGINE=InnoDB COMMENT='角色权限关联表';

-- 1.6 操作日志表
DROP TABLE IF EXISTS sys_operation_log;
CREATE TABLE sys_operation_log (
    id          BIGINT          AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT                  COMMENT '操作人ID',
    user_name   VARCHAR(50)             COMMENT '操作人姓名',
    module      VARCHAR(30)             COMMENT '操作模块',
    action      VARCHAR(50)    NOT NULL COMMENT '操作类型',
    target_id   BIGINT                  COMMENT '目标ID',
    detail      TEXT                    COMMENT '操作详情',
    ip          VARCHAR(50)             COMMENT '操作IP',
    create_time DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_module_target (module, target_id),
    INDEX idx_create_time (create_time)
) ENGINE=InnoDB COMMENT='操作日志表';

-- ============================================================
-- 二、业务表
-- ============================================================

-- 2.1 线索表（35个字段，覆盖Excel全部 + 扩展系统字段）
DROP TABLE IF EXISTS biz_clue;
CREATE TABLE biz_clue (
    -- 核心基础
    id                  BIGINT          AUTO_INCREMENT PRIMARY KEY COMMENT '线索ID',
    clue_name           VARCHAR(200)    NOT NULL                    COMMENT '线索名称',
    client_company      VARCHAR(200)    NOT NULL                    COMMENT '甲方公司',
    client_dept         VARCHAR(100)                                COMMENT '甲方部门',
    client_contact      VARCHAR(50)                                 COMMENT '甲方对接人',
    beike_owner         VARCHAR(50)     NOT NULL                    COMMENT '承接人',
    budget              VARCHAR(20)                                 COMMENT '预算量级',
    clue_level          VARCHAR(4)      NOT NULL DEFAULT 'B'        COMMENT '项目等级 A/B/C',

    -- 状态流程
    clue_status         VARCHAR(20)     NOT NULL DEFAULT '线索接触'   COMMENT '线索状态',
    review_status       VARCHAR(20)     DEFAULT '未评审'             COMMENT '评审状态',
    business_confirmed  VARCHAR(10)     DEFAULT '待确认'             COMMENT '确认商机',

    -- 时间
    contact_date        DATE                                        COMMENT '接触日期',
    proposal_date       DATE                                        COMMENT '提案日期',
    create_date         DATE            NOT NULL                    COMMENT '线索创建日期',

    -- 详情
    requirement_desc    TEXT                                        COMMENT '线索需求详细说明',
    clue_evaluation     VARCHAR(20)                                 COMMENT '线索评价',
    remark              TEXT                                        COMMENT '备注说明/所需配合',

    -- 人员/部门
    dept_belong         VARCHAR(20)     NOT NULL DEFAULT '平台一部'   COMMENT '承接部门',

    -- 沟通记录（兼容Excel原有4次沟通记录）
    comm_record_1       TEXT                                        COMMENT '初次沟通记录',
    comm_record_2       TEXT                                        COMMENT '二次沟通记录',
    comm_record_3       TEXT                                        COMMENT '三次沟通记录',
    comm_record_4       TEXT                                        COMMENT '四次沟通记录',

    -- 铁三角
    ar_user_id          BIGINT                                      COMMENT '客户经理AR用户ID',
    sr_user_id          BIGINT                                      COMMENT '方案经理SR用户ID',
    fr_user_id          BIGINT                                      COMMENT '交付经理FR用户ID',

    -- 关联/转换
    related_project_id  BIGINT                                      COMMENT '关联项目ID（转项目后回填）',
    is_converted        TINYINT(1)      DEFAULT 0                   COMMENT '是否已转项目',
    expected_restart    DATE                                        COMMENT '预计重启时间（已延期线索）',

    -- 关联信息
    relation_1          VARCHAR(200)                                COMMENT '关联',
    relation_2          VARCHAR(200)                                COMMENT '关联1',
    relation_3          VARCHAR(200)                                COMMENT '关联2',

    -- 审计字段
    create_by           BIGINT,
    create_time         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_by           BIGINT,
    update_time         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted          TINYINT(1)      NOT NULL DEFAULT 0,

    INDEX idx_clue_name (clue_name),
    INDEX idx_client_company (client_company),
    INDEX idx_beike_owner (beike_owner),
    INDEX idx_clue_status (clue_status),
    INDEX idx_clue_level (clue_level),
    INDEX idx_create_date (create_date),
    INDEX idx_dept_belong (dept_belong),
    INDEX idx_is_converted (is_converted)
) ENGINE=InnoDB COMMENT='线索表';

-- 2.2 跟进记录表
DROP TABLE IF EXISTS biz_clue_follow;
CREATE TABLE biz_clue_follow (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    clue_id         BIGINT          NOT NULL                        COMMENT '关联线索ID',
    follow_type     VARCHAR(20)     NOT NULL                        COMMENT '跟进类型',
    follow_date     DATETIME        NOT NULL                        COMMENT '跟进日期',
    follow_user_id  BIGINT          NOT NULL                        COMMENT '跟进人ID',
    follow_user_name VARCHAR(50)                                    COMMENT '跟进人姓名',
    core_conclusion VARCHAR(500)    NOT NULL                        COMMENT '核心结论',
    detail_content  TEXT                                            COMMENT '详细内容',
    next_plan       VARCHAR(500)                                    COMMENT '下一步计划',
    next_deadline   DATE                                            COMMENT '下一步截止日期',
    new_status      VARCHAR(20)                                     COMMENT '状态变更（可选）',
    attachment_ids  VARCHAR(500)                                    COMMENT '关联附件ID列表（JSON数组）',
    create_by       BIGINT,
    create_time     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_by       BIGINT,
    update_time     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted      TINYINT(1)      NOT NULL DEFAULT 0,
    INDEX idx_clue_id (clue_id),
    INDEX idx_follow_date (follow_date),
    INDEX idx_follow_type (follow_type)
) ENGINE=InnoDB COMMENT='跟进记录表';

-- 2.3 项目表
DROP TABLE IF EXISTS biz_project;
CREATE TABLE biz_project (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY       COMMENT '项目ID',
    project_name    VARCHAR(200)    NOT NULL                         COMMENT '项目名称',
    client_name     VARCHAR(200)                                     COMMENT '客户名称',
    project_manager VARCHAR(50)                                      COMMENT '项目经理',
    project_amount  DECIMAL(15,2)                                    COMMENT '金额（万元）',
    project_status  VARCHAR(20)     NOT NULL DEFAULT '进行中'          COMMENT '项目状态',
    progress        INT             DEFAULT 0                        COMMENT '进度%',
    start_date      DATE                                             COMMENT '开始日期',
    expected_end    DATE                                             COMMENT '预计完成',
    actual_end      DATE                                             COMMENT '实际结项',
    stage           VARCHAR(20)                                      COMMENT '阶段',
    project_level   VARCHAR(4)      DEFAULT 'B'                      COMMENT '项目等级 A/B/C',
    dept_belong     VARCHAR(20)                                      COMMENT '所属部门',
    source_clue_id  BIGINT                                           COMMENT '来源线索ID',
    ar_user_id      BIGINT                                           COMMENT 'AR',
    sr_user_id      BIGINT                                           COMMENT 'SR',
    fr_user_id      BIGINT                                           COMMENT 'FR',
    risk_count      INT             DEFAULT 0                        COMMENT '风险数量',
    description     TEXT                                             COMMENT '描述',
    create_by       BIGINT,
    create_time     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_by       BIGINT,
    update_time     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted      TINYINT(1)      NOT NULL DEFAULT 0,
    INDEX idx_project_name (project_name),
    INDEX idx_project_status (project_status),
    INDEX idx_project_manager (project_manager),
    INDEX idx_source_clue (source_clue_id)
) ENGINE=InnoDB COMMENT='项目表';

-- 2.4 项目风险表
DROP TABLE IF EXISTS biz_risk;
CREATE TABLE biz_risk (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    project_id      BIGINT          NOT NULL                        COMMENT '关联项目ID',
    risk_name       VARCHAR(200)    NOT NULL                        COMMENT '风险名称',
    risk_level      VARCHAR(4)      NOT NULL DEFAULT '中'            COMMENT '风险等级 高/中/低',
    risk_status     VARCHAR(10)     DEFAULT 'open'                  COMMENT 'open/resolved',
    solution        TEXT                                            COMMENT '应对措施',
    owner           VARCHAR(50)                                     COMMENT '负责人',
    create_by       BIGINT,
    create_time     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_by       BIGINT,
    update_time     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted      TINYINT(1)      NOT NULL DEFAULT 0,
    INDEX idx_project_id (project_id)
) ENGINE=InnoDB COMMENT='项目风险表';

-- 2.5 人才表
DROP TABLE IF EXISTS biz_talent;
CREATE TABLE biz_talent (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(50)     NOT NULL                        COMMENT '姓名',
    role            VARCHAR(50)                                     COMMENT '角色',
    skills          VARCHAR(500)                                    COMMENT '技能标签（逗号分隔）',
    current_project VARCHAR(200)                                    COMMENT '当前项目',
    utilization     INT             DEFAULT 0                        COMMENT '利用率%',
    load_status     VARCHAR(20)     DEFAULT 'normal'                 COMMENT '负荷状态',
    dept_belong     VARCHAR(20)                                     COMMENT '所属部门',
    create_by       BIGINT,
    create_time     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_by       BIGINT,
    update_time     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted      TINYINT(1)      NOT NULL DEFAULT 0,
    INDEX idx_name (name),
    INDEX idx_dept (dept_belong)
) ENGINE=InnoDB COMMENT='人才表';

-- 2.6 附件表（全系统通用）
DROP TABLE IF EXISTS biz_attachment;
CREATE TABLE biz_attachment (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    biz_type        VARCHAR(20)     NOT NULL                        COMMENT '业务类型 clue/project/follow/risk',
    biz_id          BIGINT          NOT NULL                        COMMENT '业务ID',
    file_name       VARCHAR(255)    NOT NULL                        COMMENT '文件名',
    file_type       VARCHAR(20)                                     COMMENT '文件类型 文档/图片/音频/其他',
    file_size       BIGINT                                          COMMENT '文件大小（字节）',
    file_url        VARCHAR(500)    NOT NULL                        COMMENT '文件存储地址',
    upload_user_id  BIGINT                                          COMMENT '上传人ID',
    upload_time     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
    create_time     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted      TINYINT(1)      NOT NULL DEFAULT 0,
    INDEX idx_biz (biz_type, biz_id)
) ENGINE=InnoDB COMMENT='附件表';

-- ============================================================
-- 三、初始化数据
-- ============================================================

-- 3.1 角色
INSERT INTO sys_role (id, name, code) VALUES
(1, '管理员',   'ROLE_ADMIN'),
(2, '部门经理', 'ROLE_MANAGER'),
(3, '普通员工', 'ROLE_USER');

-- 3.2 权限（16个）
INSERT INTO sys_permission (id, code, name, module) VALUES
(1,  'clue:list',     '查看线索',            '线索管理'),
(2,  'clue:create',   '新增线索',            '线索管理'),
(3,  'clue:edit',     '编辑线索+新增跟进',    '线索管理'),
(4,  'clue:delete',   '单条删除',            '线索管理'),
(5,  'clue:batch',    '批量删除/批量修改',     '线索管理'),
(6,  'clue:import',   'Excel导入',           '线索管理'),
(7,  'clue:export',   'Excel导出',           '线索管理'),
(8,  'clue:convert',  '线索转项目（高风险）',  '线索管理'),
(9,  'project:list',  '查看项目',            '项目管理'),
(10, 'project:create','新建项目',            '项目管理'),
(11, 'project:edit',  '编辑项目+风险管理',    '项目管理'),
(12, 'project:delete','删除项目',            '项目管理'),
(13, 'system:user',   '用户管理',            '系统管理'),
(14, 'system:role',   '角色权限管理',         '系统管理'),
(15, 'system:recycle','回收站管理',           '系统管理'),
(16, 'system:log',    '操作日志查看',         '系统管理');

-- 3.3 角色权限分配
-- 管理员 = 全部16个权限
INSERT INTO sys_role_permission (role_id, permission_id)
SELECT 1, id FROM sys_permission;

-- 部门经理 = 线索+项目（不含系统管理）
INSERT INTO sys_role_permission (role_id, permission_id)
SELECT 2, id FROM sys_permission WHERE code IN (
    'clue:list','clue:create','clue:edit','clue:delete','clue:batch',
    'clue:import','clue:export','clue:convert',
    'project:list','project:create','project:edit','project:delete'
);

-- 普通员工 = 仅查看+新增+编辑自己负责的
INSERT INTO sys_role_permission (role_id, permission_id)
SELECT 3, id FROM sys_permission WHERE code IN (
    'clue:list','clue:create','clue:edit',
    'project:list'
);

-- 3.4 测试账号（密码统一为 123456，已用 Python bcrypt 生成真实哈希）
INSERT INTO sys_user (id, username, password, real_name, status) VALUES
(1, 'admin',     '$2b$12$MGCMRuuY21sFScoeKQnYZ.H27B6t.awSCVn0GK0lUnOiPL7PKcSPW', '管理员',   1),
(2, 'zhangming', '$2b$12$MGCMRuuY21sFScoeKQnYZ.H27B6t.awSCVn0GK0lUnOiPL7PKcSPW', '张明',     1),
(3, 'employee',  '$2b$12$MGCMRuuY21sFScoeKQnYZ.H27B6t.awSCVn0GK0lUnOiPL7PKcSPW', '普通员工', 1);

-- 3.5 用户角色分配
INSERT INTO sys_user_role (user_id, role_id) VALUES
(1, 1),  -- admin = 管理员
(2, 2),  -- zhangming = 部门经理
(3, 3);  -- employee = 普通员工
