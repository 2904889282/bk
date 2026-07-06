import request from '../utils/request';

// ============ TypeScript 类型定义 ============

export interface DashboardKPI {
  clueTotal: number;
  clueToday: number;
  projectActive: number;
  projectToday: number;
  alertPending: number;
  talentTotal: number;
  convertedThisMonth: number;
  amountThisMonth: number;
}

export interface TrendItem {
  date: string;
  clueCount: number;
  projectCount: number;
  convertCount: number;
}

export interface PipelineStage {
  stage: string;
  count: number;
  amount: number;
}

export interface AlertStat {
  level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  count: number;
}

export interface RecentActivity {
  id: number;
  type: 'clue' | 'project' | 'alert' | 'talent';
  title: string;
  description: string;
  createTime: string;
  username: string;
}

export interface DashboardData {
  kpi: DashboardKPI;
  trend: TrendItem[];
  pipeline: PipelineStage[];
  alertStats: AlertStat[];
  recentActivities: RecentActivity[];
}

// ============ API 请求 ============

/** 聚合请求：并行拉取多个接口，拼装仪表盘数据 */
export const getDashboardDataAggregated = async (): Promise<DashboardData> => {
  const results = await Promise.allSettled([
    request.get('/api/clue/stats'),
    request.get('/api/project/page', { params: { pageNum: 1, pageSize: 1 } }),
    request.get('/api/alert/page', { params: { pageNum: 1, pageSize: 5 } }),
    request.get('/api/talent/page', { params: { pageNum: 1, pageSize: 1 } }),
    request.get('/api/log/page', { params: { pageNum: 1, pageSize: 10 } }),
  ]);

  const clueData   = results[0].status === 'fulfilled' ? results[0].value.data ?? {} : {};
  const projectData = results[1].status === 'fulfilled' ? results[1].value.data ?? {} : {};
  const alertData   = results[2].status === 'fulfilled' ? results[2].value.data ?? {} : {};
  const talentData  = results[3].status === 'fulfilled' ? results[3].value.data ?? {} : {};
  const logData     = results[4].status === 'fulfilled' ? results[4].value.data ?? {} : {};

  return {
    kpi: {
      clueTotal:         clueData.total ?? 0,
      clueToday:         clueData.todayCount ?? 0,
      projectActive:     projectData.total ?? 0,
      projectToday:      0,
      alertPending:      alertData.total ?? 0,
      talentTotal:       talentData.total ?? 0,
      convertedThisMonth: clueData.convertedThisMonth ?? 0,
      amountThisMonth:   clueData.amountThisMonth ?? 0,
    },
    trend:          clueData.trend ?? generateMockTrend(),
    pipeline:       clueData.pipeline ?? generateMockPipeline(),
    alertStats:     clueData.alertStats ?? generateMockAlertStats(),
    recentActivities: (logData.records ?? []).map((log: Record<string, unknown>) => ({
      id:           Number(log.id) || 0,
      type:         guessActivityType(String(log.content ?? log.action ?? '')),
      title:        String(log.content ?? log.action ?? '系统操作'),
      description:  String(log.detail ?? ''),
      createTime:   String(log.createTime ?? ''),
      username:     String(log.username ?? log.userName ?? log.createBy ?? '系统'),
    })),
  };
}

// ============ Mock 后备数据 ============

function generateMockTrend(): TrendItem[] {
  const items: TrendItem[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    items.push({
      date: d.toISOString().slice(0, 10),
      clueCount: Math.floor(Math.random() * 20 + 5),
      projectCount: Math.floor(Math.random() * 5 + 1),
      convertCount: Math.floor(Math.random() * 3),
    });
  }
  return items;
}

function generateMockPipeline(): PipelineStage[] {
  return [
    { stage: '初步接触', count: 45, amount: 1250000 },
    { stage: '需求确认', count: 32, amount: 980000 },
    { stage: '方案报价', count: 18, amount: 720000 },
    { stage: '商务谈判', count: 12, amount: 560000 },
    { stage: '赢单', count: 8, amount: 450000 },
  ];
}

function generateMockAlertStats(): AlertStat[] {
  return [
    { level: 'CRITICAL', count: 2 },
    { level: 'HIGH', count: 5 },
    { level: 'MEDIUM', count: 12 },
    { level: 'LOW', count: 8 },
  ];
}

function guessActivityType(content: string): RecentActivity['type'] {
  if (!content) return 'clue';
  if (content.includes('项目')) return 'project';
  if (content.includes('预警') || content.includes('告警')) return 'alert';
  if (content.includes('人才')) return 'talent';
  return 'clue';
}
