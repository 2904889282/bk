import {
  PIPELINE_STAGE_COLORS,
  PIPELINE_STAGE_LABELS,
  PIPELINE_STAGE_ORDER,
  type PipelineStage,
} from '../utils/stageMapping';

export type { PipelineStage } from '../utils/stageMapping';

/** @deprecated 旧版商机类型，仅兼容看板/分析页。新页面请使用 api/pipeline.ts 中的 PipelineVO */
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

export type ProductLine = 'ai_content' | 'koc_matrix' | 'talent_invest' | 'event_marketing' | 'quality_dataset';

export type Industry = 'fin' | 'edu' | 'med' | 'ent' | 'gov' | 'tech';

// 常量映射（从 stageMapping 统一数据源）
export const STAGE_MAP: Record<PipelineStage, string> = {
  ...PIPELINE_STAGE_LABELS,
};
export const STAGE_ORDER: PipelineStage[] = [...PIPELINE_STAGE_ORDER];
export const STAGE_COLORS: Record<PipelineStage, string> = {
  ...PIPELINE_STAGE_COLORS,
};

export const PRODUCT_MAP: Record<ProductLine, string> = {
  ai_content: 'AI内容生产', koc_matrix: 'KOC达人矩阵', talent_invest: '达人引入与投放',
  event_marketing: '活动营销', quality_dataset: '高质量数据集'
};

export const INDUSTRY_MAP: Record<Industry, string> = {
  fin: '金融', edu: '教育', med: '医疗', ent: '数字文娱', gov: '政务', tech: '科技'
};
