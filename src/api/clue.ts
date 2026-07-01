import request from './request';

export interface ClueVO {
  id: number;
  clueName: string;
  clientCompany: string;
  clientDept: string;
  clientContact: string;
  beikeOwner: string;
  budget: string;
  clueLevel: string;
  clueStatus: string;
  reviewStatus: string;
  businessConfirmed: string;
  contactDate: string;
  proposalDate: string;
  createDate: string;
  requirementDesc: string;
  clueEvaluation: string;
  remark: string;
  deptBelong: string;
  arUserId: number;
  srUserId: number;
  frUserId: number;
  relatedProjectId: number;
  isConverted: boolean;
  createTime: string;
  updateTime: string;
}

export interface CluePageParams {
  pageNum?: number;
  pageSize?: number;
  keyword?: string;
  owner?: string;
  status?: string;
  level?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CluePageResult {
  list: ClueVO[];
  total: number;
  pageNum: number;
  pageSize: number;
}

/** 跟进记录 VO */
export interface ClueFollowVO {
  id: number;
  clueId: number;
  followType: string;
  followDate: string;
  followUserId: number;
  followUserName: string;
  coreConclusion: string;
  detailContent: string;
  nextPlan: string;
  nextDeadline: string;
  newStatus: string;
  createTime: string;
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
  requirementDesc?: string;
  clueEvaluation?: string;
  remark?: string;
  deptBelong: string;
  arUserId?: number;
  srUserId?: number;
  frUserId?: number;
}

export function fetchClueList(params: CluePageParams): Promise<CluePageResult> {
  return request.get('/clue/page', { params });
}

export function fetchClueDetail(id: number): Promise<ClueVO> {
  return request.get(`/clue/${id}`);
}

export function createClue(data: ClueSaveDTO): Promise<void> {
  return request.post('/clue', data);
}

export function updateClue(id: number, data: ClueSaveDTO): Promise<void> {
  return request.put(`/clue/${id}`, data);
}

/** 单条删除 */
export function deleteClue(id: number): Promise<void> {
  return request.delete(`/clue/${id}`);
}

/** 批量删除 */
export function deleteClueBatch(ids: number[]): Promise<void> {
  return request.delete('/clue/batch', { data: ids });
}

export function createFollow(data: Record<string, unknown>): Promise<void> {
  return request.post('/clue/follow', data);
}

export function fetchFollowList(clueId: number): Promise<ClueFollowVO[]> {
  return request.get(`/clue/${clueId}/follow`);
}

export function convertClueToProject(clueId: number, data: Record<string, unknown>): Promise<void> {
  return request.post(`/clue/${clueId}/convert`, data);
}
