/** 线索板块主题 — 统一亮色/暗色色彩 */
export const BRAND_LIGHT = { 50: '#EEEDFE', 100: '#CECBF6', 500: '#7F77DD', 600: '#534AB7', 700: '#3C3489' };
export const BRAND_DARK  = { 50: '#1E1B4B', 100: '#312E81', 500: '#8B83E5', 600: '#A5A0F0', 700: '#C7C4F5' };

export const STATUS_LIGHT = {
  bg: { '接触': '#EFF6FF', '沟通': '#F5F3FF', '提案': '#FFF7ED', '承接': '#ECFDF5', '延期': '#F9FAFB', '丢失': '#FEF2F2' } as Record<string,string>,
  color: { '接触': '#3B82F6', '沟通': '#8B5CF6', '提案': '#F59E0B', '承接': '#10B981', '延期': '#9CA3AF', '丢失': '#EF4444' } as Record<string,string>,
  border: { '接触': '#BFDBFE', '沟通': '#DDD6FE', '提案': '#FED7AA', '承接': '#A7F3D0', '延期': '#E5E7EB', '丢失': '#FECACA' } as Record<string,string>,
  DEFAULT_BG: '#F9FAFB', DEFAULT_COLOR: '#9CA3AF', DEFAULT_BORDER: '#E5E7EB',
};
export const STATUS_DARK = {
  bg: { '接触': '#1E3A5F', '沟通': '#2D1B69', '提案': '#4A3000', '承接': '#064E3B', '延期': '#1F2937', '丢失': '#450A0A' } as Record<string,string>,
  color: { '接触': '#60A5FA', '沟通': '#A78BFA', '提案': '#FBBF24', '承接': '#34D399', '延期': '#9CA3AF', '丢失': '#F87171' } as Record<string,string>,
  border: { '接触': '#1E40AF', '沟通': '#4C1D95', '提案': '#78350F', '承接': '#065F46', '延期': '#374151', '丢失': '#991B1B' } as Record<string,string>,
  DEFAULT_BG: '#1F2937', DEFAULT_COLOR: '#9CA3AF', DEFAULT_BORDER: '#374151',
};

export const GRADE_LIGHT = { A: { bg: '#DC2626', color: '#fff' }, B: { bg: '#D97706', color: '#fff' }, C: { bg: '#6B7280', color: '#fff' } };
export const GRADE_DARK  = { A: { bg: '#B91C1C', color: '#fff' }, B: { bg: '#B45309', color: '#fff' }, C: { bg: '#4B5563', color: '#fff' } };

export const KPI_LIGHT = {
  total:   { bg: '#EFF6FF', iconBg: '#DBEAFE', color: '#3B82F6' },
  active:  { bg: '#ECFDF5', iconBg: '#D1FAE5', color: '#10B981' },
  budget:  { bg: '#FFF7ED', iconBg: '#FFEDD5', color: '#F59E0B' },
  lost:    { bg: '#FEF2F2', iconBg: '#FEE2E2', color: '#EF4444' },
};
export const KPI_DARK = {
  total:   { bg: '#0F172A', iconBg: '#1E3A5F', color: '#60A5FA' },
  active:  { bg: '#022C22', iconBg: '#064E3B', color: '#34D399' },
  budget:  { bg: '#3C1F00', iconBg: '#78350F', color: '#FBBF24' },
  lost:    { bg: '#1C0000', iconBg: '#450A0A', color: '#F87171' },
};

export const COMMON_LIGHT = {
  pageBg: '#F5F5F5',
  cardBg: '#fff',
  cardBorder: '#E5E7EB',
  cardShadow: 'rgba(0,0,0,0.06)',
  textPrimary: '#111827',
  textSecondary: '#374151',
  textTertiary: '#6B7280',
  textMuted: '#9CA3AF',
  tagBg: '#F3F4F6',
  divider: '#F3F4F6',
  inputBg: '#F9FAFB',
  inputBorder: '#D1D5DB',
  hoverBg: '#F9FAFB',
};
export const COMMON_DARK = {
  pageBg: '#0f1011',
  cardBg: '#1a1a1a',
  cardBorder: '#2a2a2a',
  cardShadow: 'rgba(0,0,0,0.3)',
  textPrimary: '#f7f8f8',
  textSecondary: '#d0d6e0',
  textTertiary: '#8a8f98',
  textMuted: '#757880',
  tagBg: '#1a1a1a',
  divider: '#23252a',
  inputBg: '#141516',
  inputBorder: '#23252a',
  hoverBg: '#141516',
};
