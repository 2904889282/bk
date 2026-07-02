import request from '../utils/request';

// ============================================================
// 人才模块 API 层
// 基础路径：/api/talent
// 响应解包：request.ts 拦截器已统一解包
// ============================================================

// ==================== 类型定义 ====================

/** 人才视图对象 */
export interface TalentVO {
  id: number;
  name: string;
  role?: string;
  skills?: string;
  currentProject?: string;
  utilization: number;
  status: string;           // normal/high/overload/idle
  createTime?: string;
  updateTime?: string;
}

/** 分页查询参数 */
export interface TalentPageParams {
  pageNum: number;
  pageSize: number;
  keyword?: string;
  status?: string;
}

/** 分页返回 */
export interface TalentPageResult {
  records: TalentVO[];
  total: number;
}

/** 新增/编辑请求体 */
export interface TalentSaveDTO {
  name: string;
  role?: string;
  skills?: string;
  currentProject?: string;
  utilization?: number;
  status?: string;
}

// ==================== 接口函数 ====================

/** 分页查询 */
export async function fetchTalentPage(params: TalentPageParams): Promise<TalentPageResult> {
  const res = await request.get('/api/talent/page', { params });
  return res.data;
}

/** 详情 */
export async function fetchTalentDetail(id: number): Promise<TalentVO> {
  const res = await request.get(`/api/talent/${id}`);
  return res.data;
}

/** 新增 */
export async function createTalent(data: TalentSaveDTO): Promise<void> {
  await request.post('/api/talent', data);
}

/** 编辑 */
export async function updateTalent(id: number, data: TalentSaveDTO): Promise<void> {
  await request.put(`/api/talent/${id}`, data);
}

/** 删除 */
export async function deleteTalent(id: number): Promise<void> {
  await request.delete(`/api/talent/${id}`);
}

/** 批量删除 */
export async function batchDeleteTalent(ids: number[]): Promise<void> {
  await request.delete('/api/talent/batch', { data: ids });
}
