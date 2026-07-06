import request from '../utils/request';

// ============================================================
// 线索模块 API 层 — v1.5 完整版本
// 基础路径：/api/clue
// 响应解包：request.ts 拦截器已统一解包 {code, msg, data} → 直接返回 data
// ============================================================

// ==================== 类型定义 ====================

/** 线索视图对象 */
export interface ClueVO {
  id: number;
  clueName: string;
  clueNumber?: string;
  clientCompany: string;
  clientDept?: string;
  clientContact?: string;
  beikeOwner: string;
  budget?: string;
  budgetAmount?: number;
  clueLevel: string;
  clueStatus: string;
  reviewStatus?: string;
  businessConfirmed?: string;
  contactDate?: string;
  proposalDate?: string;
  createDate?: string;
  requirementDesc?: string;
  painPoint?: string;
  expectedTarget?: string;
  clueEvaluation?: string;
  remark?: string;
  deptBelong: string;
  arUserId?: number;
  srUserId?: number;
  frUserId?: number;
  relatedProjectId?: number;
  convertedOpportunityId?: number;
  isConverted?: boolean;
  expectedRestart?: string;
  createTime?: string;
  updateTime?: string;
  // v1.3
  campaignId?: number;
  clientCircle?: string;
  healthStatus?: string;
  opportunityAmount?: number;
  lastFollowTime?: string;
  convertStatus?: string;
  // v1.5
  sourceType?: string;
  sourceActivityName?: string;
  industry?: string;
  valueQuadrant?: string;
  maintenanceFreq?: number;
  nextMaintenanceDate?: string;
  maintenanceMethods?: string;
  matchedProducts?: string;
  recommendedProducts?: string;
}

/** 线索分页参数 */
export interface CluePageParams {
  pageNum: number;
  pageSize: number;
  keyword?: string;
  owner?: string;
  status?: string;
  level?: string;
  dateFrom?: string;
  dateTo?: string;
  clientCircle?: string;
  campaignId?: number;
  healthStatus?: string;
  clueLevel?: string;
  deptBelong?: string;
  industry?: string;
}

export interface CluePageResult { records: ClueVO[]; total: number; }

export interface ClueStats {
  total: number;
  pending: number;
  accepted: number;
  converted: number;
}

/** 线索新增/编辑 */
export interface ClueSaveDTO {
  clueName: string;
  clientCompany: string;
  clientDept?: string;
  clientContact?: string;
  beikeOwner: string;
  budget?: string;
  budgetAmount?: number;
  clueLevel: string;
  clueStatus: string;
  reviewStatus?: string;
  contactDate?: string;
  proposalDate?: string;
  createDate?: string;
  requirementDesc?: string;
  painPoint?: string;
  expectedTarget?: string;
  remark?: string;
  deptBelong: string;
  arUserId?: number;
  srUserId?: number;
  frUserId?: number;
  campaignId?: number;
  clientCircle?: string;
  healthStatus?: string;
  opportunityAmount?: number;
  sourceType?: string;
  sourceActivityName?: string;
  industry?: string;
  valueQuadrant?: string;
  maintenanceFreq?: number;
  nextMaintenanceDate?: string;
  maintenanceMethods?: string;
  matchedProducts?: string;
  recommendedProducts?: string;
}

// ==================== 战役看板 ====================
export interface CampaignDashboardVO {
  targetCount: number;
  targetAmount?: number;
  addedCount: number;
  validRate: number;
  conversionRate: number;
  keyFollowCount: number;
  newClueCount: number;
  pendingReviewCount: number;
  yellowWarningCount: number;
  redWarningCount: number;
  expectedThisWeek: number;
}

export interface CampaignItem {
  id: number;
  name: string;
  startDate?: string;
  endDate?: string;
  targetCount?: number;
  targetAmount?: number;
  status?: string;
  description?: string;
  priority?: string;
  managerName?: string;
}

// ==================== 决策人 ====================
export interface ClueContactVO {
  id: number;
  clueId: number;
  name: string;
  position?: string;
  level?: string;
  contactInfo?: string;
  attitude?: string;
  influenceWeight?: number;
  remarks?: string;
  interactionRecords?: string;
  personalFocus?: string;
  relations?: string;
  createTime?: string;
}

export interface ClueContactSaveDTO {
  name: string;
  position?: string;
  level?: string;
  contactInfo?: string;
  attitude?: string;
  influenceWeight?: number;
  remarks?: string;
  interactionRecords?: string;
  personalFocus?: string;
  relations?: string;
}

// ==================== 跟进记录 ====================
export interface FollowVO {
  id: number;
  clueId: number;
  followType: string;
  followDate?: string;
  followUserId?: number;
  followUserName?: string;
  contactPerson?: string;
  coreConclusion?: string;
  detailContent?: string;
  nextPlan?: string;
  nextDeadline?: string;
  newStatus?: string;
  weeklyReviewNotes?: string;
  attachmentUrls?: string;
  createTime: string;
  createBy?: number;
}

export interface FollowSaveDTO {
  clueId: number;
  followType?: string;
  contactPerson?: string;
  coreConclusion?: string;
  detailContent?: string;
  nextPlan?: string;
  nextDeadline?: string;
  newStatus?: string;
  weeklyReviewNotes?: string;
  statusChangeReason?: string;
  confirmLongInterval?: boolean;
}

// ==================== 商机评审 ====================
export interface OpportunityReviewDTO {
  opportunityAmount?: number;
  expectedDuration?: number;
  opinion?: string;
}

export interface OpportunityReviewVO {
  id: number;
  clueId: number;
  reviewerId?: number;
  conclusion?: string;
  opinion?: string;
  rejectReason?: string;
  supplementItems?: string;
  opportunityCode?: string;
  opportunityLevel?: string;
  expectedDuration?: number;
  pipelineId?: number;
  createTime?: string;
}

export interface ClueFullDetailVO extends ClueVO {
  campaign?: CampaignItem;
  contacts?: ClueContactVO[];
  followRecords?: FollowVO[];
  opportunityReviews?: OpportunityReviewVO[];
  ironTriangleTasks?: Array<{
    id: number;
    clueId: number;
    role: string;
    assigneeId?: number;
    taskTitle: string;
    status?: string;
    deadline?: string;
    deliverable?: string;
    createTime?: string;
  }>;
  resources?: Array<{
    id: number;
    clueId: number;
    resourceType: string;
    status?: string;
    applyTime?: string;
    effectNotes?: string;
    createTime?: string;
  }>;
  solutions?: ClueSolutionVO[];
  files?: ClueFileVO[];
  logs?: ClueLogVO[];
}

// ==================== 方案库 ====================
export interface ClueSolutionVO {
  id: number;
  clueId: number;
  solutionType: string;
  title: string;
  description?: string;
  productLevels?: string;
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  version?: number;
  isCurrent?: number;
  isPool?: number;
  createTime?: string;
}

export interface ClueSolutionSaveDTO {
  solutionType: string;
  title: string;
  description?: string;
  productLevels?: string;
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  isPool?: number;
}

// ==================== 资料库 ====================
export interface ClueFileVO {
  id: number;
  clueId: number;
  fileType: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  fileExt?: string;
  mimeType?: string;
  isPool?: number;
  description?: string;
  createTime?: string;
}

export interface ClueFileSaveDTO {
  fileType: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  fileExt?: string;
  mimeType?: string;
  description?: string;
  isPool?: number;
}

// ==================== 操作日志 ====================
export interface ClueLogVO {
  id: number;
  clueId: number;
  actionType: string;
  actionSummary?: string;
  detailJson?: string;
  operatorId?: number;
  operatorName?: string;
  createTime: string;
}

// ==================== 资源申请 ====================
export interface ClueResourceSaveDTO {
  resourceType: string;
  effectNotes?: string;
}

// ==================== 铁三角任务 ====================
export interface IronTriangleTaskSaveDTO {
  role: string;
  assigneeId?: number;
  taskTitle: string;
  deadline?: string;
  deliverable?: string;
}

// ==================== 转项目 ====================
export interface ClueConvertDTO {
  projectName: string;
  projectManager: string;
  projectAmount: number;
}

// ==================== 线索 CRUD ====================

export async function fetchCluePage(params: CluePageParams): Promise<CluePageResult> {
  const res = await request.get('/api/clue/page', { params });
  return res.data;
}

export async function fetchClueDetail(id: number): Promise<ClueVO> {
  const res = await request.get(`/api/clue/${id}`);
  return res.data;
}

export async function createClue(data: ClueSaveDTO): Promise<void> {
  await request.post('/api/clue', data);
}

export async function updateClue(id: number, data: Partial<ClueSaveDTO>): Promise<void> {
  await request.put(`/api/clue/${id}`, data);
}

export async function deleteClue(id: number): Promise<void> {
  await request.delete(`/api/clue/${id}`);
}

export async function batchDeleteClue(ids: number[]): Promise<void> {
  await request.delete('/api/clue/batch', { data: ids });
}

export async function fetchClueStats(): Promise<ClueStats> {
  const res = await request.get('/api/clue/stats');
  return res.data;
}

export async function convertClueToProject(id: number, dto: ClueConvertDTO): Promise<{ projectId: number }> {
  const res = await request.post(`/api/clue/${id}/convert`, dto);
  return res.data;
}

// ==================== 战役 ====================

export async function fetchCampaignDashboard(campaignId: number): Promise<CampaignDashboardVO> {
  const res = await request.get('/api/clue/campaign/dashboard', { params: { campaignId } });
  return res.data;
}

export async function fetchCampaigns(): Promise<CampaignItem[]> {
  const res = await request.get('/api/clue/campaigns');
  return res.data;
}

// ==================== 全量详情 ====================

export async function fetchClueFullDetail(id: number): Promise<ClueFullDetailVO> {
  const res = await request.get(`/api/clue/${id}/full-detail`);
  return res.data;
}

// ==================== 商机评审 ====================

export async function submitOpportunityReview(clueId: number, dto: OpportunityReviewDTO): Promise<void> {
  await request.post(`/api/clue/${clueId}/opportunity-review`, dto);
}

export async function approveClueReview(clueId: number, reviewId: number): Promise<{ opportunityCode: string }> {
  const res = await request.put(`/api/clue/${clueId}/review/${reviewId}/approve`);
  return res.data;
}

// ==================== 决策人 ====================

export async function addClueContact(clueId: number, dto: ClueContactSaveDTO): Promise<any> {
  const res = await request.post(`/api/clue/${clueId}/contacts`, dto);
  return res.data;
}

export async function updateClueContact(clueId: number, contactId: number, dto: ClueContactSaveDTO): Promise<any> {
  const res = await request.put(`/api/clue/${clueId}/contacts/${contactId}`, dto);
  return res.data;
}

// ==================== 资源 ====================

export async function addClueResource(clueId: number, dto: ClueResourceSaveDTO): Promise<any> {
  const res = await request.post(`/api/clue/${clueId}/resources`, dto);
  return res.data;
}

// ==================== 铁三角 ====================

export async function addIronTriangleTask(clueId: number, dto: IronTriangleTaskSaveDTO): Promise<any> {
  const res = await request.post(`/api/clue/${clueId}/iron-triangle`, dto);
  return res.data;
}

// ==================== v1.4 批量操作 ====================

export async function batchAssignClues(ids: number[], owner: string): Promise<void> {
  await request.put('/api/clue/batch/assign', { ids, owner });
}

export async function batchUpdateLevel(ids: number[], level: string): Promise<void> {
  await request.put('/api/clue/batch/level', { ids, level });
}

export async function batchMoveToCampaign(ids: number[], campaignId: number): Promise<void> {
  await request.put('/api/clue/batch/campaign', { ids, campaignId });
}

// ==================== v1.5 方案库 ====================

export async function fetchClueSolutions(clueId: number): Promise<ClueSolutionVO[]> {
  const res = await request.get(`/api/clue/${clueId}/solutions`);
  return res.data;
}

export async function saveClueSolution(clueId: number, dto: ClueSolutionSaveDTO): Promise<ClueSolutionVO> {
  const res = await request.post(`/api/clue/${clueId}/solutions`, dto);
  return res.data;
}

export async function deleteClueSolution(clueId: number, solutionId: number): Promise<void> {
  await request.delete(`/api/clue/${clueId}/solutions/${solutionId}`);
}

// ==================== v1.5 资料库 ====================

export async function fetchClueFiles(clueId: number): Promise<ClueFileVO[]> {
  const res = await request.get(`/api/clue/${clueId}/files`);
  return res.data;
}

export async function uploadClueFile(clueId: number, dto: ClueFileSaveDTO): Promise<ClueFileVO> {
  const res = await request.post(`/api/clue/${clueId}/files`, dto);
  return res.data;
}

export async function deleteClueFile(clueId: number, fileId: number): Promise<void> {
  await request.delete(`/api/clue/${clueId}/files/${fileId}`);
}

export async function poolClueFile(clueId: number, fileId: number): Promise<void> {
  await request.put(`/api/clue/${clueId}/files/${fileId}/pool`);
}

// ==================== v1.5 操作日志 ====================

export async function fetchClueLogs(clueId: number, actionType?: string): Promise<ClueLogVO[]> {
  const res = await request.get(`/api/clue/${clueId}/logs`, { params: actionType ? { actionType } : {} });
  return res.data;
}

// ==================== v1.5 导出 ====================

export async function exportWeekReport(clueIds: number[]): Promise<any[]> {
  const res = await request.post('/api/clue/export-weekly', clueIds);
  return res.data;
}

// ==================== 跟进记录 ====================

export async function fetchClueFollows(clueId: number): Promise<FollowVO[]> {
  const res = await request.get(`/api/clue/${clueId}/follow`);
  return res.data;
}

export async function createClueFollow(data: FollowSaveDTO): Promise<void> {
  await request.post('/api/clue/follow', data);
}

export async function deleteClueFollow(id: number): Promise<void> {
  await request.delete(`/api/clue/follow/${id}`);
}

// ==================== 回收站 ====================

export async function fetchRecyclePage(params: { pageNum: number; pageSize: number; type?: string }): Promise<{ records: any[]; total: number }> {
  const res = await request.get('/api/recycle/page', { params: { ...params, type: params.type || 'clue' } });
  return res.data;
}

export async function restoreRecycle(ids: number[], type = 'clue'): Promise<void> {
  await request.put('/api/recycle/restore', { ids, type });
}

export async function permDeleteRecycle(ids: number[], type = 'clue'): Promise<void> {
  await request.delete('/api/recycle/perm', { data: { ids, type } });
}
