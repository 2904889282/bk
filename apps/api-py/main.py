import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.chdir(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from routers import auth, project, biz, system, ltc
from database import engine

app = FastAPI(title="贝壳管理平台", version="2.0.0")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.include_router(auth.router)
app.include_router(project.router)
app.include_router(biz.router)
app.include_router(system.router)
app.include_router(ltc.router)

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
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)
