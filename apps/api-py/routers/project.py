from fastapi import APIRouter, Depends, Query, Body
from sqlalchemy import select, func, or_, text
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models import BizProject, BizProjectPeriod, BizProjectWeekly, BizProjectMilestone, BizProjectTeam, BizProjectWBS, BizProjectChange, SysUser
from schemas import *
from security import get_current_user_with_role
from permissions import PermissionChecker, require_ownership, build_owner_filter
from datetime import date
import json

router = APIRouter(tags=["项目"])

from utils.mapping import row_to_dict, row_to_camel

project_to_dict = row_to_camel  # 别名，保持现有调用兼容

def clamp_page(pageNum: int, pageSize: int):
    return max(1, pageNum), min(max(1, pageSize), 100)

# ──── 权限校验辅助 ────
async def check_project_owner(project_id: int, db: AsyncSession, user: dict, action: str = "访问"):
    """校验当前用户是否有权操作该项目，返回项目对象或抛 403"""
    r = (await db.execute(
        select(BizProject).where(BizProject.id == project_id, BizProject.is_deleted == 0)
    )).scalar_one_or_none()
    if not r:
        from utils.response import fail
        return fail("项目不存在"), None
    require_ownership(user, project_to_dict(r), "project")
    return None, r

@router.get("/api/project/page")
async def page(pageNum: int = 1, pageSize: int = 15, keyword: str = None,
               status: str = None, projectLevel: str = None, deptBelong: str = None,
               db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    pageNum, pageSize = clamp_page(pageNum, pageSize)
    checker = PermissionChecker(user)
    q = select(BizProject).where(BizProject.is_deleted == 0)

    # 统一权限过滤
    f = checker.get_filter_cond(BizProject, "project")
    if f is not None:
        q = q.where(f)

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
async def detail(project_id: int, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    r = (await db.execute(select(BizProject).where(BizProject.id == project_id, BizProject.is_deleted == 0))).scalar_one_or_none()
    if not r: return fail("项目不存在")
    require_ownership(user, project_to_dict(r), "project")
    return success(project_to_dict(r))

@router.post("/api/project")
async def create(dto: ProjectSaveDTO, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    data = dto.model_dump(exclude_none=True)
    key_map = {"projectName":"project_name","projectNumber":"project_number","clientName":"client_name",
               "clientContact":"client_contact","projectManager":"project_manager","deliveryManager":"delivery_manager",
               "productManager":"product_manager","projectAmount":"project_amount","projectLevel":"project_level",
               "projectStatus":"project_status","deptBelong":"dept_belong","startDate":"start_date",
               "expectEndDate":"expect_end_date","riskAssessment":"risk_assessment"}
    mapped = {key_map.get(k, k): v for k, v in data.items()}
    mapped["create_by"] = user["id"]  # 记录创建者
    p = BizProject(**mapped)
    db.add(p); await db.commit(); await db.refresh(p)
    return success(project_to_dict(p))

@router.put("/api/project/{project_id}")
async def update(project_id: int, dto: ProjectSaveDTO, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    """编辑项目 — 管理员可编辑全部，非管理员只能编辑自己管理的"""
    err, r = await check_project_owner(project_id, db, user, "修改")
    if err: return err
    key_map = {"projectName":"project_name","projectNumber":"project_number","clientName":"client_name",
               "clientContact":"client_contact","projectManager":"project_manager","deliveryManager":"delivery_manager",
               "productManager":"product_manager","projectAmount":"project_amount","projectLevel":"project_level",
               "projectStatus":"project_status","deptBelong":"dept_belong","startDate":"start_date",
               "expectEndDate":"expect_end_date","riskAssessment":"risk_assessment"}
    for k, v in dto.model_dump(exclude_unset=True).items():
        setattr(r, key_map.get(k, k), v)
    await db.commit()
    return success()

@router.delete("/api/project/{project_id}")
async def delete(project_id: int, body: dict = Body(...), db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    """删除项目 — 管理员可删除全部，非管理员只能删除自己管理的"""
    if not body.get("confirm"): return fail("请确认删除操作")
    r = (await db.execute(select(BizProject).where(BizProject.id == project_id, BizProject.is_deleted == 0))).scalar_one_or_none()
    if not r: return fail("项目不存在")
    require_ownership(user, project_to_dict(r), "project")
    r.is_deleted = 1; await db.commit()
    return success()

# ==================== 月度期数 ====================

@router.get("/api/project-period/list/{project_id}")
async def period_list(project_id: int, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    err, _ = await check_project_owner(project_id, db, user, "查看期数")
    if err: return err
    q = select(BizProjectPeriod).where(BizProjectPeriod.project_id == project_id, BizProjectPeriod.is_deleted == 0).order_by(BizProjectPeriod.period_month.desc())
    rows = (await db.execute(q)).scalars().all()
    return success([project_to_dict(r) for r in rows])

@router.post("/api/project-period")
async def period_save(dto: ProjectPeriodDTO, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    err, _ = await check_project_owner(dto.projectId, db, user, "保存期数")
    if err: return err
    r = await db.execute(select(BizProjectPeriod).where(BizProjectPeriod.project_id == dto.projectId, BizProjectPeriod.period_month == dto.periodMonth))
    exist = r.scalar_one_or_none()
    period_map = {"projectId":"project_id","periodMonth":"period_month","periodStatus":"period_status",
                  "estimatedRevenue":"estimated_revenue","estimatedProfit":"estimated_profit",
                  "estimatedProfitRate":"estimated_profit_rate","estimatedCost":"estimated_cost",
                  "estimatedLaborCost":"estimated_labor_cost","actualRevenue":"actual_revenue",
                  "actualProfit":"actual_profit","actualProfitRate":"actual_profit_rate",
                  "actualCost":"actual_cost","actualLaborCost":"actual_labor_cost",
                  "profitAchievementRate":"profit_achievement_rate","goalDescription":"goal_description",
                  "monthlyTarget":"monthly_target","monthlyActual":"monthly_actual",
                  "monthlyProgress":"monthly_progress","goalSummary":"goal_summary",
                  "w1Target":"w1_target","w1Actual":"w1_actual","w1Progress":"w1_progress",
                  "w2Target":"w2_target","w2Actual":"w2_actual","w2Progress":"w2_progress",
                  "w3Target":"w3_target","w3Actual":"w3_actual","w3Progress":"w3_progress",
                  "w4Target":"w4_target","w4Actual":"w4_actual","w4Progress":"w4_progress",
                  "processBonus":"process_bonus","resultBonus":"result_bonus",
                  "alertText":"alert_text","progressInterpretation":"progress_interpretation",
                  "monthlyProfitExpectation":"monthly_profit_expectation",
                  "executionStaff":"execution_staff","customerInfo":"customer_info",
                  "riskAssessment":"risk_assessment"}
    if exist:
        for k, v in dto.model_dump(exclude_unset=True).items():
            setattr(exist, period_map.get(k, k), v)
        await db.commit(); await db.refresh(exist)
        return success(project_to_dict(exist))
    mapped = {period_map.get(k, k): v for k, v in dto.model_dump().items() if v is not None}
    p = BizProjectPeriod(**mapped)
    db.add(p); await db.commit(); await db.refresh(p)
    return success(project_to_dict(p))

@router.delete("/api/project-period/{period_id}")
async def period_delete(period_id: int, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    r = (await db.execute(select(BizProjectPeriod).where(BizProjectPeriod.id == period_id))).scalar_one_or_none()
    if r:
        err, _ = await check_project_owner(r.project_id, db, user, "删除期数")
        if err: return err
        r.is_deleted = 1; await db.commit()
    return success()

# ==================== 项目仪表盘（一次获取全部数据） ====================

@router.get("/api/project/{project_id}/dashboard")
async def dashboard(project_id: int, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    """一次请求返回项目全部数据 — 需要项目所有权"""
    checker = PermissionChecker(user)
    proj = (await db.execute(select(BizProject).where(BizProject.id == project_id, BizProject.is_deleted == 0))).scalar_one_or_none()
    if not proj: return fail("项目不存在")
    require_ownership(user, project_to_dict(proj), "project")
    periods = (await db.execute(select(BizProjectPeriod).where(BizProjectPeriod.project_id == project_id, BizProjectPeriod.is_deleted == 0).order_by(BizProjectPeriod.period_month.desc()))).scalars().all()
    weeklies = (await db.execute(select(BizProjectWeekly).where(BizProjectWeekly.project_id == project_id, BizProjectWeekly.is_deleted == 0).order_by(BizProjectWeekly.period_month.desc(), BizProjectWeekly.week_number.desc()))).scalars().all()
    milestones = (await db.execute(select(BizProjectMilestone).where(BizProjectMilestone.project_id == project_id, BizProjectMilestone.is_deleted == 0).order_by(BizProjectMilestone.sort_order))).scalars().all()
    team = (await db.execute(select(BizProjectTeam).where(BizProjectTeam.project_id == project_id, BizProjectTeam.is_deleted == 0).order_by(BizProjectTeam.sort_order))).scalars().all()
    wbs = (await db.execute(select(BizProjectWBS).where(BizProjectWBS.project_id == project_id, BizProjectWBS.is_deleted == 0).order_by(BizProjectWBS.sort_order))).scalars().all()
    changes = (await db.execute(select(BizProjectChange).where(BizProjectChange.project_id == project_id, BizProjectChange.is_deleted == 0).order_by(BizProjectChange.change_date.desc()))).scalars().all()
    risks = (await db.execute(text("SELECT * FROM biz_risk WHERE project_id=:pid AND is_deleted=0 ORDER BY create_time DESC"), {"pid": project_id})).mappings().all()
    return success({
        "project": project_to_dict(proj),
        "periods": [project_to_dict(p) for p in periods],
        "weeklies": [project_to_dict(w) for w in weeklies],
        "milestones": [project_to_dict(m) for m in milestones],
        "team": [project_to_dict(t) for t in team],
        "wbs": [project_to_dict(w) for w in wbs],
        "changes": [project_to_dict(c) for c in changes],
        "risks": [dict(r) for r in risks],
    })

# ==================== 周报 ====================

@router.get("/api/project/{project_id}/weekly")
async def weekly_list(project_id: int, month: str = None, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    err, _ = await check_project_owner(project_id, db, user, "查看周报")
    if err: return err
    q = select(BizProjectWeekly).where(BizProjectWeekly.project_id == project_id, BizProjectWeekly.is_deleted == 0)
    if month: q = q.where(BizProjectWeekly.period_month == month)
    q = q.order_by(BizProjectWeekly.period_month.desc(), BizProjectWeekly.week_number.desc())
    rows = (await db.execute(q)).scalars().all()
    return success([project_to_dict(r) for r in rows])

@router.post("/api/project/{project_id}/weekly")
async def weekly_save(project_id: int, dto: dict = Body(...), db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    """保存周报（有则更新，无则新建）— 需要项目所有权"""
    err, _ = await check_project_owner(project_id, db, user, "保存周报")
    if err: return err
    month = dto.get("periodMonth")
    week = dto.get("weekNumber")
    existing = (await db.execute(select(BizProjectWeekly).where(BizProjectWeekly.project_id == project_id, BizProjectWeekly.period_month == month, BizProjectWeekly.week_number == week))).scalar_one_or_none()
    if existing:
        for k, v in dto.items():
            col_map = {"periodMonth": "period_month", "weekNumber": "week_number", "completedWork": "completed_work", "weeklyMetrics": "weekly_metrics", "nextWeekPlan": "next_week_plan", "issueSeverity": "issue_severity"}
            setattr(existing, col_map.get(k, k), v)
        await db.commit(); await db.refresh(existing)
        return success(project_to_dict(existing))
    w = BizProjectWeekly(project_id=project_id, period_month=month, week_number=week,
                         completed_work=dto.get("completedWork"),
                         weekly_metrics=json.dumps(dto.get("weeklyMetrics")) if dto.get("weeklyMetrics") else None,
                         issues=dto.get("issues"), issue_severity=dto.get("issueSeverity", "normal"),
                         next_week_plan=dto.get("nextWeekPlan"))
    db.add(w); await db.commit(); await db.refresh(w)
    return success(project_to_dict(w))

# ==================== 里程碑 ====================

@router.get("/api/project/{project_id}/milestones")
async def milestone_list(project_id: int, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    err, _ = await check_project_owner(project_id, db, user, "查看里程碑")
    if err: return err
    rows = (await db.execute(select(BizProjectMilestone).where(BizProjectMilestone.project_id == project_id, BizProjectMilestone.is_deleted == 0).order_by(BizProjectMilestone.sort_order))).scalars().all()
    return success([project_to_dict(r) for r in rows])

@router.post("/api/project/{project_id}/milestones")
async def milestone_save(project_id: int, items: list = Body(...), db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    """批量保存里程碑（覆盖式）— 需要项目所有权"""
    err, _ = await check_project_owner(project_id, db, user, "保存里程碑")
    if err: return err
    old = (await db.execute(select(BizProjectMilestone).where(BizProjectMilestone.project_id == project_id))).scalars().all()
    for o in old: await db.delete(o)
    for i, item in enumerate(items):
        m = BizProjectMilestone(project_id=project_id, stage=item.get("stage"), milestone=item.get("milestone"),
                                planned_date=item.get("plannedDate"), actual_date=item.get("actualDate"),
                                status=item.get("status", "pending"), sort_order=i)
        db.add(m)
    await db.commit()
    return success()

# ==================== 团队 ====================

@router.get("/api/project/{project_id}/team")
async def team_list(project_id: int, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    err, _ = await check_project_owner(project_id, db, user, "查看团队")
    if err: return err
    rows = (await db.execute(select(BizProjectTeam).where(BizProjectTeam.project_id == project_id, BizProjectTeam.is_deleted == 0).order_by(BizProjectTeam.sort_order))).scalars().all()
    return success([project_to_dict(r) for r in rows])

@router.post("/api/project/{project_id}/team")
async def team_save(project_id: int, items: list = Body(...), db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    """批量保存团队（覆盖式）— 需要项目所有权"""
    err, _ = await check_project_owner(project_id, db, user, "保存团队")
    if err: return err
    old = (await db.execute(select(BizProjectTeam).where(BizProjectTeam.project_id == project_id))).scalars().all()
    for o in old: await db.delete(o)
    for i, item in enumerate(items):
        t = BizProjectTeam(project_id=project_id, name=item.get("name"), dept=item.get("dept"),
                          role=item.get("role"), responsibility=item.get("responsibility"),
                          work_description=item.get("workDescription"), sort_order=i)
        db.add(t)
    await db.commit()
    return success()

# ==================== WBS ====================

@router.get("/api/project/{project_id}/wbs")
async def wbs_list(project_id: int, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    err, _ = await check_project_owner(project_id, db, user, "查看WBS")
    if err: return err
    rows = (await db.execute(select(BizProjectWBS).where(BizProjectWBS.project_id == project_id, BizProjectWBS.is_deleted == 0).order_by(BizProjectWBS.sort_order))).scalars().all()
    return success([project_to_dict(r) for r in rows])

@router.post("/api/project/{project_id}/wbs")
async def wbs_save(project_id: int, items: list = Body(...), db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    """批量保存 WBS（覆盖式）— 需要项目所有权"""
    err, _ = await check_project_owner(project_id, db, user, "保存WBS")
    if err: return err
    old = (await db.execute(select(BizProjectWBS).where(BizProjectWBS.project_id == project_id))).scalars().all()
    for o in old: await db.delete(o)
    for i, item in enumerate(items):
        w = BizProjectWBS(project_id=project_id, code=item.get("code"), task_name=item.get("taskName"),
                         activities=item.get("activities"), work_hours=item.get("workHours"),
                         human_resources=item.get("humanResources"), other_resources=item.get("otherResources"),
                         cost_estimate=item.get("costEstimate"), start_date=item.get("startDate"),
                         end_date=item.get("endDate"), deliverable=item.get("deliverable"),
                         assignees=json.dumps(item.get("assignees")) if item.get("assignees") else None,
                         status=item.get("status", "pending"), sort_order=i)
        db.add(w)
    await db.commit()
    return success()

# ==================== 变更 ====================

@router.get("/api/project/{project_id}/changes")
async def change_list(project_id: int, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    err, _ = await check_project_owner(project_id, db, user, "查看变更记录")
    if err: return err
    rows = (await db.execute(select(BizProjectChange).where(BizProjectChange.project_id == project_id, BizProjectChange.is_deleted == 0).order_by(BizProjectChange.change_date.desc()))).scalars().all()
    return success([project_to_dict(r) for r in rows])

@router.post("/api/project/{project_id}/changes")
async def change_create(project_id: int, dto: dict = Body(...), db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    """创建变更记录 — 需要项目所有权"""
    err, _ = await check_project_owner(project_id, db, user, "创建变更记录")
    if err: return err
    col_map = {"changeDate": "change_date", "affectedTask": "affected_task", "changeSummary": "change_summary", "changeReason": "change_reason", "impactAnalysis": "impact_analysis"}
    c = BizProjectChange(project_id=project_id, **{col_map.get(k, k): v for k, v in dto.items() if col_map.get(k, k) in [c.key for c in BizProjectChange.__table__.columns]})
    db.add(c); await db.commit(); await db.refresh(c)
    return success(project_to_dict(c))
