import request from '../utils/request';

// ============================================================
// 线索模块 API 层
// 基础路径：/api/clue（和单体后端 @RequestMapping 严格对齐）
// 响应解包：request.ts 拦截器已统一解包 {code, msg, data} → 直接返回 data
// 字段命名：100% 对齐后端 ClueVO / ClueSaveDTO / FollowVO / FollowSaveDTO
// ============================================================

// ==================== 类型定义 ====================

/** 线索视图对象（列表+详情同构） */
export interface ClueVO {
  id: number;
  clueName: string;
  clientCompany: string;
  clientDept?: string;
  clientContact?: string;
  beikeOwner: string;
  budget?: string;
  clueLevel: string;
  clueStatus: string;
  reviewStatus?: string;
  businessConfirmed?: string;
  contactDate?: string;
  proposalDate?: string;
  createDate?: string;
  requirementDesc?: string;
  clueEvaluation?: string;
  remark?: string;
  deptBelong: string;
  commRecord1?: string;
  commRecord2?: string;
  commRecord3?: string;
  commRecord4?: string;
  arUserId?: number;
  srUserId?: number;
  frUserId?: number;
  relatedProjectId?: number;
  isConverted?: boolean;
  expectedRestart?: string;
  relation1?: string;
  relation2?: string;
  relation3?: string;
  createTime?: string;
  updateTime?: string;
}

/** 线索分页查询参数 */
export interface CluePageParams {
  pageNum: number;
  pageSize: number;
  keyword?: string;
  owner?: string;
  status?: string;
  level?: string;
  dateFrom?: string;
  dateTo?: string;
}

/** 线索分页返回 */
export interface CluePageResult {
  records: ClueVO[];
  total: number;
}

/** 线索新增/编辑请求体 */
export interface ClueSaveDTO {
  clueName: string;
  clientCompany: string;
  clientDept?: string;
  clientContact?: string;
  beikeOwner: string;
  budget?: string;
  clueLevel: string;
  clueStatus: string;
  reviewStatus?: string;
  businessConfirmed?: string;
  contactDate?: string;
  proposalDate?: string;
  createDate?: string;
  requirementDesc?: string;
  clueEvaluation?: string;
  remark?: string;
  deptBelong: string;
  commRecord1?: string;
  commRecord2?: string;
  commRecord3?: string;
  commRecord4?: string;
  arUserId?: number;
  srUserId?: number;
  frUserId?: number;
  relation1?: string;
  relation2?: string;
  relation3?: string;
}

/** 线索统计 */
export interface ClueStats {
  total: number;
  pending: number;
  accepted: number;
  converted: number;
}

/** 跟进记录 */
export interface FollowVO {
  id: number;
  clueId: number;
  content: string;
  newStatus?: string;
  createTime: string;
  createBy: string;
}

/** 跟进保存 */
export interface FollowSaveDTO {
  clueId: number;
  content: string;
  newStatus?: string;
}

/** 转项目 */
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

export async function updateClue(id: number, data: ClueSaveDTO): Promise<void> {
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

// ==================== 跟进记录 ====================

export async function fetchClueFollows(clueId: number): Promise<FollowVO[]> {
  const res = await request.get(`/api/clue/${clueId}/follow`);
  return res.data;
}

export async function createClueFollow(data: FollowSaveDTO): Promise<void> {
  await request.post('/api/clue/follow', data);
}

export async function updateClueFollow(id: number, data: FollowSaveDTO): Promise<void> {
  await request.put(`/api/clue/follow/${id}`, data);
}

export async function deleteClueFollow(id: number): Promise<void> {
  await request.delete(`/api/clue/follow/${id}`);
}

// ==================== 回收站 ====================

export async function fetchRecyclePage(params: { pageNum: number; pageSize: number; type?: string }): Promise<{ records: ClueVO[]; total: number }> {
  const res = await request.get('/api/recycle/page', { params: { ...params, type: params.type || 'clue' } });
  return res.data;
}

export async function restoreRecycle(ids: number[], type = 'clue'): Promise<void> {
  await request.put('/api/recycle/restore', { ids, type });
}

export async function permDeleteRecycle(ids: number[], type = 'clue'): Promise<void> {
  await request.delete('/api/recycle/perm', { data: { ids, type } });
}
