export interface Pipeline {
  id: string;
  name: string;
  stage: PipelineStage;
  client: string;
  product: ProductLine;
  industry: Industry;
  amount: number;
  winRate: number;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  manager: string;
  source: string;
  description: string;
  nextAction: string;
  createdAt: string;
  updatedAt: string;
}

export type PipelineStage = 'lead' | 'verify' | 'opportunity' | 'contract' | 'delivery' | 'cash' | 'closed';

export type ProductLine = 'ai_content' | 'koc_matrix' | 'talent_invest' | 'event_marketing' | 'quality_dataset';

export type Industry = 'fin' | 'edu' | 'med' | 'ent' | 'gov' | 'tech';

export interface Project {
  id: string;
  name: string;
  stage: ProjectStage;
  manager: string;
  client: string;
  amount: number;
  progress: number;
  startDate: string;
  expectedEnd: string;
  status: 'active' | 'paused' | 'completed';
  description: string;
}

export type ProjectStage = 'initiation' | 'planning' | 'execution' | 'monitoring' | 'closing';

export interface Risk {
  id: string;
  projectId: string;
  type: string;
  level: 'high' | 'medium' | 'low';
  description: string;
  solution: string;
  owner: string;
  status: 'open' | 'resolved';
  createdAt: string;
}

export interface Talent {
  id: string;
  name: string;
  role: string;
  skills: string;
  currentProject: string;
  utilization: number;
  status: 'normal' | 'high' | 'overload' | 'idle';
}

export interface Alert {
  id: string;
  pipelineId: string;
  type: string;
  level: 'high' | 'medium';
  description: string;
  manager: string;
  status: 'open' | 'resolved';
  createdAt: string;
}

export interface User {
  name: string;
  role: 'admin' | 'manager';
  avatar: string;
  password: string;
}

export interface AppSettings {
  lastLtcTab: string;
  lastPmTab: string;
}

export interface AppData {
  pipelines: Pipeline[];
  projects: Project[];
  risks: Risk[];
  talent: Talent[];
  alerts: Alert[];
  settings: AppSettings;
}

// 常量映射
export const STAGE_MAP: Record<PipelineStage, string> = {
  lead: '线索', verify: '验证', opportunity: '机会点', contract: '合同',
  delivery: '交付', cash: '回款', closed: '已关闭'
};
export const STAGE_ORDER: PipelineStage[] = ['lead', 'verify', 'opportunity', 'contract', 'delivery', 'cash', 'closed'];
export const STAGE_COLORS: Record<PipelineStage, string> = {
  lead: 'purple', verify: 'blue', opportunity: 'orange', contract: 'green',
  delivery: 'cyan', cash: 'red', closed: 'default'
};

export const PRODUCT_MAP: Record<ProductLine, string> = {
  ai_content: 'AI内容生产', koc_matrix: 'KOC达人矩阵', talent_invest: '达人引入与投放',
  event_marketing: '活动营销', quality_dataset: '高质量数据集'
};

export const INDUSTRY_MAP: Record<Industry, string> = {
  fin: '金融', edu: '教育', med: '医疗', ent: '数字文娱', gov: '政务', tech: '科技'
};

export const PM_STAGE_MAP: Record<ProjectStage, string> = {
  initiation: '立项阶段', planning: '计划阶段', execution: '执行阶段',
  monitoring: '监控阶段', closing: '收尾阶段'
};
