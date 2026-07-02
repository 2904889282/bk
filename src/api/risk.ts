import request from '../utils/request';

// ============================================================
// 风险模块 API 层
// 基础路径：/api/risk
// 响应解包：request.ts 拦截器已统一解包
// ============================================================

// ==================== 类型定义 ====================

/** 风险视图对象 */
export interface RiskVO {
  id: number;
  projectId: number;
  projectName?: string;
  type: string;
  level: string;            // high/medium/low
  description?: string;
  solution?: string;
  owner?: string;
  status: string;           // open/resolved
  createTime?: string;
  updateTime?: string;
}

/** 分页查询参数 */
export interface RiskPageParams {
  pageNum: number;
  pageSize: number;
  keyword?: string;
  level?: string;
  status?: string;
}

/** 分页返回 */
export interface RiskPageResult {
  records: RiskVO[];
  total: number;
}

/** 新增/编辑请求体 */
export interface RiskSaveDTO {
  projectId: number;
  type: string;
  level: string;
  description?: string;
  solution?: string;
  owner?: string;
}

// ==================== 接口函数 ====================

/** 分页查询 */
export async function fetchRiskPage(params: RiskPageParams): Promise<RiskPageResult> {
  const res = await request.get('/api/risk/page', { params });
  return res.data;
}

/** 详情 */
export async function fetchRiskDetail(id: number): Promise<RiskVO> {
  const res = await request.get(`/api/risk/${id}`);
  return res.data;
}

/** 新增 */
export async function createRisk(data: RiskSaveDTO): Promise<void> {
  await request.post('/api/risk', data);
}

/** 编辑 */
export async function updateRisk(id: number, data: RiskSaveDTO): Promise<void> {
  await request.put(`/api/risk/${id}`, data);
}

/** 删除 */
export async function deleteRisk(id: number): Promise<void> {
  await request.delete(`/api/risk/${id}`);
}

/** 批量删除 */
export async function batchDeleteRisk(ids: number[]): Promise<void> {
  await request.delete('/api/risk/batch', { data: ids });
}

/** 标记已解决 */
export async function resolveRisk(id: number): Promise<void> {
  await request.put(`/api/risk/${id}/resolve`);
}
