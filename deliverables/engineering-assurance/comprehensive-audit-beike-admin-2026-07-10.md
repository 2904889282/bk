# 贝壳统一管理平台 v2.1.0 — 全面工程审查报告

**日期**：2026-07-10
**工作流**：全面代码审查 + 系统架构评估 + 运维/基础设施审查 + 测试策略评估 + 文档质量审查
**参与成员**：Cody（代码审查师）、Archi（系统架构师）、Rex（SRE 工程师）、Tessa（测试专家）、Docu（技术文档师）

---

## 📌 TL;DR（执行摘要）

- **整体结论**：贝壳统一管理平台功能完整、技术栈匹配优秀（FastAPI + React 19 + MySQL 8.0），已成功部署到阿里云生产环境。但存在 **凭据泄露、零测试覆盖、无 HTTPS、JWT 无法吊销** 等多项严重问题，安全态势和工程质量亟需系统性加固。
- **严重度分布**：🔴严重 **16** 项 / 🟠高 **15** 项 / 🟡中 **19** 项 / 🟢低 **11** 项 — 共计 **61** 个发现问题
- **安全风险**：AGENT_HANDOFF.md 明文泄露数据库密码、SSH 密钥路径、服务器 IP — 三名审查员独立确认此发现
- **架构评分**：72.3/100（B 级），技术栈匹配 A- 但模块边界和 API 一致性存在技术债
- **阻塞/非阻塞**：🔴 **6 项立即阻塞**（凭据泄露、无 HTTPS、无测试、明文密码 API 返回、JWT 无限重放）; 🟠 15 项高优先级需本周修复

---

## 🎯 核心结论卡片

| 项目 | 内容 |
|------|------|
| 整体评级 | 🔴 不通过 — 必须在修复 P0 问题后重新审查 |
| 阻塞项数量 | **6 项 P0（立即阻塞）** |
| 关键行动项 | 15 条（P0: 6, P1: 5, P2: 4） |
| 安全评分 | 🔴 2/10（凭据泄露 + 无 HTTPS + JWT 无吊销 + 明文密码 API 返回） |
| 架构评分 | 🟡 72.3/100（B 级，技术栈匹配 A- 但分层和边界需改进） |
| 运维评分 | 🔴 2.5/10（无监控/无告警/无备份验证/无事故响应机制） |
| 测试评分 | 🔴 0/10（14 个后端文件 + ~60 个前端组件，零自动化测试） |
| 文档评分 | 🔴 3.8/10（凭据泄露 + ENGINEERING_GUIDE 严重不一致 + 10+ 文档缺失） |
| 建议下一步 | 立即轮换所有凭据 → 部署 HTTPS → 建立最小测试集 → 修复 6 项 P0 |

---

## 🔐 维度一：安全审查（Cody 代码审查师 + Rex SRE 工程师）

**综合发现**：Cody 报告 29 个代码级安全问题，Rex 报告 7 个基础设施级安全风险。以下合并去重后按严重度排列。

### 🔴 P0 级：必须立即处理（6 项，阻塞部署）

| # | 严重度 | 类别 | 位置 | 问题描述 | 建议修复 | 来源 |
|---|--------|------|------|---------|---------|------|
| 1 | 🔴严重 | 凭据泄露 | `AGENT_HANDOFF.md` | Git 仓库明文存储 RDS 密码 `BEIKEadmin123`、ECS IP、SSH 密钥路径、测试账号密码 | ① 立即轮换 RDS 密码 ② 重新生成 SSH 密钥对 ③ 清理 Git 历史 (`git filter-branch`/BFG) ④ 加入 `.gitignore` ⑤ 使用阿里云 KMS 管理凭据 | Cody + Rex + Docu |
| 2 | 🔴严重 | 传输安全 | `docker-compose.yml` + `nginx.conf` | 生产环境仅 HTTP，无 HTTPS/SSL。用户凭据、JWT Token 明文传输，可被中间人截获 | ① 部署阿里云免费 SSL 证书 ② Nginx 配置 HTTPS 301 重定向 ③ 添加 HSTS 头 ④ 关闭 80 端口 | Rex + Cody |
| 3 | 🔴严重 | JWT 安全 | `security.py:21-26`, `auth.py:76-83` | **Refresh token 无限重放**：`/api/auth/refresh` 不验证旧 token 是否已使用；**JWT 无法主动吊销**：用户登出/密码修改后旧 token 仍有效 | ① Redis 存储 jti 黑名单（TTL = token 剩余有效期）② Refresh token 轮转（每次 refresh 签发新 token 并废弃旧 token） | Cody |
| 4 | 🔴严重 | 密码安全 | `system.py:91-98, 62-71` | 管理员重置密码和创建用户时，**明文密码通过 HTTP API 响应返回**。如果未启用 HTTPS，密码完全暴露 | ① 密码通过独立安全渠道（邮件/SMS）发送 ② 或强制用户首次登录修改临时密码 ③ 立即部署 HTTPS | Cody |
| 5 | 🔴严重 | SQL 注入 | `system.py:246-258` | `recycle_page` 使用 f-string 拼接表名 `f"SELECT ... FROM {tbl}"`，且循环中**未调用** `_validate_biz_type` 白名单校验 | ① 为所有回收站操作统一调用 `_validate_biz_type` ② 改为 ORM 查询或参数化表名映射 | Cody |
| 6 | 🔴严重 | Restart | `docker-compose.yml` | **服务器重启后容器不会自动启动** — 缺少 `restart: unless-stopped` | 立即在 api 和 web 服务中添加 `restart: unless-stopped` | Rex |

### 🟠 P1 级：强烈建议本周修复（15 项）

| # | 严重度 | 类别 | 位置 | 问题描述 | 来源 |
|---|--------|------|------|---------|------|
| 7 | 🟠高 | 认证 | `auth.py:16-24` | 登录限流为单容器内存字典，重启/多实例后限流失效 | Cody + Archi |
| 8 | 🟠高 | 密码强度 | `security.py:13` | bcrypt rounds=10，低于 OWASP 2023 推荐的 12 | Cody |
| 9 | 🟠高 | CORS | `main.py:70-73` | CORS 允许 HTTP 明文生产地址，且 `allow_methods=["*"]` `allow_headers=["*"]` 过于宽松 | Cody |
| 10 | 🟠高 | 异常安全 | `main.py:93-99` | 全局异常处理输出完整 `traceback.format_exc()`，可能泄露敏感信息到日志 | Cody |
| 11 | 🟠高 | 注册安全 | `auth.py:52-73` | `/api/auth/register` 无验证码、无邮箱验证、无 IP 限流，可被批量注册攻击 | Cody |
| 12 | 🟠高 | 密码重置 | `auth.py:103-113` | `send-code` 端点虚假成功 — 验证码从未实际发送，密码重置功能形同虚设 | Cody |
| 13 | 🟠高 | 认证缺失 | `biz.py:35-38,57-61; ltc.py:125-128` | 多个端点（talent/risk/alert/clue 详情、附件列表、部分删除端点）**无认证依赖**，任何人可直接访问 | Cody |
| 14 | 🟠高 | 资源限制 | `docker-compose.yml` | 容器无 CPU/Memory limits，可能 OOM 影响宿主机 | Rex |
| 15 | 🟠高 | 数据库连接 | `database.py:6,+12-13` | 缺少 `pool_pre_ping=True` 和 `pool_recycle=3600`，连接失效后报错 | Rex + Archi |
| 16 | 🟠高 | 日志 | `应用全局` | 使用 `print()` 而非结构化日志，无法按级别/trace_id 检索；无集中式日志平台 | Rex |
| 17 | 🟠高 | 监控 | `基础设施` | **无任何监控告警**：服务可用性、API 延迟、错误率、慢查询、磁盘使用均无监控 | Rex |
| 18 | 🟠高 | SSH | `AGENT_HANDOFF.md` | SSH 密钥存储在个人目录，22 端口暴露在公网，无跳板机 | Rex |
| 19 | 🟠高 | 备份 | `基础设施` | 未确认 RDS 自动备份已开启；上传文件无备份策略；数据库回滚方案缺失 | Rex |
| 20 | 🟠高 | 默认凭据 | `docker-compose.yml` + `.env.example` | docker-compose.yml 硬编码 RDS 地址和用户名作为默认值；JWT secret 示例值过于简单 | Rex + Docu |
| 21 | 🟠高 | 密码生成 | `system.py:62-71 vs 91-98` | `user_create` 使用 70 字符集（含特殊符号），`user_reset_pwd` 仅用 62 字符集（无特殊符号），强度不一致 | Cody |

### 🟡 P2 级：下一迭代修复

| # | 严重度 | 类别 | 位置 | 问题描述 | 来源 |
|---|--------|------|------|---------|------|
| 22 | 🟡中 | 事务安全 | `project.py:203-257` | 里程碑/团队/WBS 覆盖式保存（DELETE 全部 + INSERT 新）无显式事务边界 | Cody |
| 23 | 🟡中 | 时区 | `models.py:7-8` | `_utcnow()` 丢弃时区信息生成 naive datetime，跨时区场景数据混乱 | Cody |
| 24 | 🟡中 | 验证码存储 | `security_code.py` | 内存 dict + threading.Lock，多 worker/多实例不共享 | Cody + Archi |
| 25 | 🟡中 | 性能 | `system.py:246-259` + `project.py:135-164` | 回收站 N+1 表查询 + 项目仪表盘 8+ 次独立 DB 查询 | Cody + Archi |
| 26 | 🟡中 | 代码重复 | `biz.py`, `project.py` 等 | camelCase→snake_case 映射在 6 个文件中重复定义 80+ 条，重复率 >40% | Cody + Archi |
| 27 | 🟡中 | 魔术数字 | `auth.py:69` | 注册时 `role_id=3` 硬编码，应通过角色 code 查询 | Cody |
| 28 | 🟡中 | 链路追踪 | `全局` | 缺 `X-Request-ID`/trace ID，分布式/容器环境无法追踪单个请求 | Cody |
| 29 | 🟡中 | 密码复杂度 | `schemas.py:33-35` | 仅检查最小长度 8，允许纯数字密码 | Cody |
| 30 | 🟡中 | URL 编码 | `database.py:6` | f-string 拼接数据库 URL，密码含特殊字符时出错 | Cody |
| 31 | 🟡中 | 文件安全 | `biz.py:364-512` | Excel 导入无病毒/恶意宏扫描 | Cody |
| 32 | 🟡中 | 密码重置 | `auth.py:76-83` | refresh token 端点使用 `dict` 而非 Pydantic 模型接收参数 | Cody |
| 33 | 🟡中 | Docker | `Dockerfile.api-py` | 非 root 用户未确认；缺少多阶段构建；可能把 `.env`/`__pycache__` 打入镜像 | Rex |
| 34 | 🟡中 | 安全头 | `nginx.conf` | 缺少 `Content-Security-Policy` 和 `Strict-Transport-Security` 头 | Rex |
| 35 | 🟡中 | WAF | `基础设施` | 无 Web 应用防火墙，缺乏 SQL 注入/XSS/CC 攻击防护 | Rex |
| 36 | 🟡中 | APM | `基础设施` | 无链路追踪/APM，跨服务问题定位困难 | Rex |
| 37 | 🟡中 | 反向代理 | `nginx.conf` | `proxy_next_upstream_tries 2` 在单实例场景下无意义 | Archi |
| 38 | 🟡中 | 数据权限 | `多文件` | 字段名不一致（project_manager/beike_owner/owner），复杂权限（部门共享）无法支持 | Archi |
| 39 | 🟡中 | 软删除遗漏 | `biz.py:dashboard`, `system.py:recycle_page` | 部分查询遗漏 `is_deleted=0` 过滤 | Archi |
| 40 | 🟡中 | 文件存储 | `ltc.py:attachment_upload` | 本地 `uploads/` 目录，Docker 重启数据丢失风险（依赖 volume） | Archi |

### 🟢 P3 级：建议改进

| # | 严重度 | 类别 | 位置 | 问题描述 | 来源 |
|---|--------|------|------|---------|------|
| 41–46 | 🟢低 | 代码质量 | 散落各处 | 多个端点使用 `dict` 而非 Pydantic 模型；DTO vs dict 混用；`row_to_camel` 被别名为 `row_to_dict`（误导）；API 响应格式不统一；`hasattr` 防护不一致 | Cody + Archi |
| 47–51 | 🟢低 | 运维增强 | 基础设施 | 无高可用（单实例）；无跨 AZ；无 DNS 故障切换；无 Docker 镜像备份；无证书过期监控 | Rex |

---

## 🏗️ 维度二：系统架构评估（Archi 系统架构师）

**综合评分：72.3/100（B 级）**

### 关键架构决策记录 (ADR)

| ADR | 决策 | 状态 | 建议 |
|-----|------|------|------|
| ADR-001 | Router-Only 架构（无 Service 层） | Accepted | 设定阈值：单文件>200行时强制拆分 |
| ADR-002 | 手动 camelCase↔snake_case 映射 | Accepted | 迁移到 Pydantic `Field(alias=...)` + `populate_by_name=True` |
| ADR-003 | 混合 ORM + Raw SQL | Proposed | 分级策略：有 ORM 模型必须用 ORM；补全缺失模型 |
| ADR-004 | lifespan 启动时 DDL 迁移 | Accepted（建议替换） | 立即迁移到 Alembic 版本管理 |
| ADR-005 | JWT 无吊销机制 | Accepted（当前阶段） | 引入 Redis jti 黑名单 |
| ADR-006 | 软删除模式（is_deleted） | Accepted | 添加 SQLAlchemy mixin 自动过滤；建索引；定期归档 |
| ADR-007 | 前端 Mock 回退 | Accepted | 封装到拦截器层，生产构建 tree-shake |
| ADR-008 | owner 字段数据权限过滤 | Accepted | 统一字段命名；定义 `data_scope_filter()` 工具函数 |

### 各维度评分

| 维度 | 评分 | 关键发现 |
|------|------|---------|
| 分层架构 | B (75) | Router 承载 Controller+Service+Data Access 三层职责 |
| 数据流 | B (78) | 路径清晰；get_current_user_with_role 每次 2 次查询无缓存 |
| 模块边界 | C (65) | system.py(276行) 7 个关注点混一起；biz.py(601行) 严重越界 |
| API 一致性 | D (55) | 80+ 条映射重复率 >40%；DTO/dict 混用 |
| ORM vs SQL | C (68) | 3 张表无 ORM 模型；回收站 f-string 危险模式 |
| 数据库设计 | B (75) | 范式合理但缺外键约束、索引策略、迁移管理 |
| 扩展性 | C (62) | 单容器瓶颈；内存状态不共享；文件存储依赖本地 |
| 技术栈匹配 | A- (88) | FastAPI+React+AntD 高度匹配内部管理系统 |

### 建议重组后的模块结构

```
apps/api-py/
├── routers/
│   ├── auth.py              # 认证/密码
│   ├── system/
│   │   ├── user.py          # 用户 CRUD
│   │   ├── role.py          # 角色/权限
│   │   ├── dept.py          # 部门树
│   │   └── position.py      # 职位
│   ├── project/
│   │   ├── __init__.py      # 项目 CRUD
│   │   ├── period.py        # 月度期数
│   │   ├── weekly.py        # 周报
│   │   ├── milestone.py     # 里程碑
│   │   ├── team.py          # 团队
│   │   ├── wbs.py           # WBS
│   │   └── change.py        # 变更
│   ├── biz/
│   │   ├── clue.py          # 线索 CRUD + 导入
│   │   ├── talent.py        # 人才
│   │   ├── risk.py          # 风险
│   │   └── alert.py         # 预警
│   └── ltc.py               # 保持在合理范围内
├── services/                # 新增：业务逻辑层
├── utils/
│   └── field_map.py         # 统一 camelCase↔snake_case 映射
└── migrations/              # 新增：Alembic 版本
```

---

## 🖥️ 维度三：运维/基础设施审查 + 事故响应（Rex SRE 工程师）

**综合评分：🔴 2.5/10**

### 基础设施概览

```
当前架构:
┌─────────────────────────────────────┐
│  Docker Host (单 ECS, 123.57.140.159)│
│  ┌───────────┐  ┌──────────────────┐│
│  │ Nginx:80  │→│ FastAPI (uvicorn) ││
│  │ (静态SPA) │  │ 单进程, :8080    ││
│  └───────────┘  └────────┬─────────┘│
│                          │           │
│               ┌──────────▼─────────┐│
│               │ MySQL RDS (阿里云) ││
│               └────────────────────┘│
└─────────────────────────────────────┘

缺失:
❌ HTTPS      ❌ 监控告警   ❌ WAF
❌ 日志平台   ❌ APM       ❌ 备份验证
❌ Runbook    ❌ 事故分级   ❌ 高可用
```

### 事故响应准备度

| 能力 | 状态 | 建议 |
|------|------|------|
| 事故分级 (SEV1-4) | ❌ 未定义 | 立即建立分级标准 |
| 状态更新模板 | ❌ 未建立 | 参考 Google IRM 模板 |
| 战情室流程 | ❌ 未建立 | 指定事故指挥官角色 |
| 复盘机制 | ❌ 未建立 | 采用无责复盘(blameless postmortem) |
| Runbook | ❌ 未建立 | 至少覆盖：服务宕机、DB 断连、磁盘满、凭据泄露应急 |
| 通知渠道 | ❌ 未指定 | 指定企业微信/钉钉告警群 |
| RDS 备份验证 | ⚠️ 需检查 | 确认自动备份已开启，执行恢复演练 |
| 代码回滚 | ⚠️ 仅 git revert | 需标准化回滚流程；数据库迁移回滚缺失 |

### 建议的 docker-compose.yml 改进要点

- ✅ 已有：健康检查、日志轮转、bridge 网络隔离
- ❌ 需添加：`restart: unless-stopped`、`deploy.resources.limits`、Nginx HTTPS 443 端口
- ❌ 需修复：healthcheck `retries` 参数、`pool_recycle=3600`

---

## 🧪 维度四：测试策略与覆盖率（Tessa 测试专家）

**综合评分：🔴 0/10 — 零自动化测试覆盖**

### 搜索结论

| 搜索模式 | 项目源码命中 | 结论 |
|----------|:----------:|------|
| `*.test.*` / `*.spec.*` | 0 | ❌ 无 |
| `__tests__/` | 0 | ❌ 无 |
| `*test*.py` / `*test*.ts` | 0 | ❌ 无 |
| `conftest.py` / `pytest.ini` / `vitest.config.*` | 0 | ❌ 无 |

**确认：14 个后端 Python 文件 + ~60 个前端 TS/TSX 文件，零测试。**

### 测试金字塔

```
        /  E2E  \         ❌ 0 个测试
       / 集成测试 \        ❌ 0 个测试
      /   单元测试  \      ❌ 0 个测试
```

### 最大风险点

1. **认证安全无测试保障**：JWT 签发/验证/过期逻辑、bcrypt 哈希、require_admin 装饰器 — 全部零测试
2. **数据权限过滤无验证**：跨 5+ 路由的「非管理员只能看自己数据」逻辑完全无自动化验证
3. **Excel 导入约 150 行清洗代码**无测试：异常数据可能导致脏数据入库或 500 崩溃

### 建议最小测试集

- **后端（pytest）**：30 个测试 — 覆盖认证/数据权限/Excel 导入/密码重置
- **前端（vitest）**：15 个测试 — 覆盖 useAuth/request 拦截器/PermissionGuard
- **E2E（Playwright）**：8 个测试 — 覆盖登录/项目管理/线索导入/权限控制

### CI/CD 集成

```yaml
deploy:
  needs: test  # 测试通过才能部署
```

---

## 📝 维度五：文档质量审查（Docu 技术文档师）

**综合评分：🔴 3.8/10**

### 逐文档评分

| 文档 | 评分 | 关键问题 |
|------|:----:|---------|
| README.md | 5/10 | 缺数据库初始化步骤、.env 配置说明、故障排查 |
| AGENT_HANDOFF.md | 3/10 | 🔴 **凭据泄露**：RDS 密码/SSH 密钥/IP 全部明文 |
| ENGINEERING_GUIDE.md | 4/10 | 🟠 **严重不一致**：第 3 节和第 6 节混写 Java Spring Boot 结构（实际的 FastAPI 后端完全不同） |
| SANDBOX_DEPLOY.md | 7/10 | 质量最高但文件名引用不一致（`docker-compose.sandbox.yml` vs `docker-compose.yml`） |
| .env.example | 6/10 | JWT secret 示例值过于简单，缺少部分必要变量 |
| SQL 脚本 | 6/10 | 无 README、无执行顺序说明、无回滚脚本 |

### 缺失文档清单（前 6）

| 优先级 | 缺失文档 | 理由 |
|--------|---------|------|
| P0 | API 文档（业务语义） | 仅有自动生成 /docs，缺认证流程/错误码/限流策略说明 |
| P0 | 数据库 ER 图/表结构 | 16 表关系无文档化 |
| P1 | 权限模型文档 | RBAC 五表关系和鉴权流程 |
| P1 | 事故应急手册 (RUNBOOK) | 生产运行但无应急流程 |
| P1 | 部署运维手册 | SANDBOX_DEPLOY 仅覆盖沙箱，缺生产部署 |
| P1 | CHANGELOG.md | v1.1→v2.0 变更无汇总 |

---

## ✅ 行动清单（按优先级排序）

| # | 行动 | 负责角色 | 紧急度 | 预期完成 |
|---|------|---------|--------|---------|
| 1 | **立即轮换所有泄露的凭据**（RDS 密码、SSH 密钥），清理 Git 历史，加入 .gitignore | 运维/安全 | 🔴 P0 | 立即 |
| 2 | **部署 HTTPS**（阿里云免费 SSL 证书 + Nginx 配置 + HSTS） | 运维 | 🔴 P0 | 24 小时 |
| 3 | **实现 JWT 吊销机制**（Redis jti 黑名单 + Refresh Token 轮转） | 后端 | 🔴 P0 | 48 小时 |
| 4 | **移除明文密码 API 返回**，改为首次登录强制修改或独立渠道发送 | 后端 | 🔴 P0 | 48 小时 |
| 5 | **修复回收站 SQL 注入风险**（统一调用白名单校验 + 转 ORM） | 后端 | 🔴 P0 | 48 小时 |
| 6 | **添加 `restart: unless-stopped`** 到 docker-compose.yml | 运维 | 🔴 P0 | 立即 |
| 7 | **建立最小测试集**（pytest 30 + vitest 15 + Playwright 8） | 全栈 | 🟠 P1 | 1 周 |
| 8 | **提高 bcrypt rounds 至 12**，提升密码复杂度要求 | 后端 | 🟠 P1 | 1 周 |
| 9 | **为所有端点补充认证依赖**（talent/risk/alert/clue 详情、附件列表） | 后端 | 🟠 P1 | 1 周 |
| 10 | **接入阿里云云监控**（站点拨测 + 服务可用性告警 + 慢查询告警） | 运维 | 🟠 P1 | 1 周 |
| 11 | **迁移到 Alembic 数据库迁移管理**（脱离 lifespan DDL） | 后端 | 🟠 P1 | 1 周 |
| 12 | **启动注册防护**（验证码、邮箱验证、IP 限流） | 后端 | 🟡 P2 | 2 周 |
| 13 | **补充 ORM 模型**（biz_clue_follow、biz_attachment、sys_operation_log）+ 统一 ORM 使用策略 | 后端 | 🟡 P2 | 2 周 |
| 14 | **统一 camelCase→snake_case 映射**到 `utils/field_map.py` 或 Pydantic Field(alias) | 后端 | 🟡 P2 | 2 周 |
| 15 | **重写 ENGINEERING_GUIDE.md**（清除 Java 内容，改为 FastAPI 实际结构） | 文档 | 🟡 P2 | 2 周 |
| 16 | **编写事故应急 Runbook**（含 SEV1-4 分级、回滚方案、联系人） | 运维 | 🟢 P3 | 1 月 |
| 17 | **配置资源限制 + 非 root 用户 + Docker 多阶段构建** | 运维 | 🟢 P3 | 1 月 |
| 18 | **补充 API 文档 + 数据库 ER 图 + 权限模型文档** | 文档 | 🟢 P3 | 1 月 |

---

## ⚠️ 待完善 / 已知局限

- **本审查未执行动态渗透测试**：所有安全发现基于静态代码分析，建议后续进行 OWASP Top 10 渗透测试
- **前端代码未逐文件审查**：Cody 的代码审查聚焦后端，前端的安全风险（XSS、CSRF、Token 存储）未详尽覆盖
- **数据库实际索引和慢查询未检查**：需登录 RDS 执行 `EXPLAIN` 分析和慢查询日志审查
- **ECS 实际安全组配置未验证**：需登录阿里云控制台确认安全组规则、RDS 白名单、备份策略启用状态
- **性能基线未建立**：未进行负载测试或压力测试，无法给出 QPS/延迟的量化建议
- **npm/pip 依赖未做 CVE 扫描**：建议运行 `npm audit` 和 `pip-audit` 检查已知漏洞
- **事故响应流程基于静态评估**：实际事故演练和恢复时间 (RTO/RPO) 需通过实战验证

---

## 📚 数据来源 & 成员产出索引

| 成员 | 角色 | 审查范围 | 发现问题数 | 关键发现 |
|------|------|---------|:--------:|---------|
| Cody | 代码审查师 | 10 个后端核心文件 + 辅助模块 | 29 项（6/8/8/7） | JWT 无限重放、SQL 注入、明文密码 API |
| Archi | 系统架构师 | 全栈架构 9 维度 + 8 ADR | 综合评分 72.3/100 | Router-Only 架构、camelCase 映射债、ORM/RawSQL 混用 |
| Rex | SRE 工程师 | Docker/Nginx/ECS/RDS/安全运维 | 2.5/10 综合评分 | 凭据泄露、无 HTTPS、零监控、零事故响应 |
| Tessa | 测试专家 | 14 后端 + ~60 前端文件 | 0/10 — 零测试 | 认证/数据权限/Excel 导入无测试保障 |
| Docu | 技术文档师 | README + 5 文档 + SQL 脚本 | 3.8/10 | ENGINEERING_GUIDE Java/FastAPI 混写 |

- **Cody 原始产出**：29 项代码级安全问题（安全/性能/正确性/可维护性四维）
- **Archi 原始产出**：9 维度架构评分 + 8 ADRs + 模块重组建议
- **Rex 原始产出**：5 维度运维审查 + 18 条 P0/P1/P2 行动项 + 事故响应差距分析
- **Tessa 原始产出**：文件搜索报告 + 测试金字塔评估 + 最小测试集建议
- **Docu 原始产出**：6 份文档逐项评审 + 20 项缺失文档清单 + 标准文档结构

---

> **本报告由工程保障团队 AI 协作生成（Cody + Archi + Rex + Tessa + Docu），关键决策请由人类工程负责人复核。**  
> **特别提醒**：P0-1（凭据泄露）和 P0-2（无 HTTPS）属于安全红线问题，建议立即启动应急响应流程处理。
