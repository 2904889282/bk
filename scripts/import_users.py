"""导入人员信息到贝壳平台 - 支持层级部门 + 职位"""
import pandas as pd
from sqlalchemy import create_engine, text
import bcrypt, sys, os

EXCEL_PATH = sys.argv[1] if len(sys.argv) > 1 else "人员信息汇总表.xlsx"

DB_HOST = os.getenv("db_host")
DB_PORT = os.getenv("db_port", "3306")
DB_NAME = os.getenv("db_name", "beike_platform")
DB_USER = os.getenv("db_user", "beike")
DB_PASSWORD = os.getenv("db_password")
if not DB_HOST or not DB_PASSWORD:
    print("错误: 请设置环境变量 db_host 和 db_password")
    sys.exit(1)
DB_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"
engine = create_engine(DB_URL)

def hash_pw(pw):
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt(rounds=10)).decode()

def get_or_create_dept(conn, name, parent_id=None):
    r = conn.execute(text("SELECT id FROM sys_dept WHERE name=:n AND is_deleted=0"), {"n": name})
    row = r.fetchone()
    if row:
        return row[0]
    result = conn.execute(text("INSERT INTO sys_dept (name, parent_id, sort_order, is_deleted) VALUES (:n, :p, 0, 0)"), {"n": name, "p": parent_id})
    return result.lastrowid

def get_or_create_position(conn, name):
    if not name or name == 'nan':
        return None
    r = conn.execute(text("SELECT id FROM sys_position WHERE name=:n AND is_deleted=0"), {"n": name})
    row = r.fetchone()
    if row:
        return row[0]
    result = conn.execute(text("INSERT INTO sys_position (name, sort_order, is_deleted) VALUES (:n, 99, 0)"), {"n": name})
    return result.lastrowid

df = pd.read_excel(EXCEL_PATH)
df = df.iloc[2:].reset_index(drop=True)
df.columns = ['name','col2','dept1','dept2','position','emp_type',
              'contract_type','supervisor','hire_date','confirm_date','contract_entity']
df = df.drop(columns=['col2'])

DEFAULT_PASSWORD = hash_pw("beike123")

with engine.connect() as conn:
    with conn.begin():
        for i, row in df.iterrows():
            name = str(row['name']).strip()
            if not name or name == 'nan':
                continue

            dept1 = str(row['dept1']).strip() if pd.notna(row['dept1']) else ''
            dept2 = str(row['dept2']).strip() if pd.notna(row['dept2']) else ''
            position = str(row['position']).strip() if pd.notna(row['position']) else ''

            # 层级部门
            dept_id = None
            if dept1:
                parent_id = get_or_create_dept(conn, dept1)
                if dept2:
                    dept_id = get_or_create_dept(conn, dept2, parent_id)
                else:
                    dept_id = parent_id

            # 职位
            position_id = get_or_create_position(conn, position)

            # 跳过已存在
            exists = conn.execute(text("SELECT id FROM sys_user WHERE real_name=:n AND is_deleted=0"), {"n": name}).fetchone()
            if exists:
                print(f"  SKIP: {name} (已存在)")
                continue

            username = name
            email = f"{name}@beike.com"

            result = conn.execute(text("""
                INSERT INTO sys_user (username, password, real_name, email, status, dept_id, position_id, role_type, create_time, update_time, is_deleted)
                VALUES (:u, :p, :rn, :em, 1, :did, :pid, 'USER', NOW(), NOW(), 0)
            """), {"u": username, "p": DEFAULT_PASSWORD, "rn": name, "em": email, "did": dept_id, "pid": position_id})
            user_id = result.lastrowid

            conn.execute(text("INSERT INTO sys_user_role (user_id, role_id) VALUES (:uid, 3)"), {"uid": user_id})

            dept_label = f"{dept1}/{dept2}" if dept2 else (dept1 if dept1 else '无部门')
            pos_label = position if position else '无职位'
            print(f"  OK: {name} | {dept_label} | {pos_label}")

    # 统计
    total_users = conn.execute(text("SELECT COUNT(*) FROM sys_user WHERE is_deleted=0")).scalar()
    total_depts = conn.execute(text("SELECT COUNT(*) FROM sys_dept WHERE is_deleted=0")).scalar()
    total_positions = conn.execute(text("SELECT COUNT(*) FROM sys_position WHERE is_deleted=0")).scalar()
    print(f"\n导入完成！用户总数: {total_users} | 部门: {total_depts} | 职位: {total_positions}")
    print(f"所有新用户默认密码: beike123")
