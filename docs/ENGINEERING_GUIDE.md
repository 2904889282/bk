# 工程结构与二次开发说明

本项目已按当前可运行主线重新整理。日常开发优先看 `apps/web` 和 `apps/api`，其他目录作为文档、部署或参考资料保留。

## 1. 当前访问入口

前端页面：

```text
http://localhost:5173/
```

后端 API：

```text
http://localhost:8080/
```

之前无法访问的主要原因是打开了 `8080`。`8080` 是后端接口端口，浏览器页面应访问 `5173`。

当前后端未监听 `8080` 时，通常是后端服务尚未启动。后端启动需要 Python 3.12+ 安装依赖（`pip install -r requirements.txt`）并配置数据库连接（`.env`），并且 MySQL 中存在 `beike_platform` 数据库。

## 2. 文件分类

| 类型 | 目录 | 当前用途 | 二开建议 |
| --- | --- | --- | --- |
| 主前端程序 | `apps/web` | 当前 React 页面、路由、接口请求、组件 | 日常前端开发主要修改这里 |
| 主后端程序 | `apps/api-py` | 当前 Python FastAPI 后端 | 日常接口和业务逻辑主要修改这里 |
| 数据脚本 | `docs/sql` | 初始化和版本升级 SQL | 数据结构变化时追加脚本 |
| 产品/工程文档 | `docs` | 产品文档、工程说明 | 保留必要文档，避免模板说明 |
| 运维部署 | `ops` | Docker、Nginx、K8s、CI/CD、监控日志 | 部署时使用，平时不参与本地启动 |
| 参考代码 | `reference` | 微服务原型、旧前端页面 | 只作为迁移或对照参考，不作为主线开发入口 |
| 生成产物 | `dist`、`node_modules`、`target`、`.runtime` | 构建结果、依赖、运行日志 | 不手工维护，不纳入业务开发 |
| 本地工具配置 | `.codebuddy`、`.agents`、`.vscode` | 本机工具或编辑器状态 | 已加入忽略规则，不作为工程代码 |

## 3. 推荐目录结构

```text
.
|-- apps
|   |-- web
|   |   |-- index.html
|   |   |-- public
|   |   `-- src
|   |       |-- api             # 前端请求封装
|   |       |-- components      # 通用组件
|   |       |-- config          # 菜单、路由元信息
|   |       |-- features        # 可复用业务模块
|   |       |-- hooks           # 通用 hooks
|   |       |-- layouts         # 页面框架
|   |       |-- pages           # 业务页面
|   |       |-- store           # 前端状态
|   |       |-- types           # 前端共享类型
|   |       `-- utils           # 工具函数
|   `-- api
|       |-- pom.xml
|       `-- src/main
|           |-- java/com/beike/platform
|           |   |-- controller   # 接口入口
|           |   |-- service      # 业务接口
|           |   |-- service/impl # 业务实现
|           |   |-- mapper       # MyBatis Mapper
|           |   |-- entity       # 数据库实体
|           |   |-- dto          # 请求对象
|           |   |-- vo           # 返回对象
|           |   |-- config       # 配置类
|           |   `-- common       # 公共返回、异常、JWT 等
|           `-- resources
|-- docs
|   `-- sql
|-- ops
|-- reference
|   |-- microservices          # 微服务原型，不参与默认启动
|   `-- frontend-legacy        # 旧版或未接入页面
|-- README.md
`-- start.bat
```

## 4. 本次已完成的整理

- 将当前主前端固定到 `apps/web`。
- 将当前主后端固定到 `apps/api`。
- 将微服务原型移到 `reference/microservices`，避免和当前主后端混淆。
- 将旧版未接入的线索页移到 `reference/frontend-legacy`。
- 将仍被看板复用的线索表单提到 `apps/web/src/features/pipeline`。
- 将部署、网关、监控、日志、CI/CD 等资料归到 `ops`。
- 将前端页面改为按路由懒加载，主入口包从约 3MB 降到约 671KB。
- 删除旧的 `docs/PROJECT_STRUCTURE.md`，重新输出当前文档。
- 替换根目录 Vite 模板 README，改为真实项目说明。

## 5. 前端二开位置

新增页面时建议按下面顺序处理：

1. 在 `apps/web/src/pages/<业务域>/<页面>/index.tsx` 新建页面。
2. 在 `apps/web/src/App.tsx` 添加路由。
3. 在 `apps/web/src/config/menus.ts` 添加菜单。
4. 在 `apps/web/src/api/<业务域>.ts` 添加请求方法。
5. 通用业务弹窗、表单、选择器放到 `apps/web/src/features/<业务域>`。

当前前端还可以继续简化：

- 构建后仍有较大的第三方依赖块，主要来自 Ant Design、日期组件和图表库；后续可按业务页继续拆分图表和重型组件。
- `api/clue.ts`、`api/pipeline.ts` 里类型和请求方法混在一起，继续增长后建议拆成 `types.ts` 和 `api.ts`。
- `Permission`、`PermissionGuard`、登录守卫职责接近，后续可统一边界。
- 部分中文文案存在编码异常，建议统一保存为 UTF-8 后逐页修复。

## 6. 后端二开位置

新增后端模块建议按下面顺序处理：

1. 在 `docs/sql` 追加数据库脚本。
2. 在 `apps/api/src/main/java/com/beike/platform/entity` 添加实体。
3. 在 `dto`、`vo` 添加请求和返回对象。
4. 在 `mapper` 添加 Mapper，并在 `resources/mapper` 添加 XML。
5. 在 `service` 和 `service/impl` 添加业务逻辑。
6. 在 `controller` 添加接口。
7. 回到前端补充 API 请求和页面。

当前后端主线为 `apps/api-py`（Python FastAPI）。`reference/microservices` 目录包含旧版 Spring Boot 参考代码，**不是当前主线后端**。

后端本地依赖：

```text
Python 3.12+
pip install -r apps/api-py/requirements.txt
MySQL（通过 .env 配置连接）
启动: cd apps/api-py && .\.venv\Scripts\python.exe main.py
```

生产环境通过 Docker Compose 部署（`ops/sandbox/docker-compose.yml`），无需本地安装 Java/Maven。

## 7. 清理规则

可直接忽略或重新生成：

- `node_modules`
- `dist`
- `.runtime`
- `target`
- `.m2`
- `*.log`

不要直接删除但可归档参考：

- `reference/microservices`
- `reference/frontend-legacy`
- 产品文档和 SQL 脚本

真正参与当前程序运行的目录只有：

- `apps/web`
- `apps/api`
- 根目录前端构建配置
- `start.bat`
