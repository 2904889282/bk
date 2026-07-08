# 沙箱云部署说明

本文档用于把当前工程快速部署到一台云服务器做沙箱验证。沙箱环境不是生产环境，目标是先稳定跑通：登录、线索录入、线索列表、线索看板、评审、转商机、项目联动。

## 一、服务器要求

- Linux 云服务器，建议 2 核 4G 以上。
- 已安装 Docker 和 Docker Compose。
- 对外开放 Web 端口，默认 `80`。
- 不需要对外开放 MySQL 或后端端口。

## 二、目录说明

沙箱部署文件集中在：

- `ops/sandbox/docker-compose.sandbox.yml`：沙箱总启动文件
- `ops/sandbox/Dockerfile.api`：后端镜像
- `ops/sandbox/Dockerfile.web`：前端镜像
- `ops/sandbox/nginx.conf`：前端静态站点和 `/api` 转发
- `ops/sandbox/mysql/init/00-schema-seed.sql`：空库初始化脚本
- `ops/sandbox/.env.example`：环境变量模板

## 三、首次启动

在项目根目录执行：

```bash
cp ops/sandbox/.env.example ops/sandbox/.env
```

修改 `ops/sandbox/.env`：

```bash
PUBLIC_BASE_URL=http://你的服务器IP
MYSQL_PASSWORD=改成强密码
MYSQL_ROOT_PASSWORD=改成强密码
JWT_SECRET=改成至少32位的长随机字符串
```

启动：

```bash
docker compose -f ops/sandbox/docker-compose.sandbox.yml --env-file ops/sandbox/.env up -d --build
```

访问：

```text
http://你的服务器IP
```

默认账号：

```text
admin / admin123
zhangming / zm2026
```

## 四、检查状态

查看容器：

```bash
docker compose -f ops/sandbox/docker-compose.sandbox.yml --env-file ops/sandbox/.env ps
```

查看后端日志：

```bash
docker compose -f ops/sandbox/docker-compose.sandbox.yml --env-file ops/sandbox/.env logs -f api
```

查看前端入口健康状态：

```bash
curl http://127.0.0.1/health
```

查看后端健康状态：

```bash
curl http://127.0.0.1/api/health
```

## 五、更新发布

代码更新后重新构建：

```bash
docker compose -f ops/sandbox/docker-compose.sandbox.yml --env-file ops/sandbox/.env up -d --build
```

只看启动日志：

```bash
docker compose -f ops/sandbox/docker-compose.sandbox.yml --env-file ops/sandbox/.env logs -f web api
```

## 六、停止和重建

停止但保留数据：

```bash
docker compose -f ops/sandbox/docker-compose.sandbox.yml --env-file ops/sandbox/.env down
```

清空沙箱数据并重建：

```bash
docker compose -f ops/sandbox/docker-compose.sandbox.yml --env-file ops/sandbox/.env down -v
docker compose -f ops/sandbox/docker-compose.sandbox.yml --env-file ops/sandbox/.env up -d --build
```

## 七、沙箱验收标准

- 打开首页不会白屏。
- 使用 `admin / admin123` 可以登录。
- 线索列表能看到初始化样例数据。
- 首页快速新建线索后，线索列表同步出现。
- 线索看板能按阶段展示商机卡片。
- 线索评审通过后能生成商机记录。
- 刷新页面不会 404。

## 八、注意事项

- 沙箱只暴露 Web 端口，数据库和后端只在 Docker 内网通信。
- 首次初始化脚本只会在 MySQL 数据卷为空时执行。
- 如果修改了初始化 SQL，需要执行 `down -v` 后重新启动才会重新导入。
- 上公网前必须修改 `.env` 里的数据库密码和 `JWT_SECRET`。
