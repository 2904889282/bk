# 贝壳管理平台 — Agent 接手文档

## 一句话概要
项目一体化管理系统（线索、项目、人才、预警），已部署到阿里云，浏览器访问 `{ECS_PUBLIC_IP}`

---

## 技术栈
- **前端**: React 19 + TypeScript + Vite + Ant Design 6 + Zustand (`apps/web/`)
- **后端**: Python FastAPI + SQLAlchemy 2.0 + uvicorn (`apps/api-py/`)
- **数据库**: 阿里云 RDS MySQL 8.0

---

## 远程环境（凭据详见内部密码管理器）
- **ECS**: `{ECS_PUBLIC_IP}`，Ubuntu 22.04，Docker
- **RDS**: `{RDS_HOST}`，账号 `{DB_USER}`，密码详见密码管理器
- **项目路径**: `/opt/beike`（Git 仓库）
- **docker-compose**: `/opt/beike/ops/sandbox/docker-compose.yml`（api-py + web，不在 ECS 上跑本地 mysql）
- **SSH 密钥**: 由运维团队保管，路径为 `{SSH_KEY_PATH}`

---

## 数据库（16 张表）
`sys_user`, `sys_role`, `sys_permission`, `sys_user_role`, `sys_role_permission`, `sys_dept`, `sys_login_device`, `sys_operation_log`, `biz_clue`, `biz_project`, `biz_pipeline`, `biz_talent`, `biz_risk`, `biz_alert`, `biz_campaign`, `biz_clue_log`（+ 若干关联表）

---

## 开发工作流
```bash
# 1. 本地改代码
# 2. 推送到 GitHub
git add -A && git commit -m "xxx" && git push

# 3. 云上更新（使用部署脚本）
ssh {ECS_USER}@{ECS_HOST} "./deploy.sh"
```

---

## 本地路径
- 项目根目录: `{PROJECT_ROOT}`
- 前端源码: `apps/web/src/`
- 后端源码: `apps/api-py/`（FastAPI, `main.py` 启动）
- SQL: `docs/sql/`, `ops/sandbox/mysql/init/`

---

## 测试账号
测试账号密码由运维团队统一管理，详见内部密码管理器。

---

## 注意事项
- ECS 部署使用 `ops/sandbox/docker-compose.yml`（api-py + web，不含 mysql）
- RDS 上改表后要同步更新 `docs/sql/` 中的迁移脚本
- ECS 专属文件 `.env` 不在 Git 里（凭据安全）
- `reference/microservices/` 下是旧版 Spring Boot Java 参考代码，不是当前主线后端
- **本文件不应包含任何真实凭据、IP 地址或密钥路径**
