// ============================
// 线索类型定义 + 字段常量
// ============================

export type LeadStatus = '待跟进' | '跟进中' | '已提案' | '已签约' | '已关闭' | '已承接' | '线索接触' | '沟通提案' | '执行测试' | '已丢失' | '已延期' | '';

export interface Lead {
  id: string;
  name: string;
  company: string;
  department: string;
  contact: string;
  owner: string;
  budget: string;
  requirements: string;
  status: LeadStatus;
  contactDate: string;
  proposalDate: string;
  evaluation: string;
  projectLevel: string;
  notes: string;
  dept: string;
  reviewStatus: string;
  confirmedBiz: string;
  commRecord1: string;
  commRecord2: string;
  commRecord3: string;
  commRecord4: string;
  createdAt: string;
  relation1: string;
  relation2: string;
  relation3: string;
  isDeleted?: boolean;
  deleteTime?: string;
  deleteBy?: string;
}

// ============================
// 附属数据类型：跟进记录、铁三角、附件、操作日志
// ============================
export interface FollowUpRecord {
  id: string; leadId: string;
  type: string;            // 初次沟通 / 二次沟通 / 三次沟通 / 日常跟进 / 状态变更
  date: string;
  operator: string;
  summary: string;
  detail: string;
  nextPlan: string;
}
export interface TriangleMember {
  leadId: string; role: 'AR' | 'SR' | 'FR'; name: string;
  responsibility: string; todo: string; deadline: string;
}
export interface AttachmentItem {
  id: string; leadId: string; name: string;
  category: string; uploader: string; uploadTime: string; size: string; url: string;
}
export interface OperationLogItem {
  id: string; leadId: string; time: string; operator: string; actionType: string; detail: string;
}

// localStorage keys
export const LS_FOLLOWUPS = 'beike_lead_followups';
export const LS_TRIANGLE = 'beike_lead_triangle';
export const LS_ATTACHMENTS = 'beike_lead_attachments';
export const LS_LOGS = 'beike_lead_logs';

// ============================
// 通用 localStorage 读写辅助
// ============================
export function loadLS<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}
export function saveLS<T>(key: string, data: T) { localStorage.setItem(key, JSON.stringify(data)); }

export const LEAD_FIELDS: { key: keyof Lead; label: string; type: 'text' | 'select' | 'date' | 'longtext'; options?: string[] }[] = [
  { key: 'name', label: '线索名称', type: 'text' },
  { key: 'company', label: '甲方公司', type: 'text' },
  { key: 'department', label: '甲方部门', type: 'text' },
  { key: 'contact', label: '甲方对接人', type: 'text' },
  { key: 'owner', label: '承接人', type: 'text' },
  { key: 'budget', label: '预算量级', type: 'select', options: ['＜10万', '10-50万', '50-100万', '100-500万', '＞500万'] },
  { key: 'requirements', label: '线索需求详细说明', type: 'longtext' },
  { key: 'status', label: '线索状态', type: 'select', options: ['待跟进', '跟进中', '已提案', '已签约', '已关闭'] },
  { key: 'contactDate', label: '接触日期', type: 'date' },
  { key: 'proposalDate', label: '提案日期', type: 'date' },
  { key: 'evaluation', label: '线索评价', type: 'select', options: ['高价值', '中等价值', '低价值'] },
  { key: 'projectLevel', label: '预计项目等级', type: 'select', options: ['S', 'A', 'B', 'C'] },
  { key: 'notes', label: '备注说明，所需配合', type: 'longtext' },
  { key: 'dept', label: '承接部门', type: 'text' },
  { key: 'reviewStatus', label: '评审状态', type: 'select', options: ['待评审', '评审中', '已通过', '未通过'] },
  { key: 'confirmedBiz', label: '确认商机', type: 'select', options: ['是', '否'] },
  { key: 'commRecord1', label: '初次沟通记录', type: 'longtext' },
  { key: 'commRecord2', label: '二次沟通记录', type: 'longtext' },
  { key: 'commRecord3', label: '三次沟通记录', type: 'longtext' },
  { key: 'commRecord4', label: '四次沟通记录', type: 'longtext' },
  { key: 'createdAt', label: '线索创建日期', type: 'date' },
  { key: 'relation1', label: '关联', type: 'text' },
  { key: 'relation2', label: '关联 1', type: 'text' },
  { key: 'relation3', label: '关联 2', type: 'text' },
];

export const LEAD_STATUS_COLORS: Record<string, string> = { '待跟进': 'blue', '跟进中': 'orange', '已提案': 'purple', '已签约': 'green', '已关闭': 'default' };

// ============================
// Zustand Store — 线索数据 + CRUD
// ============================
import { create } from 'zustand';
import { LEAD_SEED_DATA } from './leadData';

const STORAGE_KEY = 'beike_leads';

function defaultLeads(): Lead[] {
  return LEAD_SEED_DATA;
}

interface LeadStore {
  leads: Lead[];
  load: () => void;
  loadAll: () => Lead[];  // 含已删除
  loadTrash: () => Lead[];
  save: () => void;
  add: (l: Omit<Lead, 'id'>) => void;
  update: (id: string, l: Partial<Lead>) => void;
  remove: (id: string) => void;
  batchDelete: (ids: string[], deleteBy: string) => void;
  batchModify: (ids: string[], field: keyof Lead, value: string) => void;
  restore: (ids: string[]) => string;       // 返回冲突信息，空串=成功
  permDelete: (ids: string[]) => void;
  genId: () => string;
  getStats: () => { total: number; pending: number; inProgress: number; closed: number; recentUpdates: { id: string; name: string; date: string; status: LeadStatus }[] };
}

export const useLeadStore = create<LeadStore>((set, get) => ({
  leads: [],
  load: () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    // 只加载非删除数据
    set({ leads: (raw ? JSON.parse(raw) : defaultLeads()).filter((l: Lead) => !l.isDeleted) });
  },
  loadAll: () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : defaultLeads();
  },
  save: () => localStorage.setItem(STORAGE_KEY, JSON.stringify(get().leads)),
  add: (l) => {
    const id = get().genId();
    set(s => ({ leads: [...s.leads, { ...l, id }] }));
    get().save();
  },
  update: (id, l) => {
    set(s => ({ leads: s.leads.map(x => x.id === id ? { ...x, ...l } : x) }));
    get().save();
  },
  remove: (id) => {
    set(s => ({ leads: s.leads.filter(x => x.id !== id) }));
    get().save();
  },
  loadTrash: () => get().leads.filter(l => l.isDeleted),
  batchDelete: (ids, deleteBy) => {
    const now = new Date().toISOString().slice(0, 19);
    set(s => ({ leads: s.leads.map(l => ids.includes(l.id) ? { ...l, isDeleted: true, deleteTime: now, deleteBy } : l) }));
    get().save();
  },
  batchModify: (ids, field, value) => {
    set(s => ({ leads: s.leads.map(l => ids.includes(l.id) ? { ...l, [field]: value } : l) }));
    get().save();
  },
  restore: (ids) => {
    const conflicts: string[] = [];
    const activeLeads = get().leads.filter(l => !l.isDeleted);
    set(s => ({
      leads: s.leads.map(l => {
        if (!ids.includes(l.id)) return l;
        const key = (l.name + '|' + l.company).toLowerCase();
        if (activeLeads.some(a => (a.name + '|' + a.company).toLowerCase() === key)) {
          conflicts.push(l.name);
          return l; // 保持删除状态
        }
        return { ...l, isDeleted: false, deleteTime: undefined, deleteBy: undefined };
      })
    }));
    get().save();
    return conflicts.join('、');
  },
  permDelete: (ids) => {
    set(s => ({ leads: s.leads.filter(l => !ids.includes(l.id)) }));
    get().save();
  },
  genId: () => {
    const max = get().leads.reduce((m, l) => Math.max(m, parseInt(l.id.replace('L','')) || 0), 0);
    return 'L' + String(max + 1).padStart(3, '0');
  },
  getStats: () => {
    const leads = get().leads;
    return {
      total: leads.length,
      pending: leads.filter(l => l.status === '待跟进').length,
      inProgress: leads.filter(l => l.status === '跟进中').length,
      closed: leads.filter(l => l.status === '已关闭' || l.status === '已签约').length,
      recentUpdates: leads
        .filter(l => l.status && l.createdAt)
        .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
        .slice(0, 3)
        .map(l => ({ id: l.id, name: l.name, date: l.createdAt || '', status: l.status })),
    };
  },
}));

