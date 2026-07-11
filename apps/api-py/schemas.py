from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Any
from datetime import date, datetime
from decimal import Decimal

# ==================== 通用 ====================
def success(data=None, msg="操作成功"):
    return {"code": 200, "msg": msg, "data": data}

def fail(msg="操作失败"):
    return {"code": 400, "msg": msg, "data": None}

class PageResult(BaseModel):
    records: List[Any]
    total: int

# ==================== 认证 ====================
class LoginDTO(BaseModel):
    username: str
    password: str

class RegisterDTO(BaseModel):
    username: str
    password: str
    realName: Optional[str] = None
    email: Optional[str] = None
    deptId: Optional[int] = None
    deptName: Optional[str] = None

    @field_validator('password')
    @classmethod
    def password_min_length(cls, v):
        if len(v) < 8:
            raise ValueError('密码至少6位')
        return v

class PasswordDTO(BaseModel):
    oldPassword: str
    newPassword: str

    @field_validator('newPassword')
    @classmethod
    def password_min_length(cls, v):
        if len(v) < 8:
            raise ValueError('新密码至少6位')
        return v

class SendCodeDTO(BaseModel):
    email: str

class ResetPasswordDTO(BaseModel):
    email: str
    code: str
    newPassword: str

    @field_validator('newPassword')
    @classmethod
    def password_min_length(cls, v):
        if len(v) < 8:
            raise ValueError('新密码至少6位')
        return v

# ==================== 项目 ====================
class ProjectSaveDTO(BaseModel):
    projectName: str
    projectNumber: Optional[str] = None
    clientName: str
    clientContact: Optional[str] = None
    projectManager: str
    deliveryManager: Optional[str] = None
    productManager: Optional[str] = None
    projectAmount: Decimal = Decimal("0")
    projectLevel: str = "B"
    projectStatus: str = "进行中"
    deptBelong: str = ""
    startDate: date
    expectEndDate: Optional[date] = None
    progress: int = 0
    supplier: Optional[str] = None
    riskAssessment: Optional[str] = None
    remark: Optional[str] = None
    description: Optional[str] = None

class ProjectPageDTO(BaseModel):
    pageNum: int = 1
    pageSize: int = 15
    keyword: Optional[str] = None
    status: Optional[str] = None
    projectLevel: Optional[str] = None
    deptBelong: Optional[str] = None

class ProjectPeriodDTO(BaseModel):
    projectId: int
    periodMonth: str
    periodStatus: Optional[str] = "正式执行"
    estimatedRevenue: Optional[float] = 0
    estimatedProfit: Optional[float] = 0
    estimatedProfitRate: Optional[str] = None
    estimatedCost: Optional[float] = 0
    estimatedLaborCost: Optional[float] = 0
    actualRevenue: Optional[float] = 0
    actualProfit: Optional[float] = 0
    actualProfitRate: Optional[str] = None
    actualCost: Optional[float] = 0
    actualLaborCost: Optional[float] = 0
    profitAchievementRate: Optional[str] = None
    goalDescription: Optional[str] = None
    monthlyTarget: Optional[str] = None
    monthlyActual: Optional[str] = None
    monthlyProgress: Optional[str] = None
    goalSummary: Optional[str] = None
    w1Target: Optional[str] = None; w1Actual: Optional[str] = None; w1Progress: Optional[str] = None
    w2Target: Optional[str] = None; w2Actual: Optional[str] = None; w2Progress: Optional[str] = None
    w3Target: Optional[str] = None; w3Actual: Optional[str] = None; w3Progress: Optional[str] = None
    w4Target: Optional[str] = None; w4Actual: Optional[str] = None; w4Progress: Optional[str] = None
    personnel: Optional[str] = None
    milestones: Optional[str] = None
    processBonus: Optional[str] = None
    resultBonus: Optional[str] = None
    alertText: Optional[str] = None
    progressInterpretation: Optional[str] = None
    monthlyProfitExpectation: Optional[str] = None
    executionStaff: Optional[str] = None
    customerInfo: Optional[str] = None
    riskAssessment: Optional[str] = None
    supplier: Optional[str] = None

# ==================== 人才 ====================
class TalentSaveDTO(BaseModel):
    name: str
    role: Optional[str] = None
    skills: Optional[str] = None
    currentProject: Optional[str] = None
    utilization: int = 0
    status: str = "normal"
    talentType: Optional[str] = "internal"

class TalentPageDTO(BaseModel):
    pageNum: int = 1
    pageSize: int = 15
    keyword: Optional[str] = None
    status: Optional[str] = None
    talentType: Optional[str] = None

# ==================== 风险 ====================
class RiskSaveDTO(BaseModel):
    projectId: Optional[int] = None
    type: Optional[str] = None
    level: str = "medium"
    description: Optional[str] = None
    solution: Optional[str] = None
    owner: Optional[str] = None
    status: str = "open"

class RiskPageDTO(BaseModel):
    pageNum: int = 1
    pageSize: int = 15
    keyword: Optional[str] = None
    projectId: Optional[int] = None
    level: Optional[str] = None
    status: Optional[str] = None

# ==================== 预警 ====================
class AlertSaveDTO(BaseModel):
    projectId: Optional[int] = None
    type: Optional[str] = None
    level: str = "medium"
    description: Optional[str] = None
    manager: Optional[str] = None
    status: str = "open"

class AlertPageDTO(BaseModel):
    pageNum: int = 1
    pageSize: int = 15
    keyword: Optional[str] = None
    projectId: Optional[int] = None
    level: Optional[str] = None
    status: Optional[str] = None

# ==================== 线索 ====================
class ClueSaveDTO(BaseModel):
    clueName: str
    clientCompany: Optional[str] = None
    clientDept: Optional[str] = None
    clientContact: Optional[str] = None
    beikeOwner: Optional[str] = None
    budget: Optional[str] = None
    budgetAmount: Optional[float] = None
    clueLevel: Optional[str] = None
    clueStatus: str = "接触"
    sourceType: Optional[str] = None
    sourceActivityName: Optional[str] = None
    clientCircle: Optional[str] = None
    industry: Optional[str] = None
    valueQuadrant: Optional[str] = None
    healthStatus: str = "normal"
    opportunityAmount: Optional[float] = None
    requirementDesc: Optional[str] = None
    remark: Optional[str] = None
    deptBelong: Optional[str] = None

class CluePageDTO(BaseModel):
    pageNum: int = 1
    pageSize: int = 15
    keyword: Optional[str] = None
    status: Optional[str] = None
    clueLevel: Optional[str] = None
    deptBelong: Optional[str] = None
