from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt, JWTError
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from config import settings
import uuid

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
    """获取当前用户 + 角色 + 真实姓名 + 部门"""
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

        roles, (real_name, dept_id) = await asyncio.gather(
            _fetch_roles(), _fetch_user_detail()
        )
        u["roles"] = roles
        u["realName"] = real_name
        u["deptId"] = dept_id
        u["deptName"] = None

        if u.get("deptId"):
            r3 = await db.execute(text(
                "SELECT name FROM sys_dept WHERE id=:did"
            ), {"did": u["deptId"]})
            row3 = r3.first()
            u["deptName"] = row3[0] if row3 else None

    return u


def is_admin(user: dict) -> bool:
    """判断用户是否为管理员"""
    return "ROLE_ADMIN" in user.get("roles", [])


def require_admin(user: dict):
    """要求管理员权限"""
    if not is_admin(user):
        raise HTTPException(status_code=403, detail="仅管理员可操作")


def verify_owner(user: dict, owner_field: str) -> bool:
    """单字段所有权校验"""
    if is_admin(user):
        return True
    real_name = user.get("realName", "")
    return bool(real_name and real_name == owner_field)
