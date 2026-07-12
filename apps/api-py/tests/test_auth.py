"""认证模块安全测试 — 登录/注册/JWT/密码哈希/验证码 (Phase 1 P0)"""
import pytest
from security import hash_password, verify_password, create_token, decode_token

# ==================== 1. 密码哈希 (bcrypt rounds=12) ====================

class TestPasswordHashing:
    def test_hash_produces_different_hash(self):
        h1 = hash_password("test123456")
        h2 = hash_password("test123456")
        assert h1 != h2  # bcrypt salt 使每次哈希不同

    def test_verify_correct_password(self):
        hashed = hash_password("correct123")
        assert verify_password("correct123", hashed) is True

    def test_verify_wrong_password(self):
        hashed = hash_password("correct123")
        assert verify_password("wrong45678", hashed) is False

    def test_password_min_length_8(self):
        """注册/修改密码至少8位"""
        from schemas import RegisterDTO, PasswordDTO
        import pytest as pt
        with pt.raises(Exception):
            RegisterDTO(username="test", password="1234567")
        with pt.raises(Exception):
            PasswordDTO(oldPassword="oldpass12", newPassword="1234567")

    def test_password_hash_format(self):
        """确认 bcrypt 输出格式 """
        h = hash_password("test123456")
        assert h.startswith("$2b$")  # bcrypt hash prefix


# ==================== 2. JWT 令牌 ====================

class TestJWTToken:
    def test_create_and_decode(self):
        token = create_token(42, "admin", 1)
        payload = decode_token(token)
        assert payload is not None
        assert payload["sub"] == "42"
        assert payload["username"] == "admin"

    def test_expired_token(self):
        """过期 token 应返回 None"""
        from security import decode_token
        # 创建马上过期的 token
        from jose import jwt
        from config import settings
        from datetime import datetime, timedelta, timezone
        expire = datetime.now(timezone.utc) - timedelta(hours=1)
        token = jwt.encode({"sub": "1", "username": "x", "exp": expire}, settings.jwt_secret, algorithm="HS256")
        assert decode_token(token) is None

    def test_invalid_token_is_none(self):
        assert decode_token("not.a.valid.token") is None
        assert decode_token("") is None

    def test_token_contains_jti(self):
        """安全需求：Token 包含 jti 用于吊销"""
        from security import decode_token
        token = create_token(1, "admin", 1)
        payload = decode_token(token)
        assert "jti" in payload, "Token 缺少 jti（无法支持吊销机制）"
        assert len(payload["jti"]) > 0

    def test_mock_token_rejected(self):
        """mock_xxx token 应被快速拒绝"""
        from security import decode_token
        assert decode_token("mock_12345678") is None


# ==================== 3. 验证码存储 ====================

class TestVerificationCode:
    def test_generate_and_verify(self):
        from security_code import code_store
        code = code_store.generate("test@beike.com")
        assert len(code) == 6
        assert code.isdigit()
        assert code_store.verify("test@beike.com", code) is True

    def test_wrong_code_rejected(self):
        from security_code import code_store
        code_store.generate("test2@beike.com")
        assert code_store.verify("test2@beike.com", "000000") is False

    def test_one_time_use(self):
        """验证码一次性使用，验证后删除"""
        from security_code import code_store
        code = code_store.generate("test3@beike.com")
        assert code_store.verify("test3@beike.com", code) is True
        assert code_store.verify("test3@beike.com", code) is False  # 已删除

    def test_nonexistent_email(self):
        from security_code import code_store
        assert code_store.verify("never@sent.com", "123456") is False


# ==================== 4. 健康检查 ====================

@pytest.mark.asyncio
async def test_health_check(client):
    resp = await client.get("/api/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "healthy"
    assert body["database"] == "connected"


# ==================== 5. 未认证访问拦截 ====================

@pytest.mark.asyncio
async def test_unauthenticated_access_blocked(client):
    """未认证用户访问受保护端点应返回 401"""
    resp = await client.get("/api/user/page")
    assert resp.status_code == 401

    resp = await client.get("/api/project/page")
    assert resp.status_code == 401

    resp = await client.get("/api/clue/page")
    assert resp.status_code == 401


# ==================== 6. send-code 检查 (不返回验证码) ====================

@pytest.mark.asyncio
async def test_send_code_no_code_in_response(client):
    """send-code 不应在 HTTP 响应中返回验证码明文"""
    resp = await client.post("/api/auth/send-code", json={"email": "admin@beike.com"})
    data = resp.json()
    # 响应中不应包含 "code" 字段
    assert "code" not in str(data.get("data", "")).lower() or data.get("code") is None
