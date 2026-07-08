from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models import BizTalent, BizRisk, BizAlert, BizClue
from schemas import *
from security import get_current_user

router = APIRouter(tags=["业务模块"])

def row_to_dict(r):
    return {c.name: getattr(r, c.name) for c in r.__table__.columns}

# ==================== 人才 ====================

@router.get("/api/talent/page")
async def talent_page(pageNum: int = 1, pageSize: int = 15, keyword: str = None,
                      status: str = None, talentType: str = None,
                      db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    q = select(BizTalent).where(BizTalent.is_deleted == 0)
    if keyword: q = q.where(or_(BizTalent.name.contains(keyword), BizTalent.role.contains(keyword), BizTalent.skills.contains(keyword)))
    if status: q = q.where(BizTalent.status == status)
    if talentType: q = q.where(BizTalent.talent_type == talentType)
    q = q.order_by(BizTalent.create_time.desc())
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar()
    rows = (await db.execute(q.offset((pageNum-1)*pageSize).limit(pageSize))).scalars().all()
    return success({"records": [row_to_dict(r) for r in rows], "total": total})

@router.get("/api/talent/{talent_id}")
async def talent_detail(talent_id: int, db: AsyncSession = Depends(get_db)):
    r = (await db.execute(select(BizTalent).where(BizTalent.id == talent_id, BizTalent.is_deleted == 0))).scalar_one_or_none()
    return success(row_to_dict(r)) if r else fail("人才不存在")

@router.post("/api/talent")
async def talent_create(dto: TalentSaveDTO, db: AsyncSession = Depends(get_db)):
    t = BizTalent(**dto.model_dump())
    db.add(t); await db.commit(); await db.refresh(t)
    return success(row_to_dict(t))

@router.put("/api/talent/{talent_id}")
async def talent_update(talent_id: int, dto: TalentSaveDTO, db: AsyncSession = Depends(get_db)):
    r = (await db.execute(select(BizTalent).where(BizTalent.id == talent_id))).scalar_one_or_none()
    if not r: return fail("人才不存在")
    for k, v in dto.model_dump(exclude_unset=True).items(): setattr(r, k, v)
    await db.commit(); return success()

@router.delete("/api/talent/{talent_id}")
async def talent_delete(talent_id: int, db: AsyncSession = Depends(get_db)):
    r = (await db.execute(select(BizTalent).where(BizTalent.id == talent_id))).scalar_one_or_none()
    if r: r.is_deleted = 1; await db.commit()
    return success()

# ==================== 风险 ====================

@router.get("/api/risk/page")
async def risk_page(pageNum: int = 1, pageSize: int = 15, keyword: str = None,
                    projectId: int = None, level: str = None, status: str = None,
                    db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    q = select(BizRisk).where(BizRisk.is_deleted == 0)
    if keyword: q = q.where(or_(BizRisk.type.contains(keyword), BizRisk.description.contains(keyword)))
    if projectId: q = q.where(BizRisk.project_id == projectId)
    if level: q = q.where(BizRisk.level == level)
    if status: q = q.where(BizRisk.status == status)
    q = q.order_by(BizRisk.create_time.desc())
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar()
    rows = (await db.execute(q.offset((pageNum-1)*pageSize).limit(pageSize))).scalars().all()
    return success({"records": [row_to_dict(r) for r in rows], "total": total})

@router.get("/api/risk/{risk_id}")
async def risk_detail(risk_id: int, db: AsyncSession = Depends(get_db)):
    r = (await db.execute(select(BizRisk).where(BizRisk.id == risk_id))).scalar_one_or_none()
    return success(row_to_dict(r)) if r else fail("风险不存在")

@router.post("/api/risk")
async def risk_create(dto: RiskSaveDTO, db: AsyncSession = Depends(get_db)):
    r = BizRisk(**dto.model_dump()); db.add(r); await db.commit(); await db.refresh(r)
    return success(row_to_dict(r))

@router.put("/api/risk/{risk_id}")
async def risk_update(risk_id: int, dto: RiskSaveDTO, db: AsyncSession = Depends(get_db)):
    r = (await db.execute(select(BizRisk).where(BizRisk.id == risk_id))).scalar_one_or_none()
    if not r: return fail("风险不存在")
    for k, v in dto.model_dump(exclude_unset=True).items(): setattr(r, k, v)
    await db.commit(); return success()

@router.delete("/api/risk/{risk_id}")
async def risk_delete(risk_id: int, db: AsyncSession = Depends(get_db)):
    r = (await db.execute(select(BizRisk).where(BizRisk.id == risk_id))).scalar_one_or_none()
    if r: r.is_deleted = 1; await db.commit()
    return success()

# ==================== 预警 ====================

@router.get("/api/alert/page")
async def alert_page(pageNum: int = 1, pageSize: int = 15, keyword: str = None,
                     projectId: int = None, level: str = None, status: str = None,
                     db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    q = select(BizAlert).where(BizAlert.is_deleted == 0)
    if keyword: q = q.where(or_(BizAlert.type.contains(keyword), BizAlert.description.contains(keyword)))
    if projectId: q = q.where(BizAlert.project_id == projectId)
    if level: q = q.where(BizAlert.level == level)
    if status: q = q.where(BizAlert.status == status)
    q = q.order_by(BizAlert.create_time.desc())
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar()
    rows = (await db.execute(q.offset((pageNum-1)*pageSize).limit(pageSize))).scalars().all()
    return success({"records": [row_to_dict(r) for r in rows], "total": total})

@router.get("/api/alert/{alert_id}")
async def alert_detail(alert_id: int, db: AsyncSession = Depends(get_db)):
    r = (await db.execute(select(BizAlert).where(BizAlert.id == alert_id))).scalar_one_or_none()
    return success(row_to_dict(r)) if r else fail("预警不存在")

@router.post("/api/alert")
async def alert_create(dto: AlertSaveDTO, db: AsyncSession = Depends(get_db)):
    a = BizAlert(**dto.model_dump()); db.add(a); await db.commit(); await db.refresh(a)
    return success(row_to_dict(a))

@router.put("/api/alert/{alert_id}")
async def alert_update(alert_id: int, dto: AlertSaveDTO, db: AsyncSession = Depends(get_db)):
    r = (await db.execute(select(BizAlert).where(BizAlert.id == alert_id))).scalar_one_or_none()
    if not r: return fail("预警不存在")
    for k, v in dto.model_dump(exclude_unset=True).items(): setattr(r, k, v)
    await db.commit(); return success()

@router.delete("/api/alert/{alert_id}")
async def alert_delete(alert_id: int, db: AsyncSession = Depends(get_db)):
    r = (await db.execute(select(BizAlert).where(BizAlert.id == alert_id))).scalar_one_or_none()
    if r: r.is_deleted = 1; await db.commit()
    return success()

# ==================== 线索 ====================

@router.get("/api/clue/page")
async def clue_page(pageNum: int = 1, pageSize: int = 15, keyword: str = None,
                    status: str = None, clueLevel: str = None, deptBelong: str = None,
                    db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    q = select(BizClue).where(BizClue.is_deleted == 0)
    if keyword: q = q.where(or_(BizClue.clue_name.contains(keyword), BizClue.client_company.contains(keyword)))
    if status: q = q.where(BizClue.clue_status == status)
    if clueLevel: q = q.where(BizClue.clue_level == clueLevel)
    if deptBelong: q = q.where(BizClue.dept_belong == deptBelong)
    q = q.order_by(BizClue.create_time.desc())
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar()
    rows = (await db.execute(q.offset((pageNum-1)*pageSize).limit(pageSize))).scalars().all()
    return success({"records": [row_to_dict(r) for r in rows], "total": total})

@router.get("/api/clue/{clue_id}")
async def clue_detail(clue_id: int, db: AsyncSession = Depends(get_db)):
    r = (await db.execute(select(BizClue).where(BizClue.id == clue_id))).scalar_one_or_none()
    return success(row_to_dict(r)) if r else fail("线索不存在")

@router.post("/api/clue")
async def clue_create(dto: ClueSaveDTO, db: AsyncSession = Depends(get_db)):
    c = BizClue(**dto.model_dump()); db.add(c); await db.commit(); await db.refresh(c)
    return success(row_to_dict(c))

@router.put("/api/clue/{clue_id}")
async def clue_update(clue_id: int, dto: ClueSaveDTO, db: AsyncSession = Depends(get_db)):
    r = (await db.execute(select(BizClue).where(BizClue.id == clue_id))).scalar_one_or_none()
    if not r: return fail("线索不存在")
    for k, v in dto.model_dump(exclude_unset=True).items(): setattr(r, k, v)
    await db.commit(); return success()

@router.delete("/api/clue/{clue_id}")
async def clue_delete(clue_id: int, db: AsyncSession = Depends(get_db)):
    r = (await db.execute(select(BizClue).where(BizClue.id == clue_id))).scalar_one_or_none()
    if r: r.is_deleted = 1; await db.commit()
    return success()
