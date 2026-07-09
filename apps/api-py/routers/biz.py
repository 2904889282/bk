from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, or_, text, and_
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models import BizTalent, BizRisk, BizAlert, BizClue, BizCampaign, BizProject
from schemas import *
from security import get_current_user_with_role
from datetime import date, datetime

router = APIRouter(tags=["业务模块"])

def _to_camel(d):
    result = {}
    for k, v in d.items():
        parts = k.split('_')
        camel = parts[0] + ''.join(w.capitalize() for w in parts[1:])
        result[camel] = v
    return result

def row_to_dict(r):
    d = {c.key: getattr(r, c.key) for c in r.__table__.columns}
    return _to_camel(d)

def clamp_page(pageNum: int, pageSize: int):
    return max(1, pageNum), min(max(1, pageSize), 100)

# ==================== 人才 ====================

@router.get("/api/talent/page")
async def talent_page(pageNum: int = 1, pageSize: int = 15, keyword: str = None,
                      status: str = None, talentType: str = None,
                      db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    pageNum, pageSize = clamp_page(pageNum, pageSize)
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
    data = dto.model_dump(exclude_none=True)
    m = {"talentType":"talent_type", "currentProject":"current_project"}
    t = BizTalent(**{m.get(k,k):v for k,v in data.items()})
    db.add(t); await db.commit(); await db.refresh(t)
    return success(row_to_dict(t))

@router.put("/api/talent/{talent_id}")
async def talent_update(talent_id: int, dto: TalentSaveDTO, db: AsyncSession = Depends(get_db)):
    r = (await db.execute(select(BizTalent).where(BizTalent.id == talent_id))).scalar_one_or_none()
    if not r: return fail("人才不存在")
    m = {"talentType":"talent_type", "currentProject":"current_project"}
    for k, v in dto.model_dump(exclude_unset=True).items():
        setattr(r, m.get(k, k), v)
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
                    db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    pageNum, pageSize = clamp_page(pageNum, pageSize)
    q = select(BizRisk).where(BizRisk.is_deleted == 0)
    is_admin = "ROLE_ADMIN" in user.get("roles", [])
    if not is_admin and user.get("realName"):
        q = q.where(BizRisk.owner == user["realName"])
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
    data = dto.model_dump(exclude_none=True)
    m = {"projectId":"project_id"}
    r = BizRisk(**{m.get(k,k):v for k,v in data.items()})
    db.add(r); await db.commit(); await db.refresh(r)
    return success(row_to_dict(r))

@router.put("/api/risk/{risk_id}")
async def risk_update(risk_id: int, dto: RiskSaveDTO, db: AsyncSession = Depends(get_db)):
    r = (await db.execute(select(BizRisk).where(BizRisk.id == risk_id))).scalar_one_or_none()
    if not r: return fail("风险不存在")
    m = {"projectId":"project_id"}
    for k, v in dto.model_dump(exclude_unset=True).items():
        setattr(r, m.get(k, k), v)
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
                     db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    pageNum, pageSize = clamp_page(pageNum, pageSize)
    q = select(BizAlert).where(BizAlert.is_deleted == 0)
    is_admin = "ROLE_ADMIN" in user.get("roles", [])
    if not is_admin and user.get("realName"):
        q = q.where(BizAlert.manager == user["realName"])
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
                    db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    pageNum, pageSize = clamp_page(pageNum, pageSize)
    q = select(BizClue).where(BizClue.is_deleted == 0)
    is_admin = "ROLE_ADMIN" in user.get("roles", [])
    if not is_admin and user.get("realName"):
        q = q.where(BizClue.beike_owner == user["realName"])
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
async def clue_create(dto: ClueSaveDTO, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    data = dto.model_dump(exclude_none=True)
    key_map = {"clueName":"clue_name","clientCompany":"client_company","clientDept":"client_dept",
               "clientContact":"client_contact","beikeOwner":"beike_owner","budgetAmount":"budget_amount",
               "clueLevel":"clue_level","clueStatus":"clue_status","reviewStatus":"review_status",
               "businessConfirmed":"business_confirmed","contactDate":"contact_date",
               "createDate":"create_date","requirementDesc":"requirement_desc",
               "expectedTarget":"expected_target","deptBelong":"dept_belong",
               "opportunityAmount":"opportunity_amount","clueEvaluation":"clue_evaluation",
               "sourceType":"source_type","sourceActivityName":"source_activity_name",
               "clientCircle":"client_circle","valueQuadrant":"value_quadrant",
               "healthStatus":"health_status","proposalDate":"proposal_date",
               "campaignId":"campaign_id","maintenanceFreq":"maintenance_freq",
               "nextMaintenanceDate":"next_maintenance_date",
               "painPoint":"pain_point"}
    mapped = {key_map.get(k, k): v for k, v in data.items()}
    # 前端多余字段（commRecord, relation, matchedProducts等）存入 extra_data
    extra = {}
    for k, v in data.items():
        if k not in key_map and k not in ["budget"]:
            extra[k] = v
    if extra:
        import json
        mapped["extra_data"] = json.dumps(extra)
    # 设置创建人
    mapped["create_by"] = user["id"]
    # 财务数据自动计算
    actual_fields = {}
    if "budgetAmount" in data and data["budgetAmount"]:
        actual_fields["budget_amount"] = data["budgetAmount"]
    if "opportunityAmount" in data and data["opportunityAmount"]:
        actual_fields["opportunity_amount"] = data["opportunityAmount"]
    mapped.update(actual_fields)
    c = BizClue(**mapped)
    db.add(c); await db.commit(); await db.refresh(c)
    return success(row_to_dict(c))

@router.put("/api/clue/{clue_id}")
async def clue_update(clue_id: int, dto: ClueSaveDTO, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    r = (await db.execute(select(BizClue).where(BizClue.id == clue_id))).scalar_one_or_none()
    if not r: return fail("线索不存在")
    key_map = {"clueName":"clue_name","clientCompany":"client_company","clientDept":"client_dept",
               "clientContact":"client_contact","beikeOwner":"beike_owner","budgetAmount":"budget_amount",
               "clueLevel":"clue_level","clueStatus":"clue_status","reviewStatus":"review_status",
               "businessConfirmed":"business_confirmed","contactDate":"contact_date",
               "createDate":"create_date","requirementDesc":"requirement_desc",
               "expectedTarget":"expected_target","deptBelong":"dept_belong",
               "opportunityAmount":"opportunity_amount","clueEvaluation":"clue_evaluation",
               "sourceType":"source_type","sourceActivityName":"source_activity_name",
               "clientCircle":"client_circle","valueQuadrant":"value_quadrant",
               "healthStatus":"health_status","proposalDate":"proposal_date",
               "campaignId":"campaign_id","maintenanceFreq":"maintenance_freq",
               "nextMaintenanceDate":"next_maintenance_date",
               "painPoint":"pain_point"}
    for k, v in dto.model_dump(exclude_unset=True).items():
        col = key_map.get(k, k)
        if hasattr(BizClue, col):
            setattr(r, col, v)
    r.update_by = user["id"]
    await db.commit(); return success()

@router.delete("/api/clue/{clue_id}")
async def clue_delete(clue_id: int, db: AsyncSession = Depends(get_db)):
    r = (await db.execute(select(BizClue).where(BizClue.id == clue_id))).scalar_one_or_none()
    if r: r.is_deleted = 1; await db.commit()
    return success()

# ==================== 线索仪表盘 ====================

@router.get("/api/clue/{clue_id}/dashboard")
async def clue_dashboard(clue_id: int, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    """一次请求返回线索全部数据"""
    clue = (await db.execute(select(BizClue).where(BizClue.id == clue_id, BizClue.is_deleted == 0))).scalar_one_or_none()
    if not clue: return fail("线索不存在")
    # 跟进记录
    follows = (await db.execute(text("SELECT * FROM biz_clue_follow WHERE clue_id=:cid AND is_deleted=0 ORDER BY follow_date DESC LIMIT 20"), {"cid": clue_id})).mappings().all()
    # 操作日志
    logs = (await db.execute(text("SELECT * FROM biz_clue_log WHERE clue_id=:cid ORDER BY create_time DESC LIMIT 20"), {"cid": clue_id})).mappings().all()
    return success({
        "clue": row_to_dict(clue),
        "follows": [dict(f) for f in follows],
        "logs": [dict(l) for l in logs],
    })

# ==================== 线索统计 ====================

@router.get("/api/clue/stats")
async def clue_stats(db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    """线索统计数据：总量、待跟进、已承接、已转化"""
    base_q = select(BizClue).where(BizClue.is_deleted == 0)
    is_admin = "ROLE_ADMIN" in user.get("roles", [])
    if not is_admin and user.get("realName"):
        base_q = base_q.where(BizClue.beike_owner == user["realName"])
    sub = base_q.subquery()
    total = (await db.execute(select(func.count()).select_from(sub))).scalar() or 0
    pending = (await db.execute(select(func.count()).select_from(select(BizClue).where(BizClue.is_deleted == 0, BizClue.clue_status == "接触")))).scalar() or 0
    if not is_admin and user.get("realName"):
        pending = (await db.execute(select(func.count()).select_from(select(BizClue).where(BizClue.is_deleted == 0, BizClue.clue_status == "接触", BizClue.beike_owner == user["realName"])))).scalar() or 0
    accepted = (await db.execute(select(func.count()).select_from(select(BizClue).where(BizClue.is_deleted == 0, BizClue.clue_status == "承接")))).scalar() or 0
    if not is_admin and user.get("realName"):
        accepted = (await db.execute(select(func.count()).select_from(select(BizClue).where(BizClue.is_deleted == 0, BizClue.clue_status == "承接", BizClue.beike_owner == user["realName"])))).scalar() or 0
    # 已转化 = 有关联项目的线索
    converted = (await db.execute(text("SELECT COUNT(DISTINCT c.id) FROM biz_clue c JOIN biz_project p ON p.source_clue_id = c.id WHERE c.is_deleted = 0 AND p.is_deleted = 0"))).scalar() or 0
    return success({"total": total, "pending": pending, "accepted": accepted, "converted": converted})

# ==================== 战役（前端兼容路径） ====================

@router.get("/api/clue/campaigns")
async def clue_campaigns(db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    """返回战役列表（兼容前端 /api/clue/campaigns 路径）"""
    rows = (await db.execute(select(BizCampaign).where(BizCampaign.is_deleted == 0).order_by(BizCampaign.create_time.desc()))).scalars().all()
    return success([row_to_dict(r) for r in rows])

@router.get("/api/clue/campaign/dashboard")
async def clue_campaign_dashboard(campaignId: int = Query(...), db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    """战役作战看板数据"""
    campaign = (await db.execute(select(BizCampaign).where(BizCampaign.id == campaignId, BizCampaign.is_deleted == 0))).scalar_one_or_none()
    if not campaign: return fail("战役不存在")
    # 该战役下的线索数
    clue_count = (await db.execute(select(func.count()).select_from(select(BizClue).where(BizClue.is_deleted == 0, BizClue.campaign_id == campaignId).subquery()))).scalar() or 0
    # 线索状态统计
    pending_review = (await db.execute(select(func.count()).select_from(select(BizClue).where(BizClue.is_deleted == 0, BizClue.campaign_id == campaignId, BizClue.review_status.in_(["待评审", "评审中"])).subquery()))).scalar() or 0
    yellow_count = (await db.execute(select(func.count()).select_from(select(BizClue).where(BizClue.is_deleted == 0, BizClue.campaign_id == campaignId, BizClue.health_status == "yellow").subquery()))).scalar() or 0
    red_count = (await db.execute(select(func.count()).select_from(select(BizClue).where(BizClue.is_deleted == 0, BizClue.campaign_id == campaignId, BizClue.health_status == "red").subquery()))).scalar() or 0
    # 已转化 = 该战役下有关联项目的线索
    converted = (await db.execute(text("SELECT COUNT(DISTINCT c.id) FROM biz_clue c JOIN biz_project p ON p.source_clue_id = c.id WHERE c.campaign_id = :cid AND c.is_deleted = 0 AND p.is_deleted = 0"), {"cid": campaignId})).scalar() or 0
    # 本周内新增
    this_week = (await db.execute(select(func.count()).select_from(select(BizClue).where(BizClue.is_deleted == 0, BizClue.campaign_id == campaignId, BizClue.create_time >= func.date_sub(func.now(), text("INTERVAL 7 DAY"))).subquery()))).scalar() or 0
    target_total = float(campaign.target_count or 0)
    valid_rate = round((clue_count / target_total * 100) if target_total > 0 else 0, 1)
    conv_rate = round((converted / clue_count * 100) if clue_count > 0 else 0, 1)
    return success({
        "targetCount": campaign.target_count or 0,
        "targetAmount": float(campaign.target_amount or 0),
        "addedCount": clue_count,
        "validRate": valid_rate,
        "conversionRate": conv_rate,
        "keyFollowCount": pending_review + yellow_count + red_count,
        "newClueCount": this_week,
        "pendingReviewCount": pending_review,
        "yellowWarningCount": yellow_count,
        "redWarningCount": red_count,
        "expectedThisWeek": 0,
    })
