import request from '../utils/request';

// ============================================================
// 预警模块 API 层
// 基础路径：/api/alert
// 响应解包：request.ts 拦截器已统一解包
// ============================================================

// ==================== 类型定义 ====================

/** 预警视图对象 */
export interface AlertVO {
  id: number;
  projectId: number;
  projectName?: string;
  type: string;
  level: string;            // high/medium
  description?: string;
  manager?: string;
  status: string;           // open/resolved
  createTime?: string;
  updateTime?: string;
}

/** 分页查询参数 */
export interface AlertPageParams {
  pageNum: number;
  pageSize: number;
  keyword?: string;
  level?: string;
  status?: string;
}

/** 分页返回 */
export interface AlertPageResult {
  records: AlertVO[];
  total: number;
}

/** 新增/编辑请求体 */
export interface AlertSaveDTO {
  projectId: number;
  type: string;
  level: string;
  description?: string;
  manager?: string;
}

// ==================== 接口函数 ====================

/** 分页查询 */
export async function fetchAlertPage(params: AlertPageParams): Promise<AlertPageResult> {
  const res = await request.get('/api/alert/page', { params });
  return res.data;
}

/** 详情 */
export async function fetchAlertDetail(id: number): Promise<AlertVO> {
  const res = await request.get(`/api/alert/${id}`);
  return res.data;
}

/** 新增 */
export async function createAlert(data: AlertSaveDTO): Promise<void> {
  await request.post('/api/alert', data);
}

/** 编辑 */
export async function updateAlert(id: number, data: AlertSaveDTO): Promise<void> {
  await request.put(`/api/alert/${id}`, data);
}

/** 删除 */
export async function deleteAlert(id: number): Promise<void> {
  await request.delete(`/api/alert/${id}`);
}

/** 批量删除 */
export async function batchDeleteAlert(ids: number[]): Promise<void> {
  await request.delete('/api/alert/batch', { data: ids });
}

/** 标记已处理 */
export async function resolveAlert(id: number): Promise<void> {
  await request.put(`/api/alert/${id}/resolve`);
}
