# 贝壳管理平台 — Agent 接手文档

## 一句话概要
项目一体化管理系统（线索、项目、人才、预警），已部署到阿里云，浏览器访问 http://123.57.140.159

---

## 技术栈
- **前端**: React 19 + TypeScript + Vite + Ant Design 6 + Zustand (`apps/web/`)
- **后端**: Spring Boot 3.3 + Java 17 + MyBatis-Plus + JWT (`apps/api/`)
- **数据库**: 阿里云 RDS MySQL 8.0

---

## 远程环境
- **ECS**: 123.57.140.159，Ubuntu 22.04，Docker
- **RDS**: `rm-2zery46bn1074b1b1.mysql.rds.aliyuncs.com`，账号 `beike`，密码 `BEIKEadmin123`
- **项目路径**: `/opt/beike`（Git 仓库）
- **docker-compose**: `/opt/beike/ops/sandbox/docker-compose.rds.yml`（只含 api+web，不含 mysql）
- **SSH 密钥**: `C:\Users\EDY\.ssh\beike-project.pem`

---

## 数据库（16 张表）
`sys_user`, `sys_role`, `sys_permission`, `sys_user_role`, `sys_role_permission`, `sys_dept`, `sys_login_device`, `sys_operation_log`, `biz_clue`, `biz_project`, `biz_pipeline`, `biz_talent`, `biz_risk`, `biz_alert`, `biz_campaign`, `biz_clue_log`（+ 若干关联表）

---

## 开发工作流
```bash
# 1. 本地改代码
# 2. 推送到 GitHub
git add -A && git commit -m "xxx" && git push

# 3. 云上更新
ssh -i C:\Users\EDY\.ssh\beike-project.pem root@123.57.140.159 "cd /opt/beike && git pull && docker compose -f ops/sandbox/docker-compose.rds.yml build --no-cache && docker compose -f ops/sandbox/docker-compose.rds.yml up -d"
```

---

## 本地路径
- 项目根目录: `C:\Users\EDY\CodeBuddy\20260630145325`
- 前端源码: `apps/web/src/`
- 后端源码: `apps/api/src/main/java/com/beike/platform/`
- SQL: `apps/api/src/main/resources/schema.sql`

---

## 测试账号
- 管理员: `admin` / `admin`
- 经理: `zhangming` / `zhangming`

---

## 注意事项
- Docker compose 用 rds 文件，不是 sandbox（sandbox 包含本地 mysql，已废弃）
- RDS 上改表后要同步更新 `schema.sql`
- ECS 专属文件（`.env`, `docker-compose.rds.yml`）不在 Git 里
