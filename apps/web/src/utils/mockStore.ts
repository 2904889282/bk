/**
 * localStorage 数据降级层
 * 当后端不可用时，线索/商机数据自动写入 localStorage，
 * 确保前端在无后端环境下仍可正常填写和录入数据。
 *
 * 注意：为避免循环依赖，此处定义内联类型与 api/*.ts 保持一致。
 */
import type { ClueVO, ClueSaveDTO, CluePageResult, CluePageParams } from '../api/clue';

// ============================================================
// 内联类型 —— 与 api/pipeline.ts 保持一致，避免循环导入
// ============================================================

interface MockPipelineVO {
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
  createTime: string;
  updateTime: string;
}

interface MockPipelineSaveDTO {
  name: string;
  customer?: string;
  client?: string;
  stage?: string;
  amount?: number;
  winRate?: number;
  ownerId?: number;
  ownerName?: string;
  deptName?: string;
  product?: string;
  industry?: string;
  priority?: string;
  manager?: string;
  source?: string;
  description?: string;
  nextAction?: string;
  memberIds?: number[];
}

// ============================================================
// 通用工具
// ============================================================

function nextId(): number {
  let seed = parseInt(localStorage.getItem('_mock_id_seed') || '0', 10);
  seed += 1;
  localStorage.setItem('_mock_id_seed', String(seed));
  return seed;
}

function genClueNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  let idx = parseInt(localStorage.getItem('_mock_clue_seq') || '0', 10) + 1;
  localStorage.setItem('_mock_clue_seq', String(idx));
  return `XS-${y}${m}-${String(idx).padStart(3, '0')}`;
}

function now(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function load<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function save<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ============================================================
// 线索 Mock 存储
// ============================================================

const CLUE_KEY = '_mock_clues';

export const mockClueStore = {
  list(): ClueVO[] {
    return load<ClueVO>(CLUE_KEY);
  },

  page(params: CluePageParams): CluePageResult {
    let list = load<ClueVO>(CLUE_KEY);
    const { keyword, status, level, clueLevel, owner, clientCircle, healthStatus, campaignId, deptBelong } = params;

    if (keyword) {
      const kw = keyword.toLowerCase();
      list = list.filter(c =>
        c.clueName?.toLowerCase().includes(kw) ||
        c.clientCompany?.toLowerCase().includes(kw) ||
        c.clueNumber?.toLowerCase().includes(kw)
      );
    }
    if (status) list = list.filter(c => c.clueStatus === status);
    if (level || clueLevel) list = list.filter(c => c.clueLevel === (level || clueLevel));
    if (owner) list = list.filter(c => (c.beikeOwner || '').includes(owner));
    if (clientCircle) list = list.filter(c => c.clientCircle === clientCircle);
    if (healthStatus) list = list.filter(c => c.healthStatus === healthStatus);
    if (campaignId) list = list.filter(c => c.campaignId === campaignId);
    if (deptBelong) list = list.filter(c => c.deptBelong === deptBelong);

    // 默认排序：创建时间倒序
    list.sort((a, b) => {
      const ta = a.createTime || '';
      const tb = b.createTime || '';
      return tb.localeCompare(ta);
    });

    const total = list.length;
    const pageNum = params.pageNum || 1;
    const pageSize = params.pageSize || 10;
    const start = (pageNum - 1) * pageSize;
    const records = list.slice(start, start + pageSize);

    return { records, total };
  },

  get(id: number): ClueVO | null {
    return load<ClueVO>(CLUE_KEY).find(c => c.id === id) || null;
  },

  create(dto: ClueSaveDTO, ownerName?: string): ClueVO {
    const list = load<ClueVO>(CLUE_KEY);
    const vo: ClueVO = {
      id: nextId(),
      clueName: dto.clueName,
      clueNumber: genClueNumber(),
      clientCompany: dto.clientCompany,
      clientDept: dto.clientDept,
      clientContact: dto.clientContact,
      beikeOwner: ownerName || dto.beikeOwner || '未分配',
      budget: dto.budget,
      budgetAmount: dto.budgetAmount,
      clueLevel: dto.clueLevel || 'C',
      clueStatus: dto.clueStatus || '接触',
      requirementDesc: dto.requirementDesc,
      painPoint: dto.painPoint,
      expectedTarget: dto.expectedTarget,
      clueEvaluation: dto.clueEvaluation,
      remark: dto.remark,
      deptBelong: dto.deptBelong || '未分配',
      arUserId: dto.arUserId,
      srUserId: dto.srUserId,
      frUserId: dto.frUserId,
      campaignId: dto.campaignId,
      clientCircle: dto.clientCircle,
      healthStatus: dto.healthStatus || 'normal',
      opportunityAmount: dto.opportunityAmount,
      sourceType: dto.sourceType,
      sourceActivityName: dto.sourceActivityName,
      industry: dto.industry,
      valueQuadrant: dto.valueQuadrant,
      maintenanceFreq: dto.maintenanceFreq,
      nextMaintenanceDate: dto.nextMaintenanceDate,
      maintenanceMethods: dto.maintenanceMethods,
      matchedProducts: dto.matchedProducts,
      recommendedProducts: dto.recommendedProducts,
      createTime: now(),
      updateTime: now(),
      isConverted: false,
      convertStatus: undefined,
    };
    list.push(vo);
    save(CLUE_KEY, list);
    return vo;
  },

  update(id: number, dto: Partial<ClueSaveDTO>): ClueVO | null {
    const list = load<ClueVO>(CLUE_KEY);
    const idx = list.findIndex(c => c.id === id);
    if (idx === -1) return null;
    const existing = list[idx];
    // 合并字段
    const merged: ClueVO = { ...existing, ...dto, id: existing.id, clueNumber: existing.clueNumber, createTime: existing.createTime, updateTime: now() };
    list[idx] = merged;
    save(CLUE_KEY, list);
    return merged;
  },

  delete(id: number): boolean {
    const list = load<ClueVO>(CLUE_KEY);
    const idx = list.findIndex(c => c.id === id);
    if (idx === -1) return false;
    list.splice(idx, 1);
    save(CLUE_KEY, list);
    return true;
  },

  batchDelete(ids: number[]): number {
    const list = load<ClueVO>(CLUE_KEY);
    const idSet = new Set(ids);
    const remaining = list.filter(c => !idSet.has(c.id));
    const removed = list.length - remaining.length;
    save(CLUE_KEY, remaining);
    return removed;
  },

  stats(): { total: number; pending: number; accepted: number; converted: number } {
    const list = load<ClueVO>(CLUE_KEY);
    return {
      total: list.length,
      pending: list.filter(c => c.clueStatus === '接触' || c.clueStatus === 'contact').length,
      accepted: list.filter(c => c.clueStatus && !['接触', 'contact'].includes(c.clueStatus) && !c.isConverted).length,
      converted: list.filter(c => c.isConverted).length,
    };
  },
};

// ============================================================
// 商机 Mock 存储
// ============================================================

const PIPELINE_KEY = '_mock_pipelines';

let _nextPipelineId = 1000;
function nextPipelineId(): number { return _nextPipelineId++; }

export const mockPipelineStore = {
  list(): MockPipelineVO[] {
    return load<MockPipelineVO>(PIPELINE_KEY);
  },

  page(params: { pageNum: number; pageSize: number; keyword?: string; stage?: string; customer?: string }): { records: MockPipelineVO[]; total: number } {
    let list = load<MockPipelineVO>(PIPELINE_KEY);
    const { keyword, stage, customer } = params;
    if (keyword) {
      const kw = keyword.toLowerCase();
      list = list.filter(p => p.name?.toLowerCase().includes(kw) || p.customer?.toLowerCase().includes(kw));
    }
    if (stage) list = list.filter(p => p.stage === stage);
    if (customer) list = list.filter(p => p.customer?.includes(customer));
    list.sort((a, b) => (b.updateTime || '').localeCompare(a.updateTime || ''));
    const total = list.length;
    const pageNum = params.pageNum || 1;
    const pageSize = params.pageSize || 10;
    return { records: list.slice((pageNum - 1) * pageSize, pageNum * pageSize), total };
  },

  get(id: number): MockPipelineVO | null {
    return load<MockPipelineVO>(PIPELINE_KEY).find(p => p.id === id) || null;
  },

  create(dto: MockPipelineSaveDTO, ownerName?: string): MockPipelineVO {
    const list = load<MockPipelineVO>(PIPELINE_KEY);
    const vo: MockPipelineVO = {
      id: nextPipelineId(),
      name: dto.name,
      customer: dto.customer ?? dto.client ?? '',
      amount: dto.amount || 0,
      stage: dto.stage || 'initial_contact',
      winRate: dto.winRate || 0,
      ownerId: dto.ownerId || 0,
      ownerName: ownerName || dto.ownerName || dto.manager || '未分配',
      deptId: 0,
      deptName: dto.deptName || '',
      isSea: 0,
      description: dto.description || '',
      nextAction: dto.nextAction || '',
      createTime: now(),
      updateTime: now(),
    };
    list.push(vo);
    save(PIPELINE_KEY, list);
    return vo;
  },

  update(id: number, dto: MockPipelineSaveDTO): MockPipelineVO | null {
    const list = load<MockPipelineVO>(PIPELINE_KEY);
    const idx = list.findIndex(p => p.id === id);
    if (idx === -1) return null;
    const existing = list[idx];
    list[idx] = {
      ...existing,
      ...dto,
      customer: dto.customer ?? dto.client ?? existing.customer,
      id: existing.id,
      createTime: existing.createTime,
      updateTime: now(),
    };
    save(PIPELINE_KEY, list);
    return list[idx];
  },

  delete(id: number): boolean {
    const list = load<MockPipelineVO>(PIPELINE_KEY);
    const idx = list.findIndex(p => p.id === id);
    if (idx === -1) return false;
    list.splice(idx, 1);
    save(PIPELINE_KEY, list);
    return true;
  },

  batchDelete(ids: number[]): number {
    const list = load<MockPipelineVO>(PIPELINE_KEY);
    const idSet = new Set(ids);
    const remaining = list.filter(p => !idSet.has(p.id));
    save(PIPELINE_KEY, remaining);
    return list.length - remaining.length;
  },
};

// ============================================================
// 判断是否后端不可用（mock 模式）
// ============================================================

export function isMockMode(): boolean {
  const token = localStorage.getItem('beike_token') || sessionStorage.getItem('beike_token');
  return !!token && token.startsWith('mock_');
}
