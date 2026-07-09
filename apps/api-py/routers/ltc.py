from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy import select, func, or_, text
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models import BizPipeline, BizCampaign
from security import get_current_user_with_role
from schemas import success, fail

router = APIRouter(tags=["LTC"])

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

# 前端 camelCase → 数据库 snake_case 映射
PIPELINE_KEY_MAP = {
    "winRate":"win_rate","ownerId":"owner_id","deptId":"dept_id",
    "nextAction":"next_action","managerName":"manager_name",
    "contactPerson":"contact_person","expectedCloseDate":"expected_close_date",
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
async def pipeline_detail(pipeline_id: int, db: AsyncSession = Depends(get_db)):
    r = (await db.execute(select(BizPipeline).where(BizPipeline.id == pipeline_id))).scalar_one_or_none()
    return success(row_to_dict(r)) if r else fail("商机不存在")

@router.post("/api/pipeline")
async def pipeline_create(dto: dict, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    mapped = {PIPELINE_KEY_MAP.get(k, k): v for k, v in dto.items() if v is not None}
    # 筛选仅存在于 BizPipeline 模型中的字段
    valid = {k: v for k, v in mapped.items() if hasattr(BizPipeline, k)}
    p = BizPipeline(**valid)
    db.add(p); await db.commit(); await db.refresh(p)
    return success(row_to_dict(p))

@router.put("/api/pipeline/{pipeline_id}")
async def pipeline_update(pipeline_id: int, dto: dict, db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    r = (await db.execute(select(BizPipeline).where(BizPipeline.id == pipeline_id))).scalar_one_or_none()
    if not r: return fail("商机不存在")
    for k, v in dto.items():
        col = PIPELINE_KEY_MAP.get(k, k)
        if hasattr(BizPipeline, col):
            setattr(r, col, v)
    await db.commit(); return success()

@router.delete("/api/pipeline/{pipeline_id}")
async def pipeline_delete(pipeline_id: int, db: AsyncSession = Depends(get_db)):
    r = (await db.execute(select(BizPipeline).where(BizPipeline.id == pipeline_id))).scalar_one_or_none()
    if r: r.is_deleted = 1; await db.commit()
    return success()

# ==================== 线索跟进 ====================

@router.get("/api/clue/{clue_id}/follow")
async def follow_list(clue_id: int, db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(text("SELECT * FROM biz_clue_follow WHERE clue_id = :cid AND is_deleted = 0 ORDER BY follow_date DESC"), {"cid": clue_id})).mappings().all()
    return success([dict(r) for r in rows])

@router.post("/api/clue/follow")
async def follow_create(dto: dict, db: AsyncSession = Depends(get_db)):
    from datetime import datetime
    dto['create_time'] = datetime.utcnow()
    cols = ','.join(dto.keys()); vals = ','.join(f":{k}" for k in dto)
    await db.execute(text(f"INSERT INTO biz_clue_follow ({cols}) VALUES ({vals})"), dto)
    await db.commit(); return success()

@router.put("/api/clue/follow/{follow_id}")
async def follow_update(follow_id: int, dto: dict, db: AsyncSession = Depends(get_db)):
    sets = ','.join(f"{k}=:{k}" for k in dto); dto['id'] = follow_id
    await db.execute(text(f"UPDATE biz_clue_follow SET {sets} WHERE id = :id"), dto)
    await db.commit(); return success()

@router.delete("/api/clue/follow/{follow_id}")
async def follow_delete(follow_id: int, db: AsyncSession = Depends(get_db)):
    await db.execute(text("UPDATE biz_clue_follow SET is_deleted=1 WHERE id=:id"), {"id": follow_id})
    await db.commit(); return success()

# ==================== 附件 ====================

@router.post("/api/attachment/upload")
async def attachment_upload(file: UploadFile = File(...), bizType: str = Form(...), bizId: int = Form(...),
                           db: AsyncSession = Depends(get_db), user=Depends(get_current_user_with_role)):
    import os, uuid
    ALLOWED_TYPES = {"jpg","jpeg","png","gif","pdf","doc","docx","xls","xlsx","ppt","pptx","txt","csv","zip","rar"}
    MAX_SIZE = 50 * 1024 * 1024  # 50MB
    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    if ext not in ALLOWED_TYPES:
        return fail(f"不支持的文件类型: {ext}，允许: {', '.join(sorted(ALLOWED_TYPES))}")
    content = await file.read()
    if len(content) > MAX_SIZE:
        return fail(f"文件大小超限，最大50MB，当前: {len(content)//1024//1024}MB")
    os.makedirs("uploads", exist_ok=True)
    fname = f"{uuid.uuid4()}.{ext}"
    path = os.path.join("uploads", fname)
    with open(path, "wb") as f: f.write(content)
    await db.execute(text("INSERT INTO biz_attachment (biz_type, biz_id, file_name, file_type, file_size, file_url, upload_user_id) VALUES (:bt,:bi,:fn,:ft,:fs,:fu,:ui)"),
                     {"bt": bizType, "bi": bizId, "fn": file.filename, "ft": ext, "fs": len(content), "fu": f"/uploads/{fname}", "ui": user["id"]})
    await db.commit()
    return success({"fileName": file.filename, "fileUrl": f"/uploads/{fname}"})

@router.get("/api/attachment/{biz_type}/{biz_id}")
async def attachment_list(biz_type: str, biz_id: int, db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(text("SELECT * FROM biz_attachment WHERE biz_type=:bt AND biz_id=:bi AND is_deleted=0 ORDER BY upload_time DESC"), {"bt": biz_type, "bi": biz_id})).mappings().all()
    return success([dict(r) for r in rows])

@router.delete("/api/attachment/{att_id}")
async def attachment_delete(att_id: int, db: AsyncSession = Depends(get_db)):
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
