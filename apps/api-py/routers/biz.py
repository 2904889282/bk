from fastapi import APIRouter, Depends, Body, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy import select, func, or_, update, text, and_
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models import BizTalent, BizRisk, BizAlert, BizClue, BizCampaign, BizProject
from schemas import *
from security import get_current_user_with_role, is_admin, verify_ownership
from datetime import date, datetime, timezone
import io, traceback

router = APIRouter(tags=["业务模块"])

from utils.mapping import row_to_camel as row_to_dict  # 旧代码兼容：row_to_dict 在 biz.py 中返回 camelCase

# 模块级常量：线索 camelCase → snake_case 映射表，避免在 create/update 中重复定义
CLUE_KEY_MAP = {
    "clueName": "clue_name", "clientCompany": "client_company", "clientDept": "client_dept",
    "clientContact": "client_contact", "beikeOwner": "beike_owner", "budgetAmount": "budget_amount",
    "clueLevel": "clue_level", "clueStatus": "clue_status", "reviewStatus": "review_status",
    "businessConfirmed": "business_confirmed", "contactDate": "contact_date",
    "createDate": "create_date", "requirementDesc": "requirement_desc",
    "expectedTarget": "expected_target", "deptBelong": "dept_belong",
    "opportunityAmount": "opportunity_amount", "clueEvaluation": "clue_evaluation",
    "sourceType": "source_type", "sourceActivityName": "source_activity_name",
    "clientCircle": "client_circle", "valueQuadrant": "value_quadrant",
    "healthStatus": "health_status", "proposalDate": "proposal_date",
    "campaignId": "campaign_id", "maintenanceFreq": "maintenance_freq",
    "nextMaintenanceDate": "next_maintenance_date",
    "painPoint": "pain_point",
}

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
async def talent_detail(talent_id: int, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    r = (await db.execute(select(BizTalent).where(BizTalent.id == talent_id, BizTalent.is_deleted == 0))).scalar_one_or_none()
    return success(row_to_dict(r)) if r else fail("人才不存在")

@router.post("/api/talent")
async def talent_create(dto: TalentSaveDTO, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    data = dto.model_dump(exclude_none=True)
    m = {"talentType":"talent_type", "currentProject":"current_project"}
    t = BizTalent(**{m.get(k,k):v for k,v in data.items()})
    db.add(t); await db.commit(); await db.refresh(t)
    return success(row_to_dict(t))

@router.put("/api/talent/{talent_id}")
async def talent_update(talent_id: int, dto: TalentSaveDTO, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    r = (await db.execute(select(BizTalent).where(BizTalent.id == talent_id))).scalar_one_or_none()
    if not r: return fail("人才不存在")
    m = {"talentType":"talent_type", "currentProject":"current_project"}
    for k, v in dto.model_dump(exclude_unset=True).items():
        setattr(r, m.get(k, k), v)
    await db.commit(); return success()

@router.delete("/api/talent/{talent_id}")
async def talent_delete(talent_id: int, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    r = (await db.execute(select(BizTalent).where(BizTalent.id == talent_id))).scalar_one_or_none()
    if r: r.is_deleted = 1; await db.commit()
    return success()

@router.delete("/api/talent/batch")
async def talent_batch_delete(ids: list[int] = Body(...), db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    await db.execute(update(BizTalent).where(BizTalent.id.in_(ids)).values(is_deleted=1))
    await db.commit()
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
async def risk_detail(risk_id: int, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    r = (await db.execute(select(BizRisk).where(BizRisk.id == risk_id))).scalar_one_or_none()
    return success(row_to_dict(r)) if r else fail("风险不存在")

@router.post("/api/risk")
async def risk_create(dto: RiskSaveDTO, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    data = dto.model_dump(exclude_none=True)
    m = {"projectId":"project_id"}
    r = BizRisk(**{m.get(k,k):v for k,v in data.items()})
    db.add(r); await db.commit(); await db.refresh(r)
    return success(row_to_dict(r))

@router.put("/api/risk/{risk_id}")
async def risk_update(risk_id: int, dto: RiskSaveDTO, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    r = (await db.execute(select(BizRisk).where(BizRisk.id == risk_id))).scalar_one_or_none()
    if not r: return fail("风险不存在")
    m = {"projectId":"project_id"}
    for k, v in dto.model_dump(exclude_unset=True).items():
        setattr(r, m.get(k, k), v)
    await db.commit(); return success()

@router.delete("/api/risk/{risk_id}")
async def risk_delete(risk_id: int, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    r = (await db.execute(select(BizRisk).where(BizRisk.id == risk_id))).scalar_one_or_none()
    if not r: return fail("风险不存在")
    if not is_admin(user) and not verify_ownership(user, row_to_dict(r), "risk"):
        return fail("无权删除该风险")
    r.is_deleted = 1; await db.commit()
    return success()

@router.delete("/api/risk/batch")
async def risk_batch_delete(ids: list[int] = Body(...), db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    await db.execute(update(BizRisk).where(BizRisk.id.in_(ids)).values(is_deleted=1))
    await db.commit()
    return success()

@router.put("/api/risk/{risk_id}/resolve")
async def risk_resolve(risk_id: int, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    r = (await db.execute(select(BizRisk).where(BizRisk.id == risk_id))).scalar_one_or_none()
    if not r: return fail("风险不存在")
    r.status = "已解决"; await db.commit()
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
async def alert_detail(alert_id: int, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    r = (await db.execute(select(BizAlert).where(BizAlert.id == alert_id))).scalar_one_or_none()
    return success(row_to_dict(r)) if r else fail("预警不存在")

@router.post("/api/alert")
async def alert_create(dto: AlertSaveDTO, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    a = BizAlert(**dto.model_dump()); db.add(a); await db.commit(); await db.refresh(a)
    return success(row_to_dict(a))

@router.put("/api/alert/{alert_id}")
async def alert_update(alert_id: int, dto: AlertSaveDTO, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    r = (await db.execute(select(BizAlert).where(BizAlert.id == alert_id))).scalar_one_or_none()
    if not r: return fail("预警不存在")
    for k, v in dto.model_dump(exclude_unset=True).items(): setattr(r, k, v)
    await db.commit(); return success()

@router.delete("/api/alert/{alert_id}")
async def alert_delete(alert_id: int, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    r = (await db.execute(select(BizAlert).where(BizAlert.id == alert_id))).scalar_one_or_none()
    if not r: return fail("预警不存在")
    if not is_admin(user) and not verify_ownership(user, row_to_dict(r), "alert"):
        return fail("无权删除该预警")
    r.is_deleted = 1; await db.commit()
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

@router.get("/api/clue/stats")
async def clue_stats(db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    """线索统计数据：总量、待跟进、已承接、已转化"""
    base_q = select(BizClue).where(BizClue.is_deleted == 0)
    is_admin = "ROLE_ADMIN" in user.get("roles", [])
    owner_filter = BizClue.beike_owner == user["realName"] if not is_admin and user.get("realName") else None

    q = base_q
    if owner_filter is not None:
        q = base_q.where(owner_filter)
    sub = q.subquery()
    total = (await db.execute(select(func.count()).select_from(sub))).scalar() or 0

    pending_q = select(func.count()).select_from(select(BizClue).where(BizClue.is_deleted == 0, BizClue.clue_status == "接触"))
    if owner_filter is not None:
        pending_q = pending_q.where(owner_filter)
    pending = (await db.execute(pending_q)).scalar() or 0

    accepted_q = select(func.count()).select_from(select(BizClue).where(BizClue.is_deleted == 0, BizClue.clue_status == "承接"))
    if owner_filter is not None:
        accepted_q = accepted_q.where(owner_filter)
    accepted = (await db.execute(accepted_q)).scalar() or 0

    converted = (await db.execute(text("SELECT COUNT(DISTINCT c.id) FROM biz_clue c JOIN biz_project p ON p.source_clue_id = c.id WHERE c.is_deleted = 0 AND p.is_deleted = 0"))).scalar() or 0
    return success({"total": total, "pending": pending, "accepted": accepted, "converted": converted})

@router.get("/api/clue/campaigns")
async def clue_campaigns(db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    rows = (await db.execute(select(BizCampaign).where(BizCampaign.is_deleted == 0).order_by(BizCampaign.create_time.desc()))).scalars().all()
    return success([row_to_dict(r) for r in rows])

@router.get("/api/clue/campaign/dashboard")
async def clue_campaign_dashboard(campaignId: int = Query(...), db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    campaign = (await db.execute(select(BizCampaign).where(BizCampaign.id == campaignId, BizCampaign.is_deleted == 0))).scalar_one_or_none()
    if not campaign: return fail("战役不存在")
    clue_count = (await db.execute(select(func.count()).select_from(select(BizClue).where(BizClue.is_deleted == 0, BizClue.campaign_id == campaignId).subquery()))).scalar() or 0
    pending_review = (await db.execute(select(func.count()).select_from(select(BizClue).where(BizClue.is_deleted == 0, BizClue.campaign_id == campaignId, BizClue.review_status.in_(["待评审", "评审中"])).subquery()))).scalar() or 0
    yellow_count = (await db.execute(select(func.count()).select_from(select(BizClue).where(BizClue.is_deleted == 0, BizClue.campaign_id == campaignId, BizClue.health_status == "yellow").subquery()))).scalar() or 0
    red_count = (await db.execute(select(func.count()).select_from(select(BizClue).where(BizClue.is_deleted == 0, BizClue.campaign_id == campaignId, BizClue.health_status == "red").subquery()))).scalar() or 0
    converted = (await db.execute(text("SELECT COUNT(DISTINCT c.id) FROM biz_clue c JOIN biz_project p ON p.source_clue_id = c.id WHERE c.campaign_id = :cid AND c.is_deleted = 0 AND p.is_deleted = 0"), {"cid": campaignId})).scalar() or 0
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
        "keyFollowCount": 0,
        "newClueCount": this_week,
        "pendingReviewCount": pending_review,
        "yellowWarningCount": yellow_count,
        "redWarningCount": red_count,
        "expectedThisWeek": 0,
    })

# 批量操作（必须在参数化路由之前）
@router.delete("/api/clue/batch")
async def clue_batch_delete(ids: list[int], db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    is_admin_user = "ROLE_ADMIN" in user.get("roles", [])
    if not is_admin_user:
        real_name = user.get("realName", "")
        if not real_name:
            return fail("无权执行批量操作")
        await db.execute(text("UPDATE biz_clue SET is_deleted=1 WHERE id IN :ids AND beike_owner=:owner"), {"ids": tuple(ids), "owner": real_name})
    else:
        await db.execute(text("UPDATE biz_clue SET is_deleted=1 WHERE id IN :ids"), {"ids": tuple(ids)})
    await db.commit(); return success()

@router.put("/api/clue/batch/assign")
async def clue_batch_assign(ids: list[int], owner: str, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    is_admin_user = "ROLE_ADMIN" in user.get("roles", [])
    if not is_admin_user:
        real_name = user.get("realName", "")
        if not real_name:
            return fail("无权执行批量操作")
        await db.execute(text("UPDATE biz_clue SET beike_owner=:owner WHERE id IN :ids AND beike_owner=:real_name"), {"owner": owner, "ids": tuple(ids), "real_name": real_name})
    else:
        await db.execute(text("UPDATE biz_clue SET beike_owner=:owner WHERE id IN :ids"), {"owner": owner, "ids": tuple(ids)})
    await db.commit(); return success()

@router.put("/api/clue/batch/level")
async def clue_batch_level(ids: list[int], level: str, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    is_admin_user = "ROLE_ADMIN" in user.get("roles", [])
    if not is_admin_user:
        real_name = user.get("realName", "")
        if not real_name:
            return fail("无权执行批量操作")
        await db.execute(text("UPDATE biz_clue SET clue_level=:level WHERE id IN :ids AND beike_owner=:owner"), {"level": level, "ids": tuple(ids), "owner": real_name})
    else:
        await db.execute(text("UPDATE biz_clue SET clue_level=:level WHERE id IN :ids"), {"level": level, "ids": tuple(ids)})
    await db.commit(); return success()

@router.put("/api/clue/batch/campaign")
async def clue_batch_campaign(ids: list[int], campaignId: int, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    is_admin_user = "ROLE_ADMIN" in user.get("roles", [])
    if not is_admin_user:
        real_name = user.get("realName", "")
        if not real_name:
            return fail("无权执行批量操作")
        await db.execute(text("UPDATE biz_clue SET campaign_id=:cid WHERE id IN :ids AND beike_owner=:owner"), {"cid": campaignId, "ids": tuple(ids), "owner": real_name})
    else:
        await db.execute(text("UPDATE biz_clue SET campaign_id=:cid WHERE id IN :ids"), {"cid": campaignId, "ids": tuple(ids)})
    await db.commit(); return success()

@router.post("/api/clue/export-weekly")
async def clue_export_weekly(clueIds: list[int], db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    if not clueIds: return success([])
    rows = (await db.execute(text("SELECT c.id, c.clue_name, c.client_company, c.beike_owner, c.clue_status, c.opportunity_amount, c.contact_date, c.requirement_desc, c.clue_evaluation, c.review_status FROM biz_clue c WHERE c.id IN :ids AND c.is_deleted=0"), {"ids": tuple(clueIds)})).mappings().all()
    return success([dict(r) for r in rows])

@router.get("/api/clue/{clue_id}")
async def clue_detail(clue_id: int, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    r = (await db.execute(select(BizClue).where(BizClue.id == clue_id, BizClue.is_deleted == 0))).scalar_one_or_none()
    if not r: return fail("线索不存在")
    if not verify_ownership(user, row_to_dict(r), "clue"): return fail("无权查看该线索")
    return success(row_to_dict(r))

@router.post("/api/clue")
async def clue_create(dto: ClueSaveDTO, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    data = dto.model_dump(exclude_none=True)
    mapped = {CLUE_KEY_MAP.get(k, k): v for k, v in data.items()}
    # 前端多余字段（commRecord, relation, matchedProducts等）存入 extra_data
    extra = {}
    for k, v in data.items():
        if k not in CLUE_KEY_MAP and k not in ["budget"]:
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
    r = (await db.execute(select(BizClue).where(BizClue.id == clue_id, BizClue.is_deleted == 0))).scalar_one_or_none()
    if not r: return fail("线索不存在")
    if not verify_ownership(user, row_to_dict(r), "clue"): return fail("无权修改该线索")
    for k, v in dto.model_dump(exclude_unset=True).items():
        col = CLUE_KEY_MAP.get(k, k)
        if hasattr(BizClue, col):
            setattr(r, col, v)
    r.update_by = user["id"]
    await db.commit(); return success()

@router.delete("/api/clue/{clue_id}")
async def clue_delete(clue_id: int, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    r = (await db.execute(select(BizClue).where(BizClue.id == clue_id, BizClue.is_deleted == 0))).scalar_one_or_none()
    if not r: return fail("线索不存在")
    if not verify_ownership(user, row_to_dict(r), "clue"): return fail("无权删除该线索")
    r.is_deleted = 1; await db.commit()
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

# ==================== 线索 Excel 导入 ====================

# Excel 中文表头 → 数据库字段映射
CLUE_EXCEL_COLUMN_MAP = {
    "线索名称": "clue_name",
    "客户公司": "client_company",
    "客户部门": "client_dept",
    "客户联系人": "client_contact",
    "贝壳负责人": "beike_owner",
    "接触日期": "contact_date",
    "创建日期": "create_date",
    "预算": "budget",
    "预算金额": "budget_amount",
    "线索等级": "clue_level",
    "线索状态": "clue_status",
    "评审状态": "review_status",
    "商务部确认": "business_confirmed",
    "提案日期": "proposal_date",
    "来源类型": "source_type",
    "来源活动": "source_activity_name",
    "所属战役ID": "campaign_id",
    "客户圈层": "client_circle",
    "所属行业": "industry",
    "价值象限": "value_quadrant",
    "健康状态": "health_status",
    "商机金额": "opportunity_amount",
    "痛点": "pain_point",
    "预期目标": "expected_target",
    "线索评估": "clue_evaluation",
    "维护频率": "maintenance_freq",
    "下次维护日期": "next_maintenance_date",
    "需求描述": "requirement_desc",
    "备注": "remark",
    "承接部门": "dept_belong",
}

CLUE_DATE_FIELDS = {"contact_date", "create_date", "proposal_date", "next_maintenance_date"}
CLUE_NUMERIC_FIELDS = {"budget_amount", "opportunity_amount", "maintenance_freq", "campaign_id"}

TEMPLATE_HEADERS = list(CLUE_EXCEL_COLUMN_MAP.keys())


@router.post("/api/clue/import")
async def clue_import(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user_with_role),
):
    """从 Excel 批量导入线索"""
    if not file.filename.endswith((".xlsx", ".xls")):
        return fail("仅支持 .xlsx / .xls 格式")

    try:
        content = await file.read()
        if len(content) > 20 * 1024 * 1024:
            return fail("文件大小超限，最大 20MB")

        import pandas as pd
        import numpy as np
        from io import BytesIO

        df = pd.read_excel(BytesIO(content), engine="openpyxl")
    except Exception as e:
        return fail(f"Excel 解析失败: {str(e)}")

    if df.empty:
        return fail("Excel 文件无数据")

    # 检测表头：跳过可能的标题行
    if df.iloc[0].notna().sum() < 2:
        df.columns = df.iloc[0]
        df = df.iloc[1:].reset_index(drop=True)

    # 去掉全空行
    df = df.dropna(how="all").reset_index(drop=True)
    if df.empty:
        return fail("未检测到有效数据行")

    # 映射表头
    reverse_map = {}
    for col in df.columns:
        col_str = str(col).strip()
        if col_str in CLUE_EXCEL_COLUMN_MAP:
            reverse_map[col_str] = CLUE_EXCEL_COLUMN_MAP[col_str]

    if not reverse_map:
        return fail("未识别到任何有效列，请检查表头是否匹配模板")

    df = df.rename(columns=reverse_map)

    # 过滤只保留映射后的列
    valid_cols = [c for c in df.columns if c in CLUE_EXCEL_COLUMN_MAP.values()]
    if not valid_cols:
        return fail("未识别到任何有效数据列")
    df = df[valid_cols]

    if "clue_name" not in df.columns:
        return fail("缺少必填列「线索名称」")

    # 数据清洗
    df = df.replace({np.nan: None, "nan": None, "NaN": None, "": None})

    # 日期转换
    for f in CLUE_DATE_FIELDS:
        if f in df.columns:
            df[f] = df[f].apply(lambda v: _parse_date(v))

    # 数值转换
    for f in CLUE_NUMERIC_FIELDS:
        if f in df.columns:
            df[f] = pd.to_numeric(df[f], errors="coerce")
            df[f] = df[f].where(df[f].notna(), None)

    total_rows = len(df)
    success_count = 0
    skip_count = 0
    errors = []

    # 批量查询已存在的线索（去重）
    existing_pairs = set()
    clue_names = df["clue_name"].dropna().apply(lambda x: str(x).strip()).tolist()
    client_companies = (
        df["client_company"].fillna("").apply(lambda x: str(x).strip()).tolist()
        if "client_company" in df.columns
        else [""] * len(df)
    )
    # 查询所有已存在的线索
    all_existing = (
        await db.execute(
            select(BizClue.clue_name, BizClue.client_company).where(
                BizClue.is_deleted == 0
            )
        )
    ).all()
    existing_pairs = {(r[0], r[1] or "") for r in all_existing}

    to_insert = []
    for idx, row in df.iterrows():
        clue_name = str(row.get("clue_name", "")).strip() if row.get("clue_name") else None
        if not clue_name:
            skip_count += 1
            errors.append({"row": int(idx) + 2, "reason": "线索名称为空"})
            continue

        client_company = str(row.get("client_company", "")).strip() if row.get("client_company") else ""
        pair_key = (clue_name, client_company)

        if pair_key in existing_pairs:
            skip_count += 1
            errors.append({"row": int(idx) + 2, "reason": f"重复: {clue_name}"})
            continue

        try:
            clue_data = {"clue_name": clue_name}
            for col in valid_cols:
                if col == "clue_name":
                    continue
                val = row.get(col)
                if val is not None and not (isinstance(val, float) and pd.isna(val)):
                    if col in CLUE_DATE_FIELDS and isinstance(val, pd.Timestamp):
                        val = val.date()
                    clue_data[col] = val

            # 默认值
            clue_data.setdefault("clue_status", "接触")
            clue_data.setdefault("health_status", "normal")
            clue_data["create_by"] = user["id"]
            clue_data["create_time"] = datetime.now(timezone.utc).replace(tzinfo=None)

            to_insert.append(BizClue(**clue_data))
            existing_pairs.add(pair_key)
            success_count += 1
        except Exception as e:
            skip_count += 1
            errors.append({"row": int(idx) + 2, "reason": f"数据校验失败: {str(e)[:120]}"})

    # 批量写入
    if to_insert:
        try:
            db.add_all(to_insert)
            await db.commit()
        except Exception as e:
            await db.rollback()
            return fail(f"数据库写入失败: {str(e)[:200]}")

    return success({
        "total": total_rows,
        "success": success_count,
        "skip": skip_count,
        "errors": errors[:50],  # 最多返回 50 条错误
    })


def _parse_date(v):
    """尝试多种日期格式解析"""
    if v is None:
        return None
    import pandas as pd
    if isinstance(v, (pd.Timestamp, datetime, date)):
        return v.date() if hasattr(v, "date") else v
    s = str(v).strip()
    if not s:
        return None
    for fmt in ["%Y-%m-%d", "%Y/%m/%d", "%Y.%m.%d", "%m/%d/%Y", "%d/%m/%Y"]:
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    return None


@router.get("/api/clue/import/template")
async def clue_import_template(user=Depends(get_current_user_with_role)):
    """下载线索导入 Excel 模板"""
    import pandas as pd
    from io import BytesIO

    # 第一行：英文列名（备选表头）
    english_headers = [CLUE_EXCEL_COLUMN_MAP.get(h, h) for h in TEMPLATE_HEADERS]

    # 创建模板文件
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        # Sheet1: 数据导入（中文表头）
        df = pd.DataFrame(columns=TEMPLATE_HEADERS)
        df.to_excel(writer, sheet_name="线索导入模板", index=False)

        # 隐藏的 sheet: 字段说明
        desc_data = []
        for zh, en in CLUE_EXCEL_COLUMN_MAP.items():
            required = "是" if en == "clue_name" else "否"
            desc_data.append({"中文表头": zh, "数据库字段": en, "是否必填": required, "说明": _field_desc(en)})
        desc_df = pd.DataFrame(desc_data)
        desc_df.to_excel(writer, sheet_name="字段说明", index=False)

    output.seek(0)
    from urllib.parse import quote
    filename = quote("线索导入模板.xlsx")
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{filename}"},
    )


def _field_desc(en: str) -> str:
    desc_map = {
        "clue_name": "线索名称（唯一标识）",
        "client_company": "客户公司全称",
        "client_dept": "客户所属部门",
        "client_contact": "客户对接人姓名",
        "beike_owner": "贝壳侧责任人",
        "contact_date": "首次接触日期 YYYY-MM-DD",
        "create_date": "线索创建日期 YYYY-MM-DD",
        "budget": "预算描述，如 50-100万",
        "budget_amount": "预算金额（万元，纯数字）",
        "clue_level": "S/A/B/C/D 等级",
        "clue_status": "接触/沟通/提案/谈判/承接/关闭",
        "review_status": "待评审/评审中/通过/驳回",
        "business_confirmed": "是/否",
        "proposal_date": "提案日期 YYYY-MM-DD",
        "source_type": "如：展会/转介绍/陌拜",
        "source_activity_name": "来源活动名称",
        "campaign_id": "所属战役ID（数字）",
        "client_circle": "KA/SMB/SMB+",
        "industry": "如：金融/医疗/制造/教育",
        "value_quadrant": "高价值/潜力/维持",
        "health_status": "normal/yellow/red",
        "opportunity_amount": "预计商机金额（万元）",
        "pain_point": "客户痛点",
        "expected_target": "预期目标",
        "clue_evaluation": "线索评估结论",
        "maintenance_freq": "维护频率（天，数字）",
        "next_maintenance_date": "下次维护日期 YYYY-MM-DD",
        "requirement_desc": "客户需求描述",
        "remark": "备注信息",
        "dept_belong": "承接部门名称",
    }
    return desc_map.get(en, "")

# ==================== 线索转项目 ====================

@router.post("/api/clue/{clue_id}/convert")
async def clue_convert(clue_id: int, dto: dict, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    clue = (await db.execute(select(BizClue).where(BizClue.id == clue_id, BizClue.is_deleted == 0))).scalar_one_or_none()
    if not clue: return fail("线索不存在")
    from models import BizProject
    proj = BizProject(
        project_name=dto.get("projectName", clue.clue_name),
        client_name=clue.client_company or "",
        project_manager=dto.get("projectManager", clue.beike_owner or "") or "",
        project_amount=dto.get("projectAmount", clue.opportunity_amount or 0),
        dept_belong=clue.dept_belong or "",
        source_clue_id=clue.id,
        start_date=date.today(),
    )
    db.add(proj); await db.flush()
    clue.converted_opportunity_id = proj.id; clue.is_converted = True
    await db.commit()
    return success({"projectId": proj.id})

# ==================== 线索全量详情 ====================

@router.get("/api/clue/{clue_id}/full-detail")
async def clue_full_detail(clue_id: int, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    clue = (await db.execute(select(BizClue).where(BizClue.id == clue_id, BizClue.is_deleted == 0))).scalar_one_or_none()
    if not clue: return fail("线索不存在")
    follows = (await db.execute(text("SELECT * FROM biz_clue_follow WHERE clue_id=:cid AND is_deleted=0 ORDER BY follow_date DESC"), {"cid": clue_id})).mappings().all()
    contacts = (await db.execute(text("SELECT * FROM biz_clue_contact WHERE clue_id=:cid AND is_deleted=0"), {"cid": clue_id})).mappings().all()
    reviews = (await db.execute(text("SELECT * FROM biz_clue_opportunity_review WHERE clue_id=:cid"), {"cid": clue_id})).mappings().all()
    logs = (await db.execute(text("SELECT * FROM biz_clue_log WHERE clue_id=:cid ORDER BY create_time DESC"), {"cid": clue_id})).mappings().all()
    tasks = (await db.execute(text("SELECT * FROM biz_iron_triangle_task WHERE clue_id=:cid AND is_deleted=0"), {"cid": clue_id})).mappings().all()
    resources = (await db.execute(text("SELECT * FROM biz_clue_resource WHERE clue_id=:cid AND is_deleted=0"), {"cid": clue_id})).mappings().all()
    solutions = (await db.execute(text("SELECT * FROM biz_clue_solution WHERE clue_id=:cid AND is_deleted=0"), {"cid": clue_id})).mappings().all()
    files = (await db.execute(text("SELECT * FROM biz_clue_file WHERE clue_id=:cid AND is_deleted=0"), {"cid": clue_id})).mappings().all()
    return success({
        "clue": row_to_dict(clue),
        "followRecords": [dict(x) for x in follows],
        "contacts": [dict(x) for x in contacts],
        "opportunityReviews": [dict(x) for x in reviews],
        "logs": [dict(x) for x in logs],
        "ironTriangleTasks": [dict(x) for x in tasks],
        "resources": [dict(x) for x in resources],
        "solutions": [dict(x) for x in solutions],
        "files": [dict(x) for x in files],
    })

# ==================== 商机评审 ====================

@router.post("/api/clue/{clue_id}/opportunity-review")
async def clue_submit_review(clue_id: int, dto: dict, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    import uuid
    code = f"OPP-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    await db.execute(text("INSERT INTO biz_clue_opportunity_review (clue_id, reviewer_id, opinion, opportunity_amount, expected_duration, conclusion, opportunity_code, create_time) VALUES (:cid, :uid, :opinion, :amt, :dur, '待审批', :code, :now)"),
                     {"cid": clue_id, "uid": user["id"], "opinion": dto.get("opinion", ""), "amt": dto.get("opportunityAmount", 0),
                      "dur": dto.get("expectedDuration", 0), "code": code, "now": datetime.now(timezone.utc).replace(tzinfo=None)})
    await db.commit()
    return success()

@router.put("/api/clue/{clue_id}/review/{review_id}/approve")
async def clue_approve_review(clue_id: int, review_id: int, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    import uuid
    code = f"OPP-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    await db.execute(text("UPDATE biz_clue_opportunity_review SET conclusion='通过', opportunity_code=:code WHERE id=:rid"), {"code": code, "rid": review_id})
    await db.execute(text("UPDATE biz_clue SET review_status='通过' WHERE id=:cid"), {"cid": clue_id})
    await db.commit()
    return success({"opportunityCode": code})

@router.put("/api/clue/{clue_id}/review/{review_id}/decision")
async def clue_decide_review(clue_id: int, review_id: int, dto: dict, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    conclusion = dto.get("conclusion", "驳回")
    opinion = dto.get("opinion", "")
    code = None
    if conclusion == "通过":
        import uuid
        code = f"OPP-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    await db.execute(text("UPDATE biz_clue_opportunity_review SET conclusion=:c, opinion=:o, opportunity_code=COALESCE(:code, opportunity_code) WHERE id=:rid"),
                     {"c": conclusion, "o": opinion, "code": code, "rid": review_id})
    if conclusion == "通过":
        await db.execute(text("UPDATE biz_clue SET review_status='通过' WHERE id=:cid"), {"cid": clue_id})
    await db.commit()
    return success({"opportunityCode": code})

# ==================== 决策人 ====================

@router.post("/api/clue/{clue_id}/contacts")
async def clue_add_contact(clue_id: int, dto: dict, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    await db.execute(text("INSERT INTO biz_clue_contact (clue_id, name, position, level, contact_info, attitude, influence_weight, remarks, interaction_records, personal_focus, relations) VALUES (:cid, :name, :pos, :lvl, :info, :att, :iw, :rmk, :ir, :pf, :rel)"),
                     {"cid": clue_id, "name": dto.get("name", ""), "pos": dto.get("position", ""), "lvl": dto.get("level", ""),
                      "info": dto.get("contactInfo", ""), "att": dto.get("attitude", ""), "iw": dto.get("influenceWeight", 1),
                      "rmk": dto.get("remarks", ""), "ir": dto.get("interactionRecords", ""), "pf": dto.get("personalFocus", ""), "rel": dto.get("relations", "")})
    await db.commit(); return success()

@router.put("/api/clue/{clue_id}/contacts/{contact_id}")
async def clue_update_contact(clue_id: int, contact_id: int, dto: dict, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    await db.execute(text("UPDATE biz_clue_contact SET name=:name, position=:pos, level=:lvl, contact_info=:info, attitude=:att, influence_weight=:iw, remarks=:rmk, interaction_records=:ir, personal_focus=:pf, relations=:rel WHERE id=:id AND clue_id=:cid"),
                     {"name": dto.get("name", ""), "pos": dto.get("position", ""), "lvl": dto.get("level", ""),
                      "info": dto.get("contactInfo", ""), "att": dto.get("attitude", ""), "iw": dto.get("influenceWeight", 1),
                      "rmk": dto.get("remarks", ""), "ir": dto.get("interactionRecords", ""), "pf": dto.get("personalFocus", ""),
                      "rel": dto.get("relations", ""), "id": contact_id, "cid": clue_id})
    await db.commit(); return success()

# ==================== 资源协同 ====================

@router.post("/api/clue/{clue_id}/resources")
async def clue_add_resource(clue_id: int, dto: dict, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    await db.execute(text("INSERT INTO biz_clue_resource (clue_id, resource_type, status, apply_time, effect_notes) VALUES (:cid, :rt, :st, :at, :en)"),
                     {"cid": clue_id, "rt": dto.get("resourceType", ""), "st": dto.get("status", "申请中"), "at": str(date.today()), "en": dto.get("effectNotes", "")})
    await db.commit(); return success()

# ==================== 铁三角任务 ====================

@router.post("/api/clue/{clue_id}/iron-triangle")
async def clue_add_triangle_task(clue_id: int, dto: dict, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    await db.execute(text("INSERT INTO biz_iron_triangle_task (clue_id, role, assignee_id, task_title, status, deadline, deliverable) VALUES (:cid, :role, :aid, :title, :st, :dl, :dv)"),
                     {"cid": clue_id, "role": dto.get("role", ""), "aid": dto.get("assigneeId", None), "title": dto.get("taskTitle", ""),
                      "st": dto.get("status", "待启动"), "dl": dto.get("deadline", None), "dv": dto.get("deliverable", "")})
    await db.commit(); return success()

# ==================== 方案库 ====================

@router.get("/api/clue/{clue_id}/solutions")
async def clue_solutions(clue_id: int, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    rows = (await db.execute(text("SELECT * FROM biz_clue_solution WHERE clue_id=:cid AND is_deleted=0 ORDER BY create_time DESC"), {"cid": clue_id})).mappings().all()
    return success([dict(r) for r in rows])

@router.post("/api/clue/{clue_id}/solutions")
async def clue_save_solution(clue_id: int, dto: dict, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    await db.execute(text("INSERT INTO biz_clue_solution (clue_id, solution_type, title, description, product_levels, file_name, file_url, file_size, is_pool) VALUES (:cid, :st, :title, :desc, :pl, :fn, :fu, :fs, :ip)"),
                     {"cid": clue_id, "st": dto.get("solutionType", ""), "title": dto.get("title", ""), "desc": dto.get("description", ""),
                      "pl": dto.get("productLevels", ""), "fn": dto.get("fileName", ""), "fu": dto.get("fileUrl", ""),
                      "fs": dto.get("fileSize", 0), "ip": dto.get("isPool", 0)})
    await db.commit(); return success()

@router.delete("/api/clue/{clue_id}/solutions/{solution_id}")
async def clue_delete_solution(clue_id: int, solution_id: int, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    await db.execute(text("UPDATE biz_clue_solution SET is_deleted=1 WHERE id=:id AND clue_id=:cid"), {"id": solution_id, "cid": clue_id})
    await db.commit(); return success()

# ==================== 资料库 ====================

@router.get("/api/clue/{clue_id}/files")
async def clue_files(clue_id: int, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    rows = (await db.execute(text("SELECT * FROM biz_clue_file WHERE clue_id=:cid AND is_deleted=0 ORDER BY create_time DESC"), {"cid": clue_id})).mappings().all()
    return success([dict(r) for r in rows])

@router.post("/api/clue/{clue_id}/files")
async def clue_upload_file(clue_id: int, dto: dict, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    await db.execute(text("INSERT INTO biz_clue_file (clue_id, file_type, file_name, file_url, file_size, file_ext, mime_type, description, is_pool) VALUES (:cid, :ft, :fn, :fu, :fs, :fe, :mt, :desc, :ip)"),
                     {"cid": clue_id, "ft": dto.get("fileType", ""), "fn": dto.get("fileName", ""), "fu": dto.get("fileUrl", ""),
                      "fs": dto.get("fileSize", 0), "fe": dto.get("fileExt", ""), "mt": dto.get("mimeType", ""),
                      "desc": dto.get("description", ""), "ip": dto.get("isPool", 0)})
    await db.commit(); return success()

@router.delete("/api/clue/{clue_id}/files/{file_id}")
async def clue_delete_file(clue_id: int, file_id: int, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    await db.execute(text("UPDATE biz_clue_file SET is_deleted=1 WHERE id=:id AND clue_id=:cid"), {"id": file_id, "cid": clue_id})
    await db.commit(); return success()

@router.put("/api/clue/{clue_id}/files/{file_id}/pool")
async def clue_pool_file(clue_id: int, file_id: int, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    await db.execute(text("UPDATE biz_clue_file SET is_pool=1 WHERE id=:id AND clue_id=:cid"), {"id": file_id, "cid": clue_id})
    await db.commit(); return success()

# ==================== 操作日志 + 周报导出 ====================

@router.get("/api/clue/{clue_id}/logs")
async def clue_logs(clue_id: int, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    rows = (await db.execute(text("SELECT * FROM biz_clue_log WHERE clue_id=:cid ORDER BY create_time DESC Limit 100"), {"cid": clue_id})).mappings().all()
    return success([dict(r) for r in rows])


