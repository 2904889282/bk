import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.chdir(os.path.dirname(os.path.abspath(__file__)))

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy import text
from routers import auth, project, biz, system, ltc
from database import engine

# 全局请求体大小限制（排除文件上传接口）
_MAX_BODY_SIZE = 10 * 1024 * 1024  # 10MB
_EXCLUDED_PATHS = ("/api/clue/import", "/api/attachment/upload")

class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method in ("POST", "PUT", "PATCH"):
            if not any(request.url.path.startswith(p) for p in _EXCLUDED_PATHS):
                content_length = request.headers.get("content-length")
                if content_length and int(content_length) > _MAX_BODY_SIZE:
                    return JSONResponse(
                        status_code=413,
                        content={"code": 413, "msg": "请求体过大，最大允许 10MB", "data": None},
                    )
        return await call_next(request)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """启动时自动执行数据库迁移（幂等，不会重复执行）"""
    async with engine.begin() as conn:
        # sys_dept 加层级字段
        result = await conn.execute(text("SHOW COLUMNS FROM sys_dept LIKE 'parent_id'"))
        if not result.fetchone():
            await conn.execute(text("ALTER TABLE sys_dept ADD COLUMN parent_id BIGINT"))
            await conn.execute(text("ALTER TABLE sys_dept ADD COLUMN sort_order INT DEFAULT 0"))
            print("[migrate] sys_dept +parent_id +sort_order")

        # sys_position 表
        try:
            await conn.execute(text("SELECT 1 FROM sys_position LIMIT 1"))
        except Exception:
            await conn.execute(text("""
                CREATE TABLE sys_position (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(64) NOT NULL,
                    sort_order INT DEFAULT 0,
                    is_deleted INT DEFAULT 0
                )
            """))
            print("[migrate] sys_position created")

        # sys_user 加 position_id
        result = await conn.execute(text("SHOW COLUMNS FROM sys_user LIKE 'position_id'"))
        if not result.fetchone():
            await conn.execute(text("ALTER TABLE sys_user ADD COLUMN position_id BIGINT"))
            print("[migrate] sys_user +position_id")

    yield


app = FastAPI(title="贝壳管理平台", version="2.1.0", lifespan=lifespan)

# CORS: 仅允许已知的生产和开发域名
_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://123.57.140.159",
    "https://beike.example.com",
]
app.add_middleware(CORSMiddleware, allow_origins=_ALLOWED_ORIGINS, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.add_middleware(RequestSizeLimitMiddleware)

app.include_router(auth.router)
app.include_router(project.router)
app.include_router(biz.router)
app.include_router(system.router)
app.include_router(ltc.router)

# 统一请求参数校验错误处理
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    return JSONResponse(
        status_code=422,
        content={"code": 422, "msg": f"参数校验失败: {errors[0]['msg'] if errors else '未知错误'}", "data": None}
    )

# 兜底异常处理：防止内部错误直接暴露给前端
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    print(f"[ERROR] Unhandled exception: {traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={"code": 500, "msg": "系统内部错误，请联系管理员", "data": None}
    )

@app.get("/api/health")
async def health():
    """第一性原理：健康 = 进程存活 + 数据库可达。
    不检查其他依赖，因为数据库是最小阻塞点——DB 挂了任何业务接口都会 500。"""
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception:
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "database": "disconnected"},
        )

if __name__ == "__main__":
    import uvicorn
    reload_enabled = os.environ.get("ENV", "dev") == "dev"
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=reload_enabled)
