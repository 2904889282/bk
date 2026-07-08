import type { ClueSaveDTO, ClueVO } from '../../api/clue';

export const CLUE_STATUS_OPTIONS = ['接触', '沟通', '提案', '承接', '延期', '丢失'];
export const CLUE_LEVEL_OPTIONS = ['S', 'A', 'B', 'C'];
export const HEALTH_OPTIONS = ['normal', 'yellow', 'red'];
export const CLIENT_CIRCLE_OPTIONS = ['第一圈层', '第二圈层', '第三圈层', '第四圈层'];
export const DEPT_OPTIONS = ['平台一部', '平台二部', '平台三部'];
export const SOURCE_TYPE_OPTIONS = ['产品发布会', '技术交流会', '客户走访', '市场活动', '伙伴推荐', '客户转介绍', '其他'];
export const INDUSTRY_OPTIONS = ['互联网', '金融', '制造', '政务', '教育', '医疗', '零售', '能源', '其他'];
export const VALUE_QUADRANT_OPTIONS = ['高价值高意愿', '高价值低意愿', '低价值高意愿', '低价值低意愿'];
export const MAINTENANCE_METHOD_OPTIONS = ['电话沟通', '微信沟通', '现场拜访', '线上会议', '活动邀约', '方案共创'];
export const PRODUCT_OPTIONS = ['基础版', '专业版', '旗舰版', '行业方案', '定制方案'];
export const BUDGET_OPTIONS = ['＜10万', '10-50万', '50-100万', '100-500万', '＞500万'];

export const CLIENT_CIRCLE_LABELS: Record<string, string> = {
  第一圈层: '传统大厂',
  第二圈层: 'AI大厂',
  第三圈层: '腰部中厂',
  第四圈层: '大G',
};

export const CLUE_STATUS_COLORS: Record<string, string> = {
  接触: 'blue',
  沟通: 'orange',
  提案: 'purple',
  承接: 'green',
  延期: 'warning',
  丢失: 'default',
};

export const LEVEL_COLORS: Record<string, string> = {
  S: '#ff4d4f',
  A: '#fa8c16',
  B: '#1677ff',
  C: '#8c8c8c',
};

export const HEALTH_LABELS: Record<string, string> = {
  normal: '正常',
  yellow: '黄灯',
  red: '红灯',
};

export const HEALTH_COLORS: Record<string, string> = {
  normal: 'green',
  yellow: 'gold',
  red: 'red',
};

export const CLIENT_CIRCLE_COLORS: Record<string, string> = {
  第一圈层: '#ff4d4f',
  第二圈层: '#fa8c16',
  第三圈层: '#1677ff',
  第四圈层: '#8c8c8c',
};

export const CLUE_FORM_DEFAULTS: Partial<ClueSaveDTO> = {
  clueStatus: '接触',
  clueLevel: 'B',
  deptBelong: '平台一部',
  healthStatus: 'normal',
  clientCircle: '第三圈层',
  sourceType: '客户走访',
  maintenanceFreq: 14,
};

export function toSelectOptions(values: string[], labels?: Record<string, string>) {
  return values.map(value => ({ value, label: labels?.[value] ? `${value}（${labels[value]}）` : value }));
}

export function compactSelectValue(value?: string[] | string) {
  if (Array.isArray(value)) return value.join('、');
  return value;
}

export function splitSelectValue(value?: string) {
  return value ? value.split(/[、,，]/).map(item => item.trim()).filter(Boolean) : [];
}

export function mapClueToForm(clue: ClueVO): Record<string, unknown> {
  return {
    ...clue,
    matchedProducts: splitSelectValue(clue.matchedProducts),
    recommendedProducts: splitSelectValue(clue.recommendedProducts),
    maintenanceMethods: splitSelectValue(clue.maintenanceMethods),
  };
}

export function normalizeClueFormValues(values: Record<string, any>): ClueSaveDTO {
  return {
    ...values,
    matchedProducts: compactSelectValue(values.matchedProducts),
    recommendedProducts: compactSelectValue(values.recommendedProducts),
    maintenanceMethods: compactSelectValue(values.maintenanceMethods),
    contactDate: values.contactDate,
    proposalDate: values.proposalDate,
    nextMaintenanceDate: values.nextMaintenanceDate,
    createDate: values.createDate,
  } as ClueSaveDTO;
}
