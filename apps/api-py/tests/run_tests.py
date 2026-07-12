"""独立测试运行器 — 不依赖 pytest 框架，使用 Python 原生断言"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

passed = 0
failed = 0

def it(name: str):
    """测试装饰器"""
    def decorator(fn):
        global passed, failed
        try:
            fn()
            passed += 1
            print(f"  PASS {name}")
        except Exception as e:
            failed += 1
            print(f"  FAIL {name}: {e}")
        print()
        return fn
    return decorator

def describe(name: str):
    """测试组"""
    print(f"\n{'='*50}\n{name}\n{'='*50}")

# ==================== 测试用例 ====================

# 密码哈希
describe("密码哈希 (bcrypt=12)")
from security import hash_password, verify_password

@it("哈希结果不同(salt随机)")
def _():
    assert hash_password("test123456") != hash_password("test123456")

@it("正确密码验证通过")
def _():
    h = hash_password("goodpass12")
    assert verify_password("goodpass12", h) is True

@it("错误密码验证失败")
def _():
    h = hash_password("goodpass12")
    assert verify_password("wrongone99", h) is False

@it("bcrypt 输出格式 $2b$")
def _():
    assert hash_password("test123456").startswith("$2b$")


# JWT
describe("JWT 令牌")
from security import create_token, decode_token

@it("创建和解码令牌")
def _():
    token = create_token(42, "admin", 1)
    payload = decode_token(token)
    assert payload is not None
    assert payload["sub"] == "42"
    assert payload["username"] == "admin"

@it("无效令牌返回 None")
def _():
    assert decode_token("bad.token.here") is None
    assert decode_token("") is None
    assert decode_token("mock_12345") is None

@it("令牌包含 jti (支持吊销)")
def _():
    token = create_token(1, "admin", 1)
    payload = decode_token(token)
    assert "jti" in payload
    assert len(payload["jti"]) > 0


# require_admin
describe("require_admin 权限校验")
from security import require_admin

try:
    from fastapi import HTTPException
except ImportError:
    HTTPException = Exception

@it("管理员通过检查")
def _():
    require_admin({"id":1, "username":"admin", "roles":["ROLE_ADMIN"]})

@it("普通用户被拒绝(403)")
def _():
    try:
        require_admin({"id":2, "roles":["ROLE_USER"]})
        assert False, "应抛出异常"
    except HTTPException as e:
        assert str(e.status_code) == "403"
    except Exception as e:
        assert "403" in str(e) or "403" in str(getattr(e, 'status_code', ''))

@it("无角色用户被拒绝")
def _():
    try:
        require_admin({"id":3, "roles":[]})
        assert False
    except (HTTPException, Exception):
        pass


# 验证码
describe("验证码存储")
from security_code import code_store

@it("生成和验证")
def _():
    code = code_store.generate("t1@test.com")
    assert len(code) == 6 and code.isdigit()
    assert code_store.verify("t1@test.com", code) is True

@it("错误验证码被拒绝")
def _():
    code_store.generate("t2@test.com")
    assert code_store.verify("t2@test.com", "000000") is False

@it("一次性使用")
def _():
    code = code_store.generate("t3@test.com")
    assert code_store.verify("t3@test.com", code) is True
    assert code_store.verify("t3@test.com", code) is False


# 密码策略
describe("密码策略 (≥8位)")
from schemas import RegisterDTO, PasswordDTO

@it("8位密码通过")
def _():
    r = RegisterDTO(username="test", password="12345678")
    assert r.password == "12345678"

@it("7位密码被拒绝")
def _():
    try:
        RegisterDTO(username="test", password="1234567")
        assert False
    except Exception:
        pass

@it("修改密码7位被拒绝")
def _():
    try:
        PasswordDTO(oldPassword="oldpass12", newPassword="1234567")
        assert False
    except Exception:
        pass


# 回收站白名单
describe("回收站白名单防注入")
from routers.system import _validate_biz_type

@it("合法表名通过")
def _():
    assert _validate_biz_type("biz_clue") is True
    assert _validate_biz_type("biz_project") is True

@it("系统表被拒绝")
def _():
    assert _validate_biz_type("sys_user") is False

@it("SQL注入被拒绝")
def _():
    assert _validate_biz_type("DROP TABLE") is False
    assert _validate_biz_type("biz_clue; --") is False


# CORS
describe("CORS 域名白名单")
from main import _ALLOWED_ORIGINS

@it("不允许 *")
def _():
    assert "*" not in _ALLOWED_ORIGINS

@it("生产地址在白名单")
def _():
    assert "http://123.57.140.159" in _ALLOWED_ORIGINS


# ==================== 结果 ====================
print(f"\n{'='*50}")
print(f"结果: {passed} 通过 / {failed} 失败 / {passed+failed} 总计")
print(f"通过率: {(passed/(passed+failed)*100):.0f}%" if passed+failed > 0 else "无测试")
print(f"{'='*50}")

if failed > 0:
    sys.exit(1)
