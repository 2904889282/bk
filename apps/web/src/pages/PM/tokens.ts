/** Linear 暗色设计令牌 — 项目板块全局共享 */
export const T = {
  s1: '#0f1011', s2: '#141516', hl: '#23252a', hls: '#34343a',
  ink: '#f7f8f8', ink2: '#d0d6e0', ink3: '#8a8f98', ink4: '#757880',
  p: '#5e6ad2', ok: '#27a644', warn: '#d4a030', err: '#e05050',
  bg: '#010102',
};

export const RATING: Record<string, string> = { A: '#e5484d', B: '#f5a623', C: '#6b7280' };

export const fmtMoney = (n?: number | string) => {
  const v = Number(n);
  if (!v || isNaN(v)) return '';
  if (v >= 10000) return `¥${(v / 10000).toFixed(0)}万`;
  return `¥${v.toFixed(0)}`;
};
