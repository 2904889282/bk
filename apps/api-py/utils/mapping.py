"""公共工具 — 数据转换和字段映射"""
import json
from datetime import date, datetime
from decimal import Decimal


def row_to_dict(r) -> dict:
    """SQLAlchemy 模型 → 字典（snake_case 键名）"""
    return {c.name: getattr(r, c.name) for c in r.__table__.columns}


def to_camel(d: dict) -> dict:
    """snake_case → camelCase 键名转换"""
    result = {}
    for k, v in d.items():
        parts = k.split('_')
        camel = parts[0] + ''.join(w.capitalize() for w in parts[1:])
        result[camel] = v
    return result


def row_to_camel(r) -> dict:
    """SQLAlchemy 模型 → camelCase 字典"""
    return to_camel(row_to_dict(r))


def to_snake(camel_str: str) -> str:
    """camelCase → snake_case 字符串转换"""
    import re
    return re.sub(r'(?<!^)(?=[A-Z])', '_', camel_str).lower()


def to_snake_dict(d: dict) -> dict:
    """字典键名 camelCase → snake_case"""
    return {to_snake(k): v for k, v in d.items()}


def json_serializer(obj):
    """JSON 序列化辅助：处理 date/datetime/Decimal 类型"""
    if isinstance(obj, (date, datetime)):
        return obj.isoformat()
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, bytes):
        return obj.decode('utf-8', errors='replace')
    raise TypeError(f"Type {type(obj)} not serializable")
