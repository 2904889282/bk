import request from '../utils/request';

// ============================================================
// 管线模块 API 层
// 基础路径：/api/pipelines（和网关 Path=/api/pipelines/** 严格对齐）
// 响应解包：request.ts 拦截器已统一解包 {code, msg, data} → 直接返回 data
// 字段命名：100% 对齐后端 Pipeline.java 实体，前端零映射
// ============================================================

// ==================== 类型定义 ====================

/** 管线实体（严格对齐后端 Pipeline.java） */
export interface Pipeline {
  id: string;
  name: string;
  stage: string;
  client: string;
  product: string;
  industry: string;
  amount: number;
  winRate: number;
  priority: string;
  manager: string;
  /** 铁三角: AR 客户经理 */
  arId?: string;
  /** 铁三角: SR 方案经理 */
  srId?: string;
  /** 铁三角: FR 交付经理 */
  frId?: string;
  source: string;
  description: string;
  nextAction: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

/** 新增/编辑请求体（不包含后端自动生成字段） */
export interface PipelineSaveDTO {
  name: string;
  stage: string;
  client: string;
  product: string;
  industry: string;
  amount: number;
  winRate: number;
  priority: string;
  manager: string;
  source: string;
  description: string;
  nextAction: string;
}

/** 看板统计 */
export interface PipelineStageStats {
  stage: string;
  count: number;
}

export interface PipelineStats {
  stats: PipelineStageStats[];
}

// ==================== 接口函数 ====================

/** 1. 全量列表（后端无分页，走 Redis 缓存） */
export async function fetchPipelineList(): Promise<Pipeline[]> {
  const res = await request.get('/api/pipelines');
  return res.data;
}

/** 2. 新增 */
export async function createPipeline(data: PipelineSaveDTO): Promise<Pipeline> {
  const res = await request.post('/api/pipelines', data);
  return res.data;
}

/** 3. 编辑 */
export async function updatePipeline(id: string, data: PipelineSaveDTO): Promise<Pipeline> {
  const res = await request.put(`/api/pipelines/${id}`, data);
  return res.data;
}

/** 4. 单条删除 */
export async function deletePipeline(id: string): Promise<void> {
  await request.delete(`/api/pipelines/${id}`);
}

/** 5. ES 全文搜索 */
export async function searchPipeline(keyword: string): Promise<Pipeline[]> {
  const res = await request.get('/api/pipelines/search', { params: { keyword } });
  return res.data;
}

/** 6. 看板统计 */
export async function fetchPipelineStats(): Promise<PipelineStats> {
  const res = await request.get('/api/pipelines/stats');
  return res.data;
}
