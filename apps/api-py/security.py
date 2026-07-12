from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt, JWTError
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from config import settings
import uuid

# 导入权限核心模块
from permissions import (
    is_admin as _is_admin, require_admin as _require_admin,
    verify_ownership, require_ownership, build_owner_filter,
    PermissionChecker, OWNER_NAME_FIELDS, OWNER_ID_FIELDS,
)

bearer = HTTPBearer(auto_error=False)

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(rounds=12)).decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False

def create_token(user_id: int, username: str, expire_hours: int, token_type: str = "access") -> str:
    return jwt.encode({
        "sub": str(user_id), "username": username, "jti": str(uuid.uuid4()),
        "type": token_type,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=expire_hours),
    }, settings.jwt_secret, algorithm="HS256")

def decode_token(token: str) -> Optional[dict]:
    try: return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except JWTError: return None

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer)):
    if not credentials:
        raise HTTPException(status_code=401, detail="未登录")
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Token无效或已过期")
    return {"id": int(payload["sub"]), "username": payload["username"], "jti": payload.get("jti", "")}

async def get_current_user_with_role(credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer)):
    """获取当前用户 + 角色 + 真实姓名 + 部门（用于数据权限过滤）

    优化：将三次独立查询（角色、用户详情、部门名称）通过 asyncio.gather 并行化，
    减少数据库往返次数。三个查询互不依赖，可同时执行。
    """
    import asyncio
    u = await get_current_user(credentials)
    from database import async_session
    from sqlalchemy import text
    async with async_session() as db:
        async def _fetch_roles():
            r = await db.execute(text(
                "SELECT r.code FROM sys_role r JOIN sys_user_role ur ON ur.role_id=r.id WHERE ur.user_id=:uid"
            ), {"uid": u["id"]})
            return [row[0] for row in r.all() if row[0]]

        async def _fetch_user_detail():
            r2 = await db.execute(text(
                "SELECT real_name, dept_id FROM sys_user WHERE id=:uid"
            ), {"uid": u["id"]})
            row2 = r2.first()
            return (row2[0] if row2 and row2[0] else u["username"],
                    row2[1] if row2 and row2[1] else None)

        # 前两个查询互不依赖，可并行执行
        roles, (real_name, dept_id) = await asyncio.gather(
            _fetch_roles(), _fetch_user_detail()
        )
        u["roles"] = roles
        u["realName"] = real_name
        u["deptId"] = dept_id

        # 部门名称依赖 deptId，但查询量小，串行执行即可
        if u.get("deptId"):
            r3 = await db.execute(text(
                "SELECT name FROM sys_dept WHERE id=:did"
            ), {"did": u["deptId"]})
            row3 = r3.first()
            u["deptName"] = row3[0] if row3 else None
        else:
            u["deptName"] = None

    return u

# ══════════════════════════════════════════════
#  向后兼容的旧 API（标记为 deprecated，内部转发给权限模块）
# ══════════════════════════════════════════════
def require_admin(user: dict):
    """要求管理员权限 (deprecated: 建议使用 permissions.require_admin)"""
    _require_admin(user)

def is_admin(user: dict) -> bool:
    """判断用户是否为管理员 (deprecated: 建议使用 permissions.is_admin)"""
    return _is_admin(user)

def verify_owner(user: dict, owner_field: str) -> bool:
    """
    (deprecated) 单字段所有权校验。
    新代码请使用 permissions.verify_ownership(user, resource, table_key)
    """
    from permissions import is_admin as p_is_admin
    if p_is_admin(user):
        return True
    real_name = user.get("realName", "")
    return bool(real_name and real_name == owner_field)

# ══════════════════════════════════════════════
#  新增：统一权限入口
# ══════════════════════════════════════════════
# 直接从 permissions 模块重新导出，路由中统一 import
__all__ = [
    'hash_password', 'verify_password', 'create_token', 'decode_token',
    'get_current_user', 'get_current_user_with_role',
    'require_admin', 'is_admin', 'verify_owner',
    # 新权限 API
    'verify_ownership', 'require_ownership', 'build_owner_filter',
    'PermissionChecker', 'OWNER_NAME_FIELDS', 'OWNER_ID_FIELDS',
]
