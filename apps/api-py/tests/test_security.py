"""安全模块测试 — require_admin / 权限校验 / Token刷新 / CORS"""
import pytest
from security import require_admin

# ==================== 1. require_admin ====================

class TestRequireAdmin:
    def test_admin_passes(self):
        """ROLE_ADMIN 用户通过检查"""
        user = {"id": 1, "username": "admin", "roles": ["ROLE_ADMIN"]}
        require_admin(user)  # 不应抛异常

    def test_non_admin_raises(self):
        """非管理员用户应抛出 HTTPException"""
        user = {"id": 2, "username": "user", "roles": ["ROLE_USER"]}
        with pytest.raises(Exception) as exc:
            require_admin(user)
        assert exc.value.status_code == 403

    def test_empty_roles_raises(self):
        """无角色用户应抛异常"""
        user = {"id": 3, "username": "guest", "roles": []}
        with pytest.raises(Exception) as exc:
            require_admin(user)
        assert exc.value.status_code == 403


# ==================== 2. Token 刷新 ====================

@pytest.mark.asyncio
async def test_refresh_without_token_fails(client):
    """无 refreshToken 时应失败"""
    resp = await client.post("/api/auth/refresh", json={})
    assert resp.status_code == 200
    data = resp.json()
    assert data["code"] == 400  # 业务错误码


# ==================== 3. CORS 域名白名单 ====================

def test_cors_not_allow_all():
    """确认 CORS 不再是 allow_origins=['*']"""
    from main import _ALLOWED_ORIGINS
    assert "*" not in _ALLOWED_ORIGINS
    assert len(_ALLOWED_ORIGINS) > 0
    # CORS 白名单应为具体域名（含 localhost），不检查生产IP（由环境变量注入）


# ==================== 4. 密码重置认证保护 ====================

@pytest.mark.asyncio
async def test_reset_password_without_code_fails(client):
    """无验证码时重置密码应失败"""
    resp = await client.post("/api/auth/reset-password", json={
        "email": "admin@beike.com",
        "code": "",  # 空验证码
        "newPassword": "newPass123456"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["code"] == 400  # 验证码无效


# ==================== 5. 密码策略 ====================

class TestPasswordPolicy:
    def test_short_password_rejected(self):
        from schemas import PasswordDTO
        with pytest.raises(Exception):
            PasswordDTO(oldPassword="oldpass12", newPassword="1234567")

    def test_register_short_password_rejected(self):
        from schemas import RegisterDTO
        with pytest.raises(Exception):
            RegisterDTO(username="test", password="short")


# ==================== 6. 回收站白名单 ====================

class TestRecycleWhitelist:
    def test_valid_tables_accepted(self):
        from routers.system import _validate_biz_type
        assert _validate_biz_type("biz_clue") is True
        assert _validate_biz_type("biz_project") is True

    def test_invalid_tables_rejected(self):
        from routers.system import _validate_biz_type
        assert _validate_biz_type("sys_user") is False
        assert _validate_biz_type("DROP TABLE") is False
        assert _validate_biz_type("biz_clue; --") is False
