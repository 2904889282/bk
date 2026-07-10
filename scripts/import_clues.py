"""从 Excel 批量导入线索到贝壳平台"""
import pandas as pd
import sys, os, traceback
from datetime import datetime, date
from sqlalchemy import create_engine, text

EXCEL_PATH = sys.argv[1] if len(sys.argv) > 1 else "线索导入模板.xlsx"

DB_HOST = os.getenv("db_host", "rm-2zery46bn1074b1b1.mysql.rds.aliyuncs.com")
DB_PORT = os.getenv("db_port", "3306")
DB_NAME = os.getenv("db_name", "beike_platform")
DB_USER = os.getenv("db_user", "beike")
DB_PASSWORD = os.getenv("db_password", "BEIKEadmin123")
DB_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"
engine = create_engine(DB_URL)

# Excel 中文表头 → 数据库字段
COLUMN_MAP = {
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

DATE_FIELDS = {"contact_date", "create_date", "proposal_date", "next_maintenance_date"}
NUMERIC_FIELDS = {"budget_amount", "opportunity_amount", "maintenance_freq", "campaign_id"}


def parse_date(v):
    if v is None:
        return None
    if isinstance(v, (datetime, date)):
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


def generate_template():
    """生成导入模板 Excel"""
    template_path = "线索导入模板.xlsx"
    headers = list(COLUMN_MAP.keys())
    df = pd.DataFrame(columns=headers)
    # 添加一行示例数据
    example = {h: "" for h in headers}
    example["线索名称"] = "示例：某银行数据中台项目"
    example["客户公司"] = "某银行"
    example["客户部门"] = "信息技术部"
    example["客户联系人"] = "张总"
    example["贝壳负责人"] = "张明"
    example["线索等级"] = "A"
    example["线索状态"] = "接触"
    example["来源类型"] = "转介绍"
    example["所属行业"] = "金融"
    example["客户圈层"] = "KA"
    example["需求描述"] = "需要建设统一数据中台"
    df = pd.concat([pd.DataFrame([example], columns=headers), df], ignore_index=True)

    with pd.ExcelWriter(template_path, engine="openpyxl") as writer:
        df.to_excel(writer, sheet_name="线索导入模板", index=False)
        # 字段说明
        desc_data = []
        for zh, en in COLUMN_MAP.items():
            required = "是" if en == "clue_name" else "否"
            desc_data.append({"中文表头": zh, "数据库字段": en, "是否必填": required})
        pd.DataFrame(desc_data).to_excel(writer, sheet_name="字段说明", index=False)
    print(f"模板已生成: {template_path}")


if __name__ == "__main__":
    if "--template" in sys.argv:
        generate_template()
        sys.exit(0)

    if not os.path.exists(EXCEL_PATH):
        print(f"文件不存在: {EXCEL_PATH}")
        print("使用 --template 生成模板：python import_clues.py --template")
        sys.exit(1)

    df = pd.read_excel(EXCEL_PATH, engine="openpyxl")

    # 跳过标题行
    if df.iloc[0].notna().sum() < 2:
        df.columns = df.iloc[0]
        df = df.iloc[1:].reset_index(drop=True)

    df = df.dropna(how="all").reset_index(drop=True)

    if df.empty:
        print("Excel 无有效数据")
        sys.exit(1)

    # 映射列名
    reverse_map = {}
    for col in df.columns:
        col_str = str(col).strip()
        if col_str in COLUMN_MAP:
            reverse_map[col_str] = COLUMN_MAP[col_str]

    if not reverse_map:
        print("未识别到有效表头，请确认表头与模板一致")
        sys.exit(1)

    df = df.rename(columns=reverse_map)
    valid_cols = [c for c in df.columns if c in COLUMN_MAP.values()]
    df = df[valid_cols]

    if "clue_name" not in df.columns:
        print("缺少必填列「线索名称」")
        sys.exit(1)

    # 清洗
    df = df.replace({"nan": None, "NaN": None, "": None})
    for f in DATE_FIELDS:
        if f in df.columns:
            df[f] = df[f].apply(parse_date)
    for f in NUMERIC_FIELDS:
        if f in df.columns:
            df[f] = pd.to_numeric(df[f], errors="coerce")

    total = len(df)
    success = 0
    skipped = 0

    with engine.connect() as conn:
        with conn.begin():
            # 预查询已有线索
            existing = conn.execute(
                text("SELECT clue_name, COALESCE(client_company, '') FROM biz_clue WHERE is_deleted=0")
            ).fetchall()
            existing_set = {(r[0], r[1]) for r in existing}

            for idx, row in df.iterrows():
                clue_name = str(row.get("clue_name", "")).strip() if row.get("clue_name") else None
                if not clue_name:
                    skipped += 1
                    print(f"  SKIP 第{idx+2}行: 线索名称为空")
                    continue

                client_company = str(row.get("client_company", "")).strip() if row.get("client_company") else ""
                if (clue_name, client_company) in existing_set:
                    skipped += 1
                    print(f"  SKIP: {clue_name} (已存在)")
                    continue

                try:
                    clue_data = {"clue_name": clue_name}
                    for col in valid_cols:
                        if col == "clue_name":
                            continue
                        val = row.get(col)
                        if val is not None and not (isinstance(val, float) and pd.isna(val)):
                            if col in DATE_FIELDS and isinstance(val, pd.Timestamp):
                                val = val.date()
                            clue_data[col] = val

                    clue_data.setdefault("clue_status", "接触")
                    clue_data.setdefault("health_status", "normal")

                    cols = ", ".join(clue_data.keys())
                    placeholders = ", ".join(f":{k}" for k in clue_data)
                    conn.execute(
                        text(f"INSERT INTO biz_clue ({cols}) VALUES ({placeholders})"),
                        clue_data,
                    )
                    existing_set.add((clue_name, client_company))
                    success += 1
                    print(f"  OK: {clue_name} | {client_company}")
                except Exception as e:
                    skipped += 1
                    print(f"  FAIL 第{idx+2}行: {str(e)[:100]}")

    print(f"\n导入完成！总计: {total} | 成功: {success} | 跳过: {skipped}")
