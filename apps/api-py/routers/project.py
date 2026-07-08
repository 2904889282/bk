from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models import BizProject, BizProjectPeriod, SysUser
from schemas import *
from security import get_current_user

router = APIRouter(tags=["项目"])

def project_to_dict(p):
    return {c.name: getattr(p, c.name) for c in p.__table__.columns}

@router.get("/api/project/page")
async def page(pageNum: int = 1, pageSize: int = 15, keyword: str = None,
               status: str = None, projectLevel: str = None, deptBelong: str = None,
               db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    q = select(BizProject).where(BizProject.is_deleted == 0)
    if keyword:
        q = q.where(or_(BizProject.project_name.contains(keyword), BizProject.client_name.contains(keyword)))
    if status: q = q.where(BizProject.project_status == status)
    if projectLevel: q = q.where(BizProject.project_level == projectLevel)
    if deptBelong: q = q.where(BizProject.dept_belong == deptBelong)
    q = q.order_by(BizProject.create_time.desc())
    count_q = select(func.count()).select_from(q.subquery())
    total = (await db.execute(count_q)).scalar()
    rows = (await db.execute(q.offset((pageNum-1)*pageSize).limit(pageSize))).scalars().all()
    return success({"records": [project_to_dict(r) for r in rows], "total": total})

@router.get("/api/project/{project_id}")
async def detail(project_id: int, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    r = await db.execute(select(BizProject).where(BizProject.id == project_id, BizProject.is_deleted == 0))
    p = r.scalar_one_or_none()
    if not p: return fail("项目不存在")
    return success(project_to_dict(p))

@router.post("/api/project")
async def create(dto: ProjectSaveDTO, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    p = BizProject(**dto.model_dump())
    db.add(p); await db.commit(); await db.refresh(p)
    return success(project_to_dict(p))

@router.put("/api/project/{project_id}")
async def update(project_id: int, dto: ProjectSaveDTO, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    await db.execute(select(BizProject).where(BizProject.id == project_id))
    r = (await db.execute(select(BizProject).where(BizProject.id == project_id))).scalar_one_or_none()
    if not r: return fail("项目不存在")
    for k, v in dto.model_dump(exclude_unset=True).items():
        setattr(r, k, v)
    await db.commit()
    return success()

@router.delete("/api/project/{project_id}")
async def delete(project_id: int, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    r = (await db.execute(select(BizProject).where(BizProject.id == project_id))).scalar_one_or_none()
    if not r: return fail("项目不存在")
    r.is_deleted = 1; await db.commit()
    return success()

# ==================== 月度期数 ====================

@router.get("/api/project-period/list/{project_id}")
async def period_list(project_id: int, db: AsyncSession = Depends(get_db)):
    q = select(BizProjectPeriod).where(BizProjectPeriod.project_id == project_id, BizProjectPeriod.is_deleted == 0).order_by(BizProjectPeriod.period_month.desc())
    rows = (await db.execute(q)).scalars().all()
    return success([project_to_dict(r) for r in rows])

@router.post("/api/project-period")
async def period_save(dto: ProjectPeriodDTO, db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(BizProjectPeriod).where(BizProjectPeriod.project_id == dto.projectId, BizProjectPeriod.period_month == dto.periodMonth))
    exist = r.scalar_one_or_none()
    if exist:
        for k, v in dto.model_dump(exclude_unset=True).items():
            setattr(exist, k, v)
        await db.commit(); await db.refresh(exist)
        return success(project_to_dict(exist))
    p = BizProjectPeriod(**dto.model_dump())
    db.add(p); await db.commit(); await db.refresh(p)
    return success(project_to_dict(p))

@router.delete("/api/project-period/{period_id}")
async def period_delete(period_id: int, db: AsyncSession = Depends(get_db)):
    r = (await db.execute(select(BizProjectPeriod).where(BizProjectPeriod.id == period_id))).scalar_one_or_none()
    if r: r.is_deleted = 1; await db.commit()
    return success()
