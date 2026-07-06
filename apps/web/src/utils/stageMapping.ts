import { fetchPipelineStages, type StageDictItem } from '../api/pipeline';

export type PipelineStage =
  | 'lead'
  | 'verify'
  | 'opportunity'
  | 'contract'
  | 'delivery'
  | 'cash'
  | 'closed_lost';

/** 本地默认阶段中文名（后端接口不可用时兜底） */
const DEFAULT_LABELS: Record<PipelineStage, string> = {
  lead: '线索',
  verify: '验证',
  opportunity: '机会点',
  contract: '合同',
  delivery: '交付',
  cash: '回款',
  closed_lost: '输单',
};

/** 运行时阶段标签，初始化后从后端接口同步 */
let runtimeLabels: Record<string, string> = {};

export const PIPELINE_STAGE_LABELS: Record<PipelineStage, string> = new Proxy(
  {} as Record<PipelineStage, string>,
  {
    get(_target, prop: string) {
      return runtimeLabels[prop] || DEFAULT_LABELS[prop as PipelineStage] || prop;
    },
  },
) as Record<PipelineStage, string>;

export const PIPELINE_STAGE_COLORS: Record<PipelineStage, string> = {
  lead: 'purple',
  verify: 'blue',
  opportunity: 'orange',
  contract: 'green',
  delivery: 'cyan',
  cash: 'red',
  closed_lost: 'default',
};

export const PIPELINE_STAGE_ORDER: PipelineStage[] = [
  'lead',
  'verify',
  'opportunity',
  'contract',
  'delivery',
  'cash',
  'closed_lost',
];

export const PIPELINE_ACTIVE_STAGE_ORDER: PipelineStage[] = PIPELINE_STAGE_ORDER.filter(
  stage => stage !== 'closed_lost',
);

export const PIPELINE_STAGE_OPTIONS = PIPELINE_STAGE_ORDER.map(stage => ({
  value: stage,
  label: PIPELINE_STAGE_LABELS[stage],
  color: PIPELINE_STAGE_COLORS[stage],
}));

export const PIPELINE_ACTIVE_STAGE_OPTIONS = PIPELINE_STAGE_OPTIONS.filter(
  option => option.value !== 'closed_lost',
);

const LEGACY_STAGE_MAP: Record<string, PipelineStage> = {
  initial: 'lead',
  requirement: 'verify',
  proposal: 'opportunity',
  negotiation: 'contract',
  won: 'cash',
  lost: 'closed_lost',
  closed: 'closed_lost',
};

export function normalizePipelineStage(stage?: string | null): PipelineStage {
  if (!stage) return 'lead';
  const normalized = stage.trim().toLowerCase();
  if (normalized in DEFAULT_LABELS) return normalized as PipelineStage;
  return LEGACY_STAGE_MAP[normalized] ?? 'lead';
}

export function getPipelineStageLabel(stage?: string | null): string {
  return PIPELINE_STAGE_LABELS[normalizePipelineStage(stage)];
}

export function getPipelineStageColor(stage?: string | null): string {
  return PIPELINE_STAGE_COLORS[normalizePipelineStage(stage)];
}

export function getPipelineStageProgress(stage?: string | null): number {
  switch (normalizePipelineStage(stage)) {
    case 'lead':
      return 20;
    case 'verify':
      return 40;
    case 'opportunity':
      return 60;
    case 'contract':
      return 80;
    case 'delivery':
      return 90;
    case 'cash':
      return 100;
    case 'closed_lost':
      return 0;
  }
}

// ==================== 从后端接口同步阶段字典 ====================

let initialized = false;
let initPromise: Promise<void> | null = null;

/** 从 /api/pipeline/stages 拉取阶段字典，与本地默认值合并。重复调用不会多次请求。 */
export async function initStageMapping(): Promise<void> {
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const stages: StageDictItem[] = await fetchPipelineStages();
    if (stages.length > 0) {
      const merged: Record<string, string> = {};
      for (const s of stages) {
        merged[s.code] = s.label || DEFAULT_LABELS[s.code as PipelineStage] || s.code;
      }
      // 保留本地有但后端未返回的阶段
      for (const [k, v] of Object.entries(DEFAULT_LABELS)) {
        if (!merged[k]) merged[k] = v;
      }
      runtimeLabels = merged;
    }
    initialized = true;
  })();

  return initPromise;
}
