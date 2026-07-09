import request from '../utils/request';
import type { Pipeline as LegacyPipeline } from '../types';
import { normalizePipelineStage } from '../utils/stageMapping';
import { mockPipelineStore, isMockMode } from '../utils/mockStore';

// ============================================================
// 线索模块 API 层
// 基础路径：/api/pipeline（对齐后端 PipelineController）
// ============================================================

// ==================== 兼容旧类型（LTC 看板/分析页使用） ====================

/** @deprecated 旧版线索类型，仅保留兼容看板/分析页。新页面请使用 PipelineVO */
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
    product: (r as any).product || '' as LegacyPipeline['product'],
    industry: (r as any).industry || '' as LegacyPipeline['industry'],
    amount: r.amount || 0,
    winRate: r.winRate || 0,
    priority: ((r as any).priority || 'normal') as LegacyPipeline['priority'],
    manager: (r as any).managerName || r.ownerName || '',
    source: (r as any).source || '',
    description: r.description || '',
    nextAction: (r as any).nextAction || '',
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
  try {
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
  } catch {
    if (isMockMode()) {
      const result = mockPipelineStore.page({ pageNum: params.pageNum, pageSize: params.pageSize, keyword: params.keyword, stage: params.stage, customer: params.customer });
      return { records: result.records as unknown as PipelineVO[], total: result.total };
    }
    throw new Error('后端不可用');
  }
}

export async function fetchPipelineDetail(id: number): Promise<PipelineVO> {
  try {
    const res = await request.get(`/api/pipeline/${id}`);
    return {
      ...res.data,
      stage: normalizePipelineStage(res.data.stage),
    };
  } catch {
    if (isMockMode()) {
      const found = mockPipelineStore.get(id);
      if (found) return { ...found, stage: normalizePipelineStage(found.stage) } as unknown as PipelineVO;
    }
    throw new Error('后端不可用');
  }
}

export async function createPipeline(data: PipelineSaveDTO): Promise<void> {
  try {
    const payload = {
      ...data,
      customer: data.customer ?? data.client,
      stage: normalizePipelineStage(data.stage),
    };
    await request.post('/api/pipeline', payload);
  } catch {
    if (isMockMode()) { mockPipelineStore.create(data as any); return; }
    throw new Error('后端不可用');
  }
}

export async function updatePipeline(id: number | string, data: PipelineSaveDTO): Promise<void> {
  try {
    const payload = {
      ...data,
      customer: data.customer ?? data.client,
      stage: data.stage ? normalizePipelineStage(data.stage) : undefined,
    };
    await request.put(`/api/pipeline/${id}`, payload);
  } catch {
    if (isMockMode()) { mockPipelineStore.update(Number(id), data as any); return; }
    throw new Error('后端不可用');
  }
}

export async function deletePipeline(id: number | string): Promise<void> {
  try {
    await request.delete(`/api/pipeline/${id}`);
  } catch {
    if (isMockMode()) { mockPipelineStore.delete(Number(id)); return; }
    throw new Error('后端不可用');
  }
}

export async function deletePipelineBatch(ids: number[]): Promise<void> {
  try {
    await request.delete('/api/pipeline/batch', { data: ids });
  } catch {
    if (isMockMode()) { mockPipelineStore.batchDelete(ids); return; }
    throw new Error('后端不可用');
  }
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
