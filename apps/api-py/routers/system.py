from fastapi import APIRouter, Depends, Query, Body
from sqlalchemy import select, func, or_, text
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models import SysUser, SysRole, SysPermission, SysUserRole, SysRolePermission, SysDept, SysPosition, BizCampaign
from security import get_current_user, get_current_user_with_role, require_admin, hash_password
from schemas import success, fail

router = APIRouter(tags=["系统管理"])

def clamp_page(pageNum: int, pageSize: int):
    return max(1, pageNum), min(max(1, pageSize), 100)

def row_to_dict(r):
    return {c.name: getattr(r, c.name) for c in r.__table__.columns}

# ==================== 用户 ====================

@router.get("/api/user/page")
async def user_page(pageNum: int = 1, pageSize: int = 15, keyword: str = None, status: str = None,
                    deptId: int = None, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    require_admin(user)
    pageNum, pageSize = clamp_page(pageNum, pageSize)
    q = select(SysUser).where(SysUser.is_deleted == 0)
    if keyword: q = q.where(or_(SysUser.username.contains(keyword), SysUser.real_name.contains(keyword)))
    if status: q = q.where(SysUser.status == int(status))
    if deptId: q = q.where(SysUser.dept_id == deptId)
    q = q.order_by(SysUser.create_time.desc())
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar()
    rows = (await db.execute(q.offset((pageNum-1)*pageSize).limit(pageSize))).scalars().all()
    records = []
    for r in rows:
        d = row_to_dict(r)
        d.pop('password', None)
        rr = await db.execute(text("SELECT r.code FROM sys_role r JOIN sys_user_role ur ON ur.role_id=r.id WHERE ur.user_id=:uid"), {"uid": r.id})
        d['roles'] = [x[0] for x in rr.all() if x[0]]
        records.append(d)
    return success({"records": records, "total": total})

@router.get("/api/user/{user_id}")
async def user_detail(user_id: int, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    r = (await db.execute(select(SysUser).where(SysUser.id == user_id))).scalar_one_or_none()
    if not r: return fail("用户不存在")
    d = row_to_dict(r)
    d.pop('password', None)
    d.pop('is_deleted', None)
    return success(d)

@router.post("/api/user")
async def user_create(dto: dict = Body(...), db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(SysUser).where(SysUser.username == dto.get('username')))
    if r.scalar_one_or_none(): return fail("用户名已存在")
    user = SysUser(username=dto['username'], password=hash_password(dto.get('password','123456')),
                   real_name=dto.get('realName'), email=dto.get('email'), phone=dto.get('phone'),
                   status=dto.get('status',1), dept_id=dto.get('deptId'), role_type=dto.get('roleType','USER'))
    db.add(user); await db.flush()
    if dto.get('roleId'): db.add(SysUserRole(user_id=user.id, role_id=dto['roleId']))
    await db.commit()
    return success()

@router.put("/api/user/{user_id}")
async def user_update(user_id: int, dto: dict = Body(...), db: AsyncSession = Depends(get_db)):
    r = (await db.execute(select(SysUser).where(SysUser.id == user_id))).scalar_one_or_none()
    if not r: return fail("用户不存在")
    for k in ['realName','email','phone','status','deptId','roleType']:
        if dto.get(k) is not None: setattr(r, k if k != 'deptId' else 'dept_id', dto[k])
    await db.commit(); return success()

@router.put("/api/user/{user_id}/status")
async def user_toggle(user_id: int, db: AsyncSession = Depends(get_db)):
    r = (await db.execute(select(SysUser).where(SysUser.id == user_id))).scalar_one_or_none()
    if not r: return fail("用户不存在")
    r.status = 0 if r.status == 1 else 1; await db.commit()
    return success()

@router.put("/api/user/{user_id}/reset-password")
async def user_reset_pwd(user_id: int, db: AsyncSession = Depends(get_db)):
    r = (await db.execute(select(SysUser).where(SysUser.id == user_id))).scalar_one_or_none()
    if not r: return fail("用户不存在")
    r.password = hash_password("123456"); await db.commit()
    return success({"msg": "密码已重置为123456"})

# ==================== 角色 ====================

@router.get("/api/role/list")
async def role_list(db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    rows = (await db.execute(select(SysRole).where(SysRole.is_deleted == 0))).scalars().all()
    return success([row_to_dict(r) for r in rows])

@router.get("/api/role/{role_id}/permission")
async def role_perms(role_id: int, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    rows = await db.execute(select(SysRolePermission.permission_id).where(SysRolePermission.role_id == role_id))
    return success([r[0] for r in rows.all()])

@router.put("/api/role/permission")
async def assign_perms(dto: dict = Body(...), db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    role_id = dto.get('roleId')
    await db.execute(select(SysRolePermission).where(SysRolePermission.role_id == role_id))
    # delete existing
    existing = (await db.execute(select(SysRolePermission).where(SysRolePermission.role_id == role_id))).scalars().all()
    for e in existing: await db.delete(e)
    for pid in dto.get('permissionIds', []): db.add(SysRolePermission(role_id=role_id, permission_id=pid))
    await db.commit(); return success()

@router.get("/api/role/permission/all")
async def all_perms(db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    rows = (await db.execute(select(SysPermission).where(SysPermission.is_deleted == 0))).scalars().all()
    return success([row_to_dict(r) for r in rows])

# ==================== 部门（树形结构） ====================

@router.get("/api/dept/tree")
async def dept_tree(db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    rows = (await db.execute(select(SysDept).where(SysDept.is_deleted == 0).order_by(SysDept.sort_order))).scalars().all()
    dept_map = {}
    tree = []
    for r in rows:
        node = {"id": r.id, "name": r.name, "parentId": r.parent_id, "sortOrder": r.sort_order, "children": []}
        dept_map[r.id] = node
    for r in rows:
        if r.parent_id and r.parent_id in dept_map:
            dept_map[r.parent_id]["children"].append(dept_map[r.id])
        else:
            tree.append(dept_map[r.id])
    # 清理空 children
    def clean_children(nodes):
        for n in nodes:
            if not n.get("children"):
                del n["children"]
            else:
                clean_children(n["children"])
    clean_children(tree)
    return success(tree)

@router.get("/api/dept/list")
async def dept_list(db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    rows = (await db.execute(select(SysDept).where(SysDept.is_deleted == 0).order_by(SysDept.sort_order))).scalars().all()
    return success([row_to_dict(r) for r in rows])

@router.post("/api/dept")
async def dept_create(data: dict = Body(...), db: AsyncSession = Depends(get_db), user=Depends(require_admin)):
    dept = SysDept(name=data["name"], parent_id=data.get("parentId"), sort_order=data.get("sortOrder", 0))
    db.add(dept); await db.commit(); await db.refresh(dept)
    return success(row_to_dict(dept))

@router.put("/api/dept/{dept_id}")
async def dept_update(dept_id: int, data: dict = Body(...), db: AsyncSession = Depends(get_db), user=Depends(require_admin)):
    dept = (await db.execute(select(SysDept).where(SysDept.id == dept_id))).scalar_one_or_none()
    if not dept: return fail("部门不存在")
    if "name" in data: dept.name = data["name"]
    if "parentId" in data: dept.parent_id = data["parentId"]
    if "sortOrder" in data: dept.sort_order = data["sortOrder"]
    await db.commit()
    return success(row_to_dict(dept))

@router.delete("/api/dept/{dept_id}")
async def dept_delete(dept_id: int, db: AsyncSession = Depends(get_db), user=Depends(require_admin)):
    # 检查子部门
    sub = await db.execute(select(SysDept).where(SysDept.parent_id == dept_id, SysDept.is_deleted == 0))
    if sub.scalars().first(): return fail("请先删除子部门")
    dept = (await db.execute(select(SysDept).where(SysDept.id == dept_id))).scalar_one_or_none()
    if not dept: return fail("部门不存在")
    dept.is_deleted = 1; await db.commit()
    return success()

@router.get("/api/dept/users")
async def dept_users(db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    rows = (await db.execute(select(SysUser.id, SysUser.username, SysUser.real_name, SysUser.dept_id).where(SysUser.is_deleted == 0, SysUser.status == 1))).all()
    return success([{"id": r[0], "username": r[1], "realName": r[2], "deptId": r[3]} for r in rows])

# ==================== 职位 ====================

@router.get("/api/position/list")
async def position_list(db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    rows = (await db.execute(select(SysPosition).where(SysPosition.is_deleted == 0).order_by(SysPosition.sort_order))).scalars().all()
    return success([row_to_dict(r) for r in rows])

@router.post("/api/position")
async def position_create(data: dict = Body(...), db: AsyncSession = Depends(get_db), user=Depends(require_admin)):
    pos = SysPosition(name=data["name"], sort_order=data.get("sortOrder", 0))
    db.add(pos); await db.commit(); await db.refresh(pos)
    return success(row_to_dict(pos))

@router.put("/api/position/{pos_id}")
async def position_update(pos_id: int, data: dict = Body(...), db: AsyncSession = Depends(get_db), user=Depends(require_admin)):
    pos = (await db.execute(select(SysPosition).where(SysPosition.id == pos_id))).scalar_one_or_none()
    if not pos: return fail("职位不存在")
    if "name" in data: pos.name = data["name"]
    if "sortOrder" in data: pos.sort_order = data["sortOrder"]
    await db.commit()
    return success(row_to_dict(pos))

@router.delete("/api/position/{pos_id}")
async def position_delete(pos_id: int, db: AsyncSession = Depends(get_db), user=Depends(require_admin)):
    pos = (await db.execute(select(SysPosition).where(SysPosition.id == pos_id))).scalar_one_or_none()
    if not pos: return fail("职位不存在")
    pos.is_deleted = 1; await db.commit()
    return success()

# ==================== 日志 ====================

@router.get("/api/log/page")
async def log_page(pageNum: int = 1, pageSize: int = 15, keyword: str = None,
                   db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    # sys_operation_log table
    from sqlalchemy import text
    sql = "SELECT * FROM sys_operation_log"
    params = {}
    if keyword:
        sql += " WHERE user_name LIKE :kw OR action LIKE :kw2"; params = {"kw": f"%{keyword}%", "kw2": f"%{keyword}%"}
    sql += " ORDER BY create_time DESC LIMIT :limit OFFSET :offset"
    params.update({"limit": pageSize, "offset": (pageNum-1)*pageSize})
    rows = (await db.execute(text(sql), params)).mappings().all()
    cnt = (await db.execute(text("SELECT COUNT(*) FROM sys_operation_log"), {} if not keyword else {"kw": f"%{keyword}%", "kw2": f"%{keyword}%"})).scalar()
    return success({"records": [dict(r) for r in rows], "total": cnt})

# ==================== 回收站 ====================

@router.get("/api/recycle/page")
async def recycle_page(pageNum: int = 1, pageSize: int = 15, bizType: str = None,
                       db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    results = []; total = 0
    for tbl, name_col in [("biz_clue", "clue_name"), ("biz_project", "project_name"), ("biz_talent", "name"), ("biz_risk", "type")]:
        sql = f"SELECT id, '{tbl}' as biz_type, {name_col} as item_name, update_time FROM {tbl} WHERE is_deleted = 1"
        if bizType and bizType != tbl: continue
        rows = (await db.execute(text(sql))).mappings().all()
        for r in rows: results.append(dict(r))
        total += len(results)
    return success({"records": results, "total": total})

@router.put("/api/recycle/restore")
async def recycle_restore(dto: dict = Body(...), db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    await db.execute(text(f"UPDATE {dto['bizType']} SET is_deleted = 0 WHERE id = :id"), {"id": dto["id"]})
    await db.commit(); return success()

@router.delete("/api/recycle/perm")
async def recycle_perm_delete(dto: dict = Body(...), db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    await db.execute(text(f"DELETE FROM {dto['bizType']} WHERE id = :id"), {"id": dto["id"]})
    await db.commit(); return success()
