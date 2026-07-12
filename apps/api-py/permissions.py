"""
权限核心模块 — 角色分级数据权限
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
角色层级 (数值越大权限越高):
  ROLE_ADMIN (3)  → 全量数据，无过滤
  ROLE_MANAGER(2) → 部门级 + 自有数据
  ROLE_USER  (1)  → 仅自有数据

设计原则:
  • 高级角色继承低级角色的所有数据访问能力
  • 过滤条件在 SQL 层生成，避免 Python 侧全量加载再过滤
  • 所有权校验统一为 verify_ownership，各路由按需调用
"""
import logging
from fastapi import HTTPException

logger = logging.getLogger("permissions")

# ══════════════════════════════════════════════
#  角色层级定义
# ══════════════════════════════════════════════
ROLE_HIERARCHY = {
    "ROLE_ADMIN":  3,
    "ROLE_MANAGER": 2,
    "ROLE_USER":   1,
}

# 受数据权限控制的表 → 匹配字段列表（基于 realName 的字段）
# 格式: 表模型 → [ 用于匹配用户 realName 的列名 ]
OWNER_NAME_FIELDS = {
    "project":       ["project_manager", "delivery_manager", "product_manager"],
    "clue":          ["beike_owner"],
    "risk":          ["owner"],
    "alert":         ["manager"],
    "pipeline":      ["manager_name"],
    "talent":        [],
}

# 受数据权限控制的表 → 基于 user_id 的字段
OWNER_ID_FIELDS = {
    "project":       ["create_by"],
    "clue":          ["create_by"],
    "pipeline":      ["owner_id"],
    "talent":        [],
    "risk":          [],
    "alert":         [],
}


# ══════════════════════════════════════════════
#  角色级别查询
# ══════════════════════════════════════════════
def get_role_level(user: dict) -> int:
    """获取用户最高角色级别"""
    roles = user.get("roles", [])
    if not roles:
        return 0
    return max((ROLE_HIERARCHY.get(r, 0) for r in roles), default=0)


def is_admin(user: dict) -> bool:
    return "ROLE_ADMIN" in user.get("roles", [])


def is_manager(user: dict) -> bool:
    return "ROLE_MANAGER" in user.get("roles", [])


def has_any_role(user: dict, *roles: str) -> bool:
    user_roles = set(user.get("roles", []))
    return bool(user_roles & set(roles))


# ══════════════════════════════════════════════
#  硬性检查（抛出 HTTPException）
# ══════════════════════════════════════════════
def require_admin(user: dict):
    if not is_admin(user):
        raise HTTPException(status_code=403, detail="仅管理员可操作")


def require_min_role(user: dict, min_role: str):
    """要求用户至少具有指定角色级别"""
    user_level = get_role_level(user)
    required_level = ROLE_HIERARCHY.get(min_role, 0)
    if user_level < required_level:
        raise HTTPException(status_code=403, detail=f"需要 {min_role} 或更高权限")


# ══════════════════════════════════════════════
#  数据过滤条件生成
# ══════════════════════════════════════════════
def is_data_allowed(user: dict) -> bool:
    """是否需要过滤数据 — 管理员返回 False（不限），其他返回 True"""
    return not is_admin(user)


def build_owner_filter(user: dict, table_key: str):
    """
    返回过滤信息字典（避免循环导入模型）。
    调用方拿到后自行构建 SQLAlchemy filter。

    用法:
        f = build_owner_filter(user, "project")
        if f is not None:
            conds = []
            for col_name in f["nameFields"]:
                if hasattr(Model, col_name):
                    conds.append(getattr(Model, col_name) == f["realName"])
            query = query.where(or_(*conds))

    管理员返回 None。
    """
    if not is_data_allowed(user):
        return None

    real_name = user.get("realName", "")
    if not real_name:
        return None

    return {
        "realName": real_name,
        "nameFields": OWNER_NAME_FIELDS.get(table_key, []),
        "userId": user.get("id"),
        "idFields": OWNER_ID_FIELDS.get(table_key, []),
    }






# ══════════════════════════════════════════════
#  资源所有权校验
# ══════════════════════════════════════════════
def verify_ownership(user: dict, resource: dict, table_key: str) -> bool:
    """
    校验当前用户是否拥有该资源的操作权限。
    调用方负责在返回 False 时抛出 403。

    Args:
        user: 当前用户（含 roles / realName / id）
        resource: 资源字典，含表中 owner 字段
        table_key: "project" | "clue" | "risk" | "alert" | "pipeline" | "talent"

    Returns:
        True = 有权限  |  False = 拒绝
    """
    # 管理员豁免
    if is_admin(user):
        return True

    real_name = user.get("realName", "")
    user_id = user.get("id")
    if not real_name:
        return True  # 无 realName 时放行（向后兼容）

    # 检查基于姓名的字段
    name_fields = OWNER_NAME_FIELDS.get(table_key, [])
    for f in name_fields:
        if resource.get(f) and resource[f] == real_name:
            return True

    # 检查基于 user_id 的字段
    id_fields = OWNER_ID_FIELDS.get(table_key, [])
    for f in id_fields:
        if resource.get(f) and resource[f] == user_id:
            return True

    return False


def require_ownership(user: dict, resource: dict, table_key: str):
    """
    硬性所有权检查 — 不满足就抛出 403。

    用法:
        proj = fetch_project(id)
        require_ownership(user, project_to_dict(proj), "project")
        # 不抛异常 = 有权限
    """
    if not verify_ownership(user, resource, table_key):
        raise HTTPException(status_code=403, detail="无权操作该资源")


# ══════════════════════════════════════════════
#  FastAPI 依赖工厂（可选，路由层面直接注入）
# ══════════════════════════════════════════════
from fastapi import Depends


class PermissionChecker:
    """
    权限检查器 — 可注入到路由中，一次构建多次使用。

    用法:
        checker = PermissionChecker(user)
        checker.can_read  → bool
        checker.filter_query(query, model) → 带过滤的 query
    """
    def __init__(self, user: dict):
        self.user = user
        self._role_level = get_role_level(user)
        self._real_name = user.get("realName", "")
        self._user_id = user.get("id")
        self._is_admin = is_admin(user)

    @property
    def can_access_all(self) -> bool:
        return self._is_admin

    def require_admin(self):
        if not self._is_admin:
            raise HTTPException(status_code=403, detail="仅管理员可操作")

    def verify_owner(self, resource: dict, table_key: str) -> bool:
        return verify_ownership(self.user, resource, table_key)

    def require_owner(self, resource: dict, table_key: str):
        require_ownership(self.user, resource, table_key)

    def get_filter_cond(self, model, table_key: str):
        """
        返回 SQLAlchemy 过滤条件（可直接用于 query.where()）。
        管理员返回 None。
        """
        from sqlalchemy import or_

        if self._is_admin or not self._real_name:
            return None

        conds = []
        name_fields = OWNER_NAME_FIELDS.get(table_key, [])
        for f in name_fields:
            if hasattr(model, f):
                conds.append(getattr(model, f).__eq__(self._real_name))

        id_fields = OWNER_ID_FIELDS.get(table_key, [])
        for f in id_fields:
            if hasattr(model, f) and self._user_id:
                conds.append(getattr(model, f).__eq__(self._user_id))

        if not conds:
            return None
        if len(conds) == 1:
            return conds[0]
        return or_(*conds)
