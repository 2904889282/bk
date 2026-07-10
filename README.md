# Beike Admin — 贝壳统一管理平台 v2.0

技术栈：**React 19 + TypeScript + Ant Design 6**（前端） + **Python FastAPI**（后端） + **MySQL 8.0**（数据库）

日常二次开发只需要关注：

- `apps/web`: React 前端（Vite + Zustand）
- `apps/api-py`: Python FastAPI 后端（SQLAlchemy 2.0 + uvicorn，端口 8080）
- `docs/sql`: 数据库初始化和升级脚本
- `ops`: 部署（Docker Compose）、Nginx 配置等运维资料

参考代码 `reference/microservices/` 目录包含旧版 Spring Boot Java 代码，但**当前主线后端是 Python FastAPI**。

## 本地启动

```bash
# 前端
pnpm dev
# → http://localhost:5173/

# 后端（需要 .env 配置数据库连接）
cd apps/api-py
.\.venv\Scripts\python.exe main.py
# → http://localhost:8080/
# API 文档 → http://localhost:8080/docs
```

## 构建

```bash
pnpm build
```

## 二开文档

完整工程结构、文件分类和后续简化建议见：

```text
docs/ENGINEERING_GUIDE.md
```
