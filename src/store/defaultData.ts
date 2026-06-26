import type { Pipeline, Project, Risk, Talent, Alert, AppSettings } from '../types';

export function getDefaultData(): { pipelines: Pipeline[]; projects: Project[]; risks: Risk[]; talent: Talent[]; alerts: Alert[]; settings: AppSettings } {
  return {
    pipelines: [
      { id:'P001', name:'某银行数字营销项目', stage:'lead', client:'XX银行', product:'ai_content', industry:'fin', amount:80, winRate:20, priority:'normal', manager:'张明', source:'主动拓展', nextAction:'等待客户反馈方案', description:'银行数字化转型直播营销方案', createdAt:'2026-06-01', updatedAt:'2026-06-15' },
      { id:'P002', name:'连锁餐饮品牌全案推广', stage:'lead', client:'XX餐饮集团', product:'event_marketing', industry:'ent', amount:120, winRate:30, priority:'high', manager:'李芳', source:'老客户续签', nextAction:'6/25提交方案初稿', description:'餐饮连锁品牌全案推广项目', createdAt:'2026-06-03', updatedAt:'2026-06-18' },
      { id:'P003', name:'教育机构短视频代运营', stage:'lead', client:'XX教育', product:'ai_content', industry:'edu', amount:45, winRate:15, priority:'low', manager:'王强', source:'主动拓展', nextAction:'等待线索验证', description:'教育机构抖音短视频代运营', createdAt:'2026-06-05', updatedAt:'2026-06-10' },
      { id:'P004', name:'地产项目直播营销', stage:'lead', client:'XX地产', product:'event_marketing', industry:'gov', amount:200, winRate:25, priority:'high', manager:'赵敏', source:'招投标', nextAction:'7/1前提交投标方案', description:'地产开盘直播营销方案', createdAt:'2026-06-08', updatedAt:'2026-06-20' },
      { id:'P005', name:'科技公司年会直播', stage:'verify', client:'XX科技', product:'event_marketing', industry:'tech', amount:35, winRate:50, priority:'normal', manager:'张明', source:'主动拓展', nextAction:'6/28方案汇报', description:'科技公司年会直播执行方案', createdAt:'2026-05-20', updatedAt:'2026-06-15' },
      { id:'P006', name:'美妆品牌KOL矩阵推广', stage:'opportunity', client:'XX美妆', product:'koc_matrix', industry:'ent', amount:150, winRate:60, priority:'high', manager:'李芳', source:'老客户续签', nextAction:'7/5前签约', description:'美妆品牌KOL矩阵推广年度合作', createdAt:'2026-05-10', updatedAt:'2026-06-22' },
      { id:'P007', name:'汽车品牌新品发布', stage:'opportunity', client:'XX汽车', product:'event_marketing', industry:'tech', amount:300, winRate:55, priority:'urgent', manager:'王强', source:'招投标', nextAction:'6/30商务谈判', description:'汽车新品发布会全流程策划', createdAt:'2026-05-15', updatedAt:'2026-06-20' },
      { id:'P008', name:'快消品电商直播专场', stage:'opportunity', client:'XX快消', product:'ai_content', industry:'ent', amount:60, winRate:70, priority:'normal', manager:'赵敏', source:'主动拓展', nextAction:'方案报价调整', description:'快消品618直播专场策划', createdAt:'2026-05-25', updatedAt:'2026-06-16' },
      { id:'P009', name:'文旅IP短视频孵化', stage:'opportunity', client:'XX文旅', product:'koc_matrix', industry:'edu', amount:90, winRate:45, priority:'normal', manager:'刘洋', source:'主动拓展', nextAction:'提交执行方案', description:'文旅景区IP短视频孵化项目', createdAt:'2026-06-01', updatedAt:'2026-06-18' },
      { id:'P010', name:'某家电品牌双11直播', stage:'contract', client:'XX家电', product:'event_marketing', industry:'tech', amount:180, winRate:100, priority:'high', manager:'张明', source:'老客户续签', nextAction:'8月启动筹备', description:'家电品牌双11直播全案', createdAt:'2026-04-10', updatedAt:'2026-06-18' },
      { id:'P011', name:'连锁酒店品牌升级', stage:'delivery', client:'XX酒店', product:'ai_content', industry:'ent', amount:220, winRate:100, priority:'high', manager:'李芳', source:'老客户续签', nextAction:'7月交付第三期', description:'连锁酒店品牌内容升级', createdAt:'2026-03-15', updatedAt:'2026-06-20' },
      { id:'P012', name:'电商平台年框合作', stage:'delivery', client:'XX电商', product:'ai_content', industry:'tech', amount:500, winRate:100, priority:'urgent', manager:'王强', source:'老客户续签', nextAction:'Q3执行计划确认', description:'电商平台年度内容合作框架', createdAt:'2026-01-10', updatedAt:'2026-06-18' },
    ],
    projects: [
      { id:'PR001', name:'某家电品牌双11直播', stage:'execution', manager:'张明', client:'XX家电', amount:180, progress:65, startDate:'2026-05-01', expectedEnd:'2026-10-31', status:'active', description:'双11直播全案执行' },
      { id:'PR002', name:'连锁酒店品牌升级', stage:'execution', manager:'李芳', client:'XX酒店', amount:220, progress:40, startDate:'2026-03-15', expectedEnd:'2026-08-30', status:'active', description:'酒店品牌内容升级项目' },
      { id:'PR003', name:'电商平台年框合作', stage:'execution', manager:'王强', client:'XX电商', amount:500, progress:85, startDate:'2026-01-10', expectedEnd:'2026-07-15', status:'active', description:'电商平台年度合作' },
      { id:'PR004', name:'文旅IP短视频孵化', stage:'execution', manager:'刘洋', client:'XX文旅', amount:90, progress:30, startDate:'2026-06-10', expectedEnd:'2026-09-30', status:'active', description:'文旅景区IP孵化项目' },
      { id:'PR005', name:'汽车品牌新品发布', stage:'initiation', manager:'王强', client:'XX汽车', amount:300, progress:10, startDate:'2026-06-20', expectedEnd:'2026-09-15', status:'active', description:'新车发布会策划执行' },
      { id:'PR006', name:'美妆品牌KOL矩阵推广', stage:'initiation', manager:'李芳', client:'XX美妆', amount:150, progress:5, startDate:'2026-06-22', expectedEnd:'2026-10-01', status:'active', description:'美妆KOL矩阵运营方案' },
      { id:'PR007', name:'某快消品618直播专场', stage:'closing', manager:'赵敏', client:'XX快消', amount:60, progress:100, startDate:'2026-05-01', expectedEnd:'2026-06-18', status:'completed', description:'618直播专场已结项' },
      { id:'PR008', name:'科技公司年会直播', stage:'closing', manager:'张明', client:'XX科技', amount:35, progress:100, startDate:'2026-04-15', expectedEnd:'2026-05-30', status:'completed', description:'年会直播已结项' },
    ],
    risks: [
      { id:'R001', projectId:'PR002', type:'人员不足', level:'high', description:'后期制作人员紧张，可能影响交付', solution:'外部采购+内部调配', owner:'李芳', status:'open', createdAt:'2026-06-15' },
      { id:'R002', projectId:'PR001', type:'客户变更频繁', level:'medium', description:'客户方案已变更3次，影响排期', solution:'变更冻结+变更审批流程', owner:'张明', status:'open', createdAt:'2026-06-18' },
      { id:'R003', projectId:'PR004', type:'预算超支风险', level:'medium', description:'KOL合作费用超预算10%', solution:'调整KOL组合方案', owner:'刘洋', status:'open', createdAt:'2026-06-20' },
    ],
    talent: [
      { id:'T001', name:'张明', role:'项目经理', skills:'直播运营,项目管理', currentProject:'家电双11 / 科技年会', utilization:90, status:'high' },
      { id:'T002', name:'李芳', role:'项目总监', skills:'品牌策划,KOL管理', currentProject:'酒店品牌升级 / 美妆KOL', utilization:85, status:'high' },
      { id:'T003', name:'王强', role:'项目经理', skills:'电商运营,数据分析', currentProject:'电商年框 / 汽车发布', utilization:75, status:'normal' },
      { id:'T004', name:'赵敏', role:'策划经理', skills:'内容策划,文案', currentProject:'暂无（618已结项）', utilization:20, status:'idle' },
      { id:'T005', name:'刘洋', role:'执行经理', skills:'短视频制作,导演', currentProject:'文旅IP孵化', utilization:60, status:'normal' },
      { id:'T006', name:'陈晨', role:'后期制作', skills:'剪辑,特效', currentProject:'酒店品牌升级', utilization:95, status:'overload' },
    ],
    alerts: [
      { id:'A001', pipelineId:'P006', type:'超期', level:'high', description:'MO阶段停留超过30天，需推进签约', manager:'李芳', status:'open', createdAt:'2026-06-20' },
      { id:'A002', pipelineId:'P003', type:'停滞', level:'medium', description:'线索14天无进展，需跟进', manager:'王强', status:'open', createdAt:'2026-06-22' },
      { id:'A003', pipelineId:'P011', type:'回款', level:'medium', description:'第二期回款即将到期', manager:'李芳', status:'open', createdAt:'2026-06-24' },
    ],
    settings: { lastLtcTab: 'kanban', lastPmTab: 'pmKanban' },
  };
}
