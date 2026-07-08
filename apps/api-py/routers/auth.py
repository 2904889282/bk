from fastapi import APIRouter, Depends, Request
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models import SysUser, SysRole, SysUserRole, SysRolePermission, SysPermission, SysDept, BizTalent
from schemas import *
from security import verify_password, hash_password, create_token, get_current_user
from config import settings
import random, time, collections

router = APIRouter(prefix="/api/auth", tags=["认证"])

_login_attempts = collections.defaultdict(list)

def check_rate_limit(ip: str) -> bool:
    now = time.time()
    _login_attempts[ip] = [t for t in _login_attempts[ip] if now - t < 60]
    if len(_login_attempts[ip]) >= 5:
        return False
    _login_attempts[ip].append(now)
    return True

@router.post("/login")
async def login(dto: LoginDTO, request: Request, db: AsyncSession = Depends(get_db)):
    ip = request.client.host if request.client else "unknown"
    if not check_rate_limit(ip):
        return fail("登录尝试过于频繁，请60秒后重试")
    result = await db.execute(select(SysUser).where(SysUser.username == dto.username))
    user = result.scalar_one_or_none()
    if not user or not verify_password(dto.password, user.password):
        return fail("用户名或密码错误")
    if user.status != 1:
        return fail("账号已被禁用")
    token = create_token(user.id, user.username, settings.jwt_access_expire_hours)
    refresh = create_token(user.id, user.username, settings.jwt_refresh_expire_days * 24)
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
    db.add(SysUserRole(user_id=user.id, role_id=3))
    # 人才池
    db.add(BizTalent(name=dto.realName or dto.username, role="外部人员", talent_type="external", status="normal", utilization=0))
    await db.commit()
    return success()

@router.get("/userinfo")
async def user_info(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(SysUser).where(SysUser.id == user["id"]))
    u = r.scalar_one_or_none()
    if not u: return fail("用户不存在")
    rr = await db.execute(select(SysRole.code).select_from(SysUserRole).join(SysRole).where(SysUserRole.user_id == u.id))
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
    r = await db.execute(select(SysUser).where(SysUser.email == dto.email))
    if not r.scalar_one_or_none(): return fail("该邮箱未绑定账号")
    code = str(random.randint(100000, 999999))
    return success({"message": "验证码已发送", "code": code})

@router.post("/reset-password")
async def reset_password(dto: ResetPasswordDTO, db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(SysUser).where(SysUser.email == dto.email))
    u = r.scalar_one_or_none()
    if not u: return fail("用户不存在")
    u.password = hash_password(dto.newPassword)
    await db.commit()
    return success()
