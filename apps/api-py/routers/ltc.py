from fastapi import APIRouter, Depends, Body, UploadFile, File, Form
from sqlalchemy import select, func, or_, update, text
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models import BizPipeline, BizCampaign
from security import get_current_user_with_role, is_admin, verify_ownership
from schemas import success, fail

router = APIRouter(tags=["LTC"])

from utils.mapping import row_to_camel as row_to_dict  # ltc.py 前端期望 camelCase

# 前端 camelCase → 数据库 snake_case 映射
PIPELINE_KEY_MAP = {
    "winRate":"win_rate","ownerId":"owner_id","deptId":"dept_id",
    "nextAction":"next_action","managerName":"manager_name",
    "contactPerson":"contact_person","expectedCloseDate":"expected_close_date",
}

# 白名单：仅允许这些字段写入 BizPipeline，避免 hasattr 匹配到模型内置属性
PIPELINE_ALLOWED_FIELDS = {
    "name", "customer", "stage", "amount", "win_rate", "owner_id", "dept_id",
    "description", "product", "industry", "source", "next_action", "priority",
    "manager_name", "contact_person", "expected_close_date", "tags",
}

# ==================== 商机管道 ====================

@router.get("/api/pipeline/page")
async def pipeline_page(pageNum: int = 1, pageSize: int = 15, keyword: str = None, stage: str = None,
                        db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    q = select(BizPipeline).where(BizPipeline.is_deleted == 0)
    if keyword: q = q.where(or_(BizPipeline.name.contains(keyword), BizPipeline.customer.contains(keyword)))
    if stage: q = q.where(BizPipeline.stage == stage)
    q = q.order_by(BizPipeline.id.desc())
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar()
    rows = (await db.execute(q.offset((pageNum-1)*pageSize).limit(pageSize))).scalars().all()
    return success({"records": [row_to_dict(r) for r in rows], "total": total})

@router.get("/api/pipeline/{pipeline_id}")
async def pipeline_detail(pipeline_id: int, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    r = (await db.execute(select(BizPipeline).where(BizPipeline.id == pipeline_id))).scalar_one_or_none()
    return success(row_to_dict(r)) if r else fail("商机不存在")

@router.post("/api/pipeline")
async def pipeline_create(dto: dict, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    mapped = {PIPELINE_KEY_MAP.get(k, k): v for k, v in dto.items() if v is not None}
    # 白名单过滤：仅接受 PIPELINE_ALLOWED_FIELDS 中的字段，避免 hasattr 匹配到模型内置属性
    valid = {k: v for k, v in mapped.items() if k in PIPELINE_ALLOWED_FIELDS}
    p = BizPipeline(**valid)
    db.add(p); await db.commit(); await db.refresh(p)
    return success(row_to_dict(p))

@router.put("/api/pipeline/{pipeline_id}")
async def pipeline_update(pipeline_id: int, dto: dict, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    r = (await db.execute(select(BizPipeline).where(BizPipeline.id == pipeline_id))).scalar_one_or_none()
    if not r: return fail("商机不存在")
    for k, v in dto.items():
        col = PIPELINE_KEY_MAP.get(k, k)
        # 白名单过滤：仅接受 PIPELINE_ALLOWED_FIELDS 中的字段
        if col in PIPELINE_ALLOWED_FIELDS:
            setattr(r, col, v)
    await db.commit(); return success()

@router.delete("/api/pipeline/{pipeline_id}")
async def pipeline_delete(pipeline_id: int, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    r = (await db.execute(select(BizPipeline).where(BizPipeline.id == pipeline_id))).scalar_one_or_none()
    if not r: return fail("商机不存在")
    if not is_admin(user) and not verify_ownership(user, row_to_dict(r), "pipeline"):
        return fail("无权删除该商机")
    r.is_deleted = 1; await db.commit()
    return success()

@router.delete("/api/pipeline/batch")
async def pipeline_batch_delete(ids: list[int] = Body(...), db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    await db.execute(update(BizPipeline).where(BizPipeline.id.in_(ids)).values(is_deleted=1))
    await db.commit()
    return success()

@router.get("/api/pipeline/stages")
async def pipeline_stages(db: AsyncSession = Depends(get_db)):
    """返回商机阶段列表及每个阶段的商机数量"""
    rows = (await db.execute(select(BizPipeline.stage, func.count(BizPipeline.id))
        .where(BizPipeline.is_deleted == 0)
        .group_by(BizPipeline.stage)
        .order_by(BizPipeline.stage))).all()
    return success([{"stage": r[0], "count": r[1]} for r in rows])

@router.post("/api/pipeline/{pipeline_id}/claim")
async def pipeline_claim(pipeline_id: int, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    r = (await db.execute(select(BizPipeline).where(BizPipeline.id == pipeline_id, BizPipeline.is_deleted == 0))).scalar_one_or_none()
    if not r: return fail("商机不存在")
    r.owner = user.get("realName", user.get("username", ""))
    await db.commit()
    return success()

@router.post("/api/pipeline/{pipeline_id}/move-to-sea")
async def pipeline_move_to_sea(pipeline_id: int, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    r = (await db.execute(select(BizPipeline).where(BizPipeline.id == pipeline_id, BizPipeline.is_deleted == 0))).scalar_one_or_none()
    if not r: return fail("商机不存在")
    r.stage = "公海"
    await db.commit()
    return success()

# ==================== 线索跟进 ====================

# 白名单：仅允许这些字段写入 biz_clue_follow 表
_FOLLOW_ALLOWED_FIELDS = {
    "clue_id", "follow_type", "follow_date", "follow_user_id",
    "follow_user_name", "contact_person", "core_conclusion",
    "detail_content", "next_plan", "next_deadline", "new_status",
    "weekly_review_notes", "status_change_reason", "confirm_long_interval",
}

@router.get("/api/clue/{clue_id}/follow")
async def follow_list(clue_id: int, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    rows = (await db.execute(text("SELECT * FROM biz_clue_follow WHERE clue_id = :cid AND is_deleted = 0 ORDER BY follow_date DESC"), {"cid": clue_id})).mappings().all()
    return success([dict(r) for r in rows])

@router.post("/api/clue/follow")
async def follow_create(dto: dict, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    from datetime import datetime, timezone
    safe = {k: v for k, v in dto.items() if k in _FOLLOW_ALLOWED_FIELDS}
    safe['create_time'] = datetime.now(timezone.utc).replace(tzinfo=None)
    cols = ','.join(safe.keys()); vals = ','.join(f":{k}" for k in safe)
    await db.execute(text(f"INSERT INTO biz_clue_follow ({cols}) VALUES ({vals})"), safe)
    await db.commit(); return success()

@router.put("/api/clue/follow/{follow_id}")
async def follow_update(follow_id: int, dto: dict, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    safe = {k: v for k, v in dto.items() if k in _FOLLOW_ALLOWED_FIELDS}
    safe['id'] = follow_id
    sets = ','.join(f"{k}=:{k}" for k in safe if k != 'id')
    await db.execute(text(f"UPDATE biz_clue_follow SET {sets} WHERE id = :id"), safe)
    await db.commit(); return success()

@router.delete("/api/clue/follow/{follow_id}")
async def follow_delete(follow_id: int, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    await db.execute(text("UPDATE biz_clue_follow SET is_deleted=1 WHERE id=:id"), {"id": follow_id})
    await db.commit(); return success()

# ==================== 附件 ====================

@router.post("/api/attachment/upload")
async def attachment_upload(file: UploadFile = File(...), bizType: str = Form(...), bizId: int = Form(...),
                           db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    """文件上传接口 — 流式写入磁盘，避免全量读入内存。
    
    注意：对于非常大的文件（>10MB），建议改用分片上传或对象存储直传。
    """
    import os, uuid, shutil
    ALLOWED_TYPES = {"jpg","jpeg","png","gif","pdf","doc","docx","xls","xlsx","ppt","pptx","txt","csv","zip","rar"}
    MAX_SIZE = 10 * 1024 * 1024  # 10MB（流式写入，降低内存风险）
    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    if ext not in ALLOWED_TYPES:
        return fail(f"不支持的文件类型: {ext}，允许: {', '.join(sorted(ALLOWED_TYPES))}")
    # 预检 Content-Length（快速拒绝超大文件，避免无效 I/O）
    content_length = file.headers.get("content-length")
    if content_length and int(content_length) > MAX_SIZE:
        return fail(f"文件大小超限，最大10MB，当前: {int(content_length)//1024//1024}MB")
    os.makedirs("uploads", exist_ok=True)
    fname = f"{uuid.uuid4()}.{ext}"
    path = os.path.join("uploads", fname)
    # 流式写入磁盘 — 避免 file.read() 全量加载到内存
    import asyncio
    await asyncio.to_thread(shutil.copyfileobj, file.file, open(path, "wb"))
    file_size = os.path.getsize(path)
    if file_size > MAX_SIZE:
        os.remove(path)
        return fail(f"文件大小超限，最大10MB，当前: {file_size//1024//1024}MB")
    await db.execute(text("INSERT INTO biz_attachment (biz_type, biz_id, file_name, file_type, file_size, file_url, upload_user_id) VALUES (:bt,:bi,:fn,:ft,:fs,:fu,:ui)"),
                     {"bt": bizType, "bi": bizId, "fn": file.filename, "ft": ext, "fs": file_size, "fu": f"/uploads/{fname}", "ui": user["id"]})
    await db.commit()
    return success({"fileName": file.filename, "fileUrl": f"/uploads/{fname}"})

@router.get("/api/attachment/{biz_type}/{biz_id}")
async def attachment_list(biz_type: str, biz_id: int, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    rows = (await db.execute(text("SELECT * FROM biz_attachment WHERE biz_type=:bt AND biz_id=:bi AND is_deleted=0 ORDER BY upload_time DESC"), {"bt": biz_type, "bi": biz_id})).mappings().all()
    return success([dict(r) for r in rows])

@router.delete("/api/attachment/{att_id}")
async def attachment_delete(att_id: int, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    await db.execute(text("UPDATE biz_attachment SET is_deleted=1 WHERE id=:id"), {"id": att_id})
    await db.commit(); return success()

# ==================== 活动战役 ====================

@router.get("/api/campaign/page")
async def campaign_page(pageNum: int = 1, pageSize: int = 15, keyword: str = None,
                        db: AsyncSession = Depends(get_db), _=Depends(get_current_user_with_role)):
    q = select(BizCampaign).where(BizCampaign.is_deleted == 0)
    if keyword: q = q.where(BizCampaign.name.contains(keyword))
    q = q.order_by(BizCampaign.create_time.desc())
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar()
    rows = (await db.execute(q.offset((pageNum-1)*pageSize).limit(pageSize))).scalars().all()
    return success({"records": [row_to_dict(r) for r in rows], "total": total})
