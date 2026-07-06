# Beike Admin

贝壳统一管理平台当前按“前端应用 + 后端接口 + 运维资料 + 参考代码”整理。

日常二次开发只需要关注：

- `apps/web`: React 前端
- `apps/api`: Spring Boot 后端
- `docs/sql`: 数据库初始化和升级脚本
- `ops`: 部署、网关、监控、日志等运维资料

参考或历史方案已从主程序目录移出到 `reference`，避免干扰当前开发。

## 本地启动

一键启动：

```bash
start.bat
```

前端单独启动：

```bash
pnpm dev
```

前端访问地址：

```text
http://localhost:5173/
```

后端接口端口：

```text
http://localhost:8080/
```

注意：`8080` 是后端 API 端口，不是前端页面入口。

## 构建

```bash
pnpm build
```

## 二开文档

完整工程结构、文件分类和后续简化建议见：

```text
docs/ENGINEERING_GUIDE.md
```
