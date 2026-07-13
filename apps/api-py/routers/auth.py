from fastapi import APIRouter, Depends, Request, Body
from sqlalchemy import select, text, func
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models import SysUser, SysRole, SysUserRole, SysRolePermission, SysPermission, SysDept, BizTalent
from schemas import *
from security import verify_password, hash_password, create_token, decode_token, get_current_user
from config import settings
from security_code import code_store
import logging, time
from datetime import datetime, timezone, timedelta

logger = logging.getLogger("auth")

router = APIRouter(prefix="/api/auth", tags=["认证"])

async def check_rate_limit(db: AsyncSession, key: str, attempt_type: str = "login", max_attempts: int = 5, window_seconds: int = 60) -> bool:
    """DB-based rate limiter — gracefully degrades if table doesn't exist."""
    try:
        cutoff = datetime.now(timezone.utc) - timedelta(seconds=window_seconds)
        await db.execute(
            text("DELETE FROM sys_login_attempt WHERE create_time < :cutoff"),
            {"cutoff": cutoff}
        )
        count_result = await db.execute(
            text("SELECT COUNT(*) FROM sys_login_attempt WHERE `key`=:key AND attempt_type=:atype AND create_time >= :cutoff"),
            {"key": key, "atype": attempt_type, "cutoff": cutoff}
        )
        count = count_result.scalar() or 0
        if count >= max_attempts:
            return False
        await db.execute(
            text("INSERT INTO sys_login_attempt (`key`, attempt_type, create_time) VALUES (:key, :atype, :now)"),
            {"key": key, "atype": attempt_type, "now": datetime.now(timezone.utc)}
        )
        await db.commit()
    except Exception:
        await db.rollback()
        # Table doesn't exist — skip rate limiting gracefully
        pass
    return True

@router.post("/login")
async def login(dto: LoginDTO, request: Request, db: AsyncSession = Depends(get_db)):
    ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown").split(",")[0].strip()
    if not await check_rate_limit(db, ip, "login"):
        return fail("登录尝试过于频繁，请60秒后重试")
    result = await db.execute(select(SysUser).where(SysUser.username == dto.username))
    user = result.scalar_one_or_none()
    if not user or not verify_password(dto.password, user.password):
        return fail("用户名或密码错误")
    if user.status != 1:
        return fail("账号已被禁用")
    token = create_token(user.id, user.username, settings.jwt_access_expire_hours, "access")
    refresh = create_token(user.id, user.username, settings.jwt_refresh_expire_days * 24, "refresh")
    # 角色（raw SQL 避免 join 歧义）
    from sqlalchemy import text
    rr = await db.execute(text("SELECT r.code FROM sys_role r JOIN sys_user_role ur ON ur.role_id=r.id WHERE ur.user_id=:uid AND r.is_deleted=0"), {"uid": user.id})
    roles = [r[0] for r in rr.all() if r[0]]
    # 权限
    pr = await db.execute(text("SELECT DISTINCT p.code FROM sys_permission p JOIN sys_role_permission rp ON rp.permission_id=p.id JOIN sys_user_role ur ON ur.role_id=rp.role_id WHERE ur.user_id=:uid AND p.is_deleted=0"), {"uid": user.id})
    perms = [p[0] for p in pr.all() if p[0]]
    return success({
        "token": token, "refreshToken": refresh,
        "user": {"id": user.id, "username": user.username, "name": user.real_name, "realName": user.real_name, "roles": roles, "permissions": perms},
        "roles": roles, "permissions": perms,
    })

@router.post("/register")
async def register(dto: RegisterDTO, db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(SysUser).where(SysUser.username == dto.username))
    if r.scalar_one_or_none():
        return fail("用户名已存在")
    dept_id = dto.deptId
    if dto.deptName and dto.deptName.strip():
        dr = await db.execute(select(SysDept).where(SysDept.name == dto.deptName.strip()))
        dept = dr.scalar_one_or_none()
        if not dept:
            dept = SysDept(name=dto.deptName.strip())
            db.add(dept); await db.flush()
        dept_id = dept.id
    user = SysUser(username=dto.username, password=hash_password(dto.password),
                   real_name=dto.realName, email=dto.email, status=1,
                   dept_id=dept_id, role_type="USER")
    db.add(user); await db.flush()
    # 查询默认角色（优先 ROLE_USER，回退 role_id=3）
    default_role = (await db.execute(select(SysRole).where(SysRole.code == "ROLE_USER", SysRole.is_deleted == 0))).scalar_one_or_none()
    if default_role:
        db.add(SysUserRole(user_id=user.id, role_id=default_role.id))
    else:
        logger.warning("默认角色 ROLE_USER 不存在，回退使用 role_id=3")
        db.add(SysUserRole(user_id=user.id, role_id=3))
    # 人才池
    db.add(BizTalent(name=dto.realName or dto.username, role="外部人员", talent_type="external", status="normal", utilization=0))
    await db.commit()
    return success()

@router.post("/refresh")
async def refresh_token(dto: dict = Body(...)):
    token = dto.get("refreshToken")
    if not token: return fail("缺少refreshToken")
    payload = decode_token(token)
    if not payload: return fail("refreshToken无效或已过期")
    if payload.get("type") != "refresh":
        return fail("仅支持refreshToken刷新，请使用正确的token类型")
    new_token = create_token(int(payload["sub"]), payload["username"], settings.jwt_access_expire_hours, "access")
    new_refresh = create_token(int(payload["sub"]), payload["username"], settings.jwt_refresh_expire_days * 24, "refresh")
    return success({"token": new_token, "refreshToken": new_refresh})

@router.get("/userinfo")
async def user_info(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(SysUser).where(SysUser.id == user["id"]))
    u = r.scalar_one_or_none()
    if not u: return fail("用户不存在")
    rr = await db.execute(text("SELECT r.code FROM sys_role r JOIN sys_user_role ur ON ur.role_id=r.id WHERE ur.user_id=:uid AND r.is_deleted=0"), {"uid": u.id})
    roles = [x[0] for x in rr.all() if x[0]]
    return success({"user": {"id": u.id, "username": u.username, "name": u.real_name, "realName": u.real_name, "roles": roles}, "roles": roles})

@router.put("/password")
async def change_password(dto: PasswordDTO, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(SysUser).where(SysUser.id == user["id"]))
    u = r.scalar_one_or_none()
    if not verify_password(dto.oldPassword, u.password): return fail("原密码不正确")
    u.password = hash_password(dto.newPassword)
    await db.commit()
    return success()

@router.post("/send-code")
async def send_code(dto: SendCodeDTO, db: AsyncSession = Depends(get_db)):
    """验证码发送 — 仅通过邮件实际发送，不通过 HTTP 响应返回。
    TODO: 接入 SMTP / 阿里云邮件服务实现实际发送"""
    # 频率限制：同一邮箱 60 秒内最多 3 次
    if not await check_rate_limit(db, dto.email, "send_code", max_attempts=3):
        return fail("验证码发送过于频繁，请60秒后重试")
    r = await db.execute(select(SysUser).where(SysUser.email == dto.email))
    if not r.scalar_one_or_none():
        return fail("该邮箱未绑定账号")
    code = code_store.generate(dto.email)
    logger.info(f"Verification code sent to {dto.email}")
    # TODO: 接入邮件服务后，改为 send_email(to=dto.email, code=code)
    return success({"message": "验证码已发送至注册邮箱，请查收"})

@router.post("/reset-password")
async def reset_password(dto: ResetPasswordDTO, db: AsyncSession = Depends(get_db)):
    """密码重置 — 必须先通过 send-code 获取验证码"""
    if not dto.code or not code_store.verify(dto.email, dto.code):
        return fail("验证码无效或已过期")
    r = await db.execute(select(SysUser).where(SysUser.email == dto.email))
    u = r.scalar_one_or_none()
    if not u:
        return fail("用户不存在")
    u.password = hash_password(dto.newPassword)
    await db.commit()
    return success({"message": "密码已重置，请使用新密码登录"})
