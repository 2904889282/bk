"""pytest 共享 fixtures — 测试客户端 + 数据库模拟"""
import pytest
from httpx import ASGITransport, AsyncClient
from main import app

@pytest.fixture
async def client():
    """FastAPI ASGI 测试客户端"""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c

@pytest.fixture
def admin_token():
    """模拟管理员 token（仅用于单元测试签名验证，不依赖真实登录）"""
    from config import settings
    from security import create_token
    return create_token(1, "admin", settings.jwt_access_expire_hours)

@pytest.fixture
def user_token():
    """模拟普通用户 token"""
    from config import settings
    from security import create_token
    return create_token(2, "user", settings.jwt_access_expire_hours)
