import request from '../utils/request';

// ==================== 类型定义 ====================

export interface ProjectPageParams {
  pageNum: number;
  pageSize: number;
  keyword?: string;
  status?: string;
  projectLevel?: string;
  deptBelong?: string;
}

export interface ProjectVO {
  id: number;
  projectName: string;
  projectNumber?: string;
  clientName: string;
  clientContact?: string;
  projectManager: string;
  deliveryManager?: string;
  productManager?: string;
  projectAmount: number;
  projectLevel: string;
  projectStatus: string;
  deptBelong: string;
  startDate: string;
  expectEndDate?: string;
  actualEndDate?: string;
  progress: number;
  sourceClueId?: number;
  supplier?: string;
  riskAssessment?: string;
  remark?: string;
  stage?: string;
  description?: string;
  createTime: string;
  updateTime: string;
}

export interface ProjectPageResult {
  records: ProjectVO[];
  total: number;
}

export interface ProjectSaveDTO {
  projectName: string;
  projectNumber?: string;
  clientName: string;
  clientContact?: string;
  projectManager: string;
  deliveryManager?: string;
  productManager?: string;
  projectAmount: number;
  projectLevel: string;
  projectStatus: string;
  deptBelong: string;
  startDate: string;
  expectEndDate?: string;
  progress?: number;
  supplier?: string;
  riskAssessment?: string;
  remark?: string;
  description?: string;
}

// ==================== 月度期数 ====================

export interface ProjectPeriod {
  id?: number;
  projectId: number;
  periodMonth: string;
  periodStatus?: string;
  estimatedRevenue?: number;
  estimatedProfit?: number;
  estimatedProfitRate?: string;
  estimatedCost?: number;
  estimatedLaborCost?: number;
  actualRevenue?: number;
  actualProfit?: number;
  actualProfitRate?: string;
  actualCost?: number;
  actualLaborCost?: number;
  profitAchievementRate?: string;
  goalDescription?: string;
  monthlyTarget?: string;
  monthlyActual?: string;
  monthlyProgress?: string;
  goalSummary?: string;
  w1Target?: string; w1Actual?: string; w1Progress?: string;
  w2Target?: string; w2Actual?: string; w2Progress?: string;
  w3Target?: string; w3Actual?: string; w3Progress?: string;
  w4Target?: string; w4Actual?: string; w4Progress?: string;
  personnel?: string;
  milestones?: string;
  processBonus?: string;
  resultBonus?: string;
  alertText?: string;
  progressInterpretation?: string;
  monthlyProfitExpectation?: string;
  executionStaff?: string;
  customerInfo?: string;
  riskAssessment?: string;
  supplier?: string;
  createTime?: string;
}

// ==================== 项目接口 ====================

export async function fetchProjectPage(params: ProjectPageParams): Promise<ProjectPageResult> {
  const res = await request.get('/api/project/page', { params });
  return res.data;
}

export async function fetchProjectDetail(id: number): Promise<ProjectVO> {
  const res = await request.get(`/api/project/${id}`);
  return res.data;
}

export async function createProject(data: ProjectSaveDTO): Promise<any> {
  const res = await request.post('/api/project', data);
  return res.data;
}

export async function updateProject(id: number, data: ProjectSaveDTO): Promise<void> {
  await request.put(`/api/project/${id}`, data);
}

export async function deleteProject(id: number): Promise<void> {
  await request.delete(`/api/project/${id}`);
}

export async function deleteProjectBatch(ids: number[]): Promise<void> {
  await request.delete('/api/project/batch', { data: ids });
}

// ==================== 月度期数接口 ====================

export async function fetchPeriods(projectId: number): Promise<ProjectPeriod[]> {
  const res = await request.get(`/api/project-period/list/${projectId}`);
  return res.data;
}

export async function savePeriod(data: ProjectPeriod): Promise<ProjectPeriod> {
  const res = await request.post('/api/project-period', data);
  return res.data;
}

export async function deletePeriod(id: number): Promise<void> {
  await request.delete(`/api/project-period/${id}`);
}

// ==================== 项目仪表盘 ====================

export interface ProjectDashboard {
  project: ProjectVO;
  periods: ProjectPeriod[];
  weeklies: any[];
  milestones: any[];
  team: any[];
  wbs: any[];
  changes: any[];
  risks: any[];
}

export async function fetchDashboard(projectId: number): Promise<ProjectDashboard> {
  const res = await request.get(`/api/project/${projectId}/dashboard`);
  return res.data;
}

// ==================== 周报 ====================

export async function fetchWeeklies(projectId: number, month?: string): Promise<any[]> {
  const res = await request.get(`/api/project/${projectId}/weekly`, { params: month ? { month } : {} });
  return res.data;
}

export async function saveWeekly(projectId: number, data: any): Promise<any> {
  const res = await request.post(`/api/project/${projectId}/weekly`, data);
  return res.data;
}

// ==================== 里程碑 ====================

export async function fetchMilestones(projectId: number): Promise<any[]> {
  const res = await request.get(`/api/project/${projectId}/milestones`);
  return res.data;
}

export async function saveMilestones(projectId: number, items: any[]): Promise<void> {
  await request.post(`/api/project/${projectId}/milestones`, items);
}

// ==================== 团队 ====================

export async function fetchTeam(projectId: number): Promise<any[]> {
  const res = await request.get(`/api/project/${projectId}/team`);
  return res.data;
}

export async function saveTeam(projectId: number, items: any[]): Promise<void> {
  await request.post(`/api/project/${projectId}/team`, items);
}

// ==================== WBS ====================

export async function fetchWBS(projectId: number): Promise<any[]> {
  const res = await request.get(`/api/project/${projectId}/wbs`);
  return res.data;
}

export async function saveWBS(projectId: number, items: any[]): Promise<void> {
  await request.post(`/api/project/${projectId}/wbs`, items);
}

// ==================== 变更 ====================

export async function fetchChanges(projectId: number): Promise<any[]> {
  const res = await request.get(`/api/project/${projectId}/changes`);
  return res.data;
}

export async function createChange(projectId: number, data: any): Promise<any> {
  const res = await request.post(`/api/project/${projectId}/changes`, data);
  return res.data;
}
