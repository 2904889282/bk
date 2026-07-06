import request from '../utils/request';
import type { Pipeline as LegacyPipeline } from '../types';
import { normalizePipelineStage } from '../utils/stageMapping';

// ============================================================
// 管线模块 API 层
// 基础路径：/api/pipeline（对齐后端 PipelineController）
// ============================================================

// ==================== 兼容旧类型（LTC 看板/分析页使用） ====================

/** @deprecated 旧版管线类型，仅保留兼容看板/分析页。新页面请使用 PipelineVO */
export type Pipeline = LegacyPipeline;

/** @deprecated 旧版全量查询，仅保留兼容看板/分析页。新页面请使用 fetchPipelinePage */
export async function fetchPipelineList(): Promise<Pipeline[]> {
  const res = await fetchPipelinePage({ pageNum: 1, pageSize: 999 });
  const records = (res.records || []) as PipelineVO[];
  return records.map(r => ({
    id: String(r.id),
    name: r.name || '',
    stage: normalizePipelineStage(r.stage) as LegacyPipeline['stage'],
    client: r.customer || '',
    product: '' as LegacyPipeline['product'],
    industry: '' as LegacyPipeline['industry'],
    amount: r.amount || 0,
    winRate: r.winRate || 0,
    priority: 'normal' as LegacyPipeline['priority'],
    manager: r.ownerName || '',
    source: '',
    description: r.description || '',
    nextAction: r.nextAction || '',
    createdAt: r.createTime || '',
    updatedAt: r.updateTime || '',
  }));
}

// ==================== 新类型定义 ====================

export interface PipelineMemberVO {
  userId: number;
  userName: string;
  role: string;
}

export interface PipelineVO {
  id: number;
  name: string;
  customer: string;
  stage: string;
  amount: number;
  winRate: number;
  ownerId: number;
  ownerName: string;
  deptId: number;
  deptName: string;
  isSea: number;
  description: string;
  nextAction: string;
  members: PipelineMemberVO[];
  createTime: string;
  updateTime: string;
}

export interface PipelinePageParams {
  pageNum: number;
  pageSize: number;
  keyword?: string;
  stage?: string;
  owner?: string;
  customer?: string;
  dateFrom?: string;
  dateTo?: string;
  isSea?: number;
}

export interface PipelinePageResult {
  records: PipelineVO[];
  total: number;
}

export interface PipelineSaveDTO {
  name: string;
  customer?: string;
  /** @deprecated Compatibility with the legacy LTC pipeline form. Prefer customer. */
  client?: string;
  stage?: string;
  amount?: number;
  winRate?: number;
  ownerId?: number;
  product?: string;
  industry?: string;
  priority?: string;
  manager?: string;
  source?: string;
  description?: string;
  nextAction?: string;
  memberIds?: number[];
}

// ==================== 接口函数 ====================

export async function fetchPipelinePage(params: PipelinePageParams): Promise<PipelinePageResult> {
  const nextParams = {
    ...params,
    stage: params.stage ? normalizePipelineStage(params.stage) : undefined,
  };
  const res = await request.get('/api/pipeline/page', { params: nextParams });
  return {
    ...res.data,
    records: (res.data.records || []).map((record: PipelineVO) => ({
      ...record,
      stage: normalizePipelineStage(record.stage),
    })),
  };
}

export async function fetchPipelineDetail(id: number): Promise<PipelineVO> {
  const res = await request.get(`/api/pipeline/${id}`);
  return {
    ...res.data,
    stage: normalizePipelineStage(res.data.stage),
  };
}

export async function createPipeline(data: PipelineSaveDTO): Promise<void> {
  const payload = {
    ...data,
    customer: data.customer ?? data.client,
    stage: normalizePipelineStage(data.stage),
  };
  await request.post('/api/pipeline', payload);
}

export async function updatePipeline(id: number | string, data: PipelineSaveDTO): Promise<void> {
  const payload = {
    ...data,
    customer: data.customer ?? data.client,
    stage: data.stage ? normalizePipelineStage(data.stage) : undefined,
  };
  await request.put(`/api/pipeline/${id}`, payload);
}

export async function deletePipeline(id: number | string): Promise<void> {
  await request.delete(`/api/pipeline/${id}`);
}

export async function deletePipelineBatch(ids: number[]): Promise<void> {
  await request.delete('/api/pipeline/batch', { data: ids });
}

export async function claimPipeline(id: number): Promise<void> {
  await request.post(`/api/pipeline/${id}/claim`);
}

/** 移入公海 */
export async function moveToSea(id: number): Promise<void> {
  await request.post(`/api/pipeline/${id}/move-to-sea`);
}

// ==================== 阶段字典 ====================

export interface StageDictItem {
  code: string;
  label: string;
}

/** 从后端获取阶段字典（唯一数据源），失败时返回空数组由前端本地兜底 */
export async function fetchPipelineStages(): Promise<StageDictItem[]> {
  try {
    const res = await request.get('/api/pipeline/stages');
    return res.data || [];
  } catch {
    return [];
  }
}
