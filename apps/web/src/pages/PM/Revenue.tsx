/** PM 营收分析 — 预计 vs 实际营收对比 + 毛利率 */
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProjectPage, type ProjectVO } from '../../api/project';

const T = { s1: '#0f1011', s2: '#141516', hl: '#23252a', hls: '#34343a',
  ink: '#f7f8f8', ink2: '#d0d6e0', ink3: '#8a8f98', ink4: '#757880',
  p: '#5e6ad2', ok: '#27a644', warn: '#d4a030', err: '#e05050', bg: '#010102' };

const fr = (v: number) => v >= 10000 ? (v / 10000).toFixed(0) + '万' : v ? v.toLocaleString() : '0';

type RevItem = ProjectVO & { actual: number; actualProfit: number; expectedProfit: number };

export default function PMRevenue() {
  const nav = useNavigate();
  const [raw, setRaw] = useState<ProjectVO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetchProjectPage({ pageNum: 1, pageSize: 500 });
        setRaw(r.records || []);
      } catch { setRaw([]); }
      setLoading(false);
    })();
  }, []);

  const items = useMemo<RevItem[]>(() => raw
    .filter(p => p.projectAmount > 0)
    .map(p => {
      const act = parseFloat(String((p as any).actualRevenue || '').replace(/[¥,]/g, '')) || 0;
      const ap = parseFloat(String((p as any).actualProfit || '').replace(/[¥,]/g, '')) || 0;
      const ep = parseFloat(String((p as any).expectedProfit || '').replace(/[¥,]/g, '')) || 0;
      return { ...p, actual: act, actualProfit: ap, expectedProfit: ep };
    })
    .sort((a, b) => b.projectAmount - a.projectAmount)
  , [raw]);

  const totalExp = useMemo(() => items.reduce((s, p) => s + p.projectAmount, 0), [items]);
  const totalAct = useMemo(() => items.reduce((s, p) => s + p.actual, 0), [items]);
  const totalActProfit = useMemo(() => items.reduce((s, p) => s + p.actualProfit, 0), [items]);
  const totalExpProfit = useMemo(() => items.reduce((s, p) => s + p.expectedProfit, 0), [items]);
  const withActual = items.filter(p => p.actual > 0).length;
  const profitRate = totalAct > 0 ? (totalActProfit / totalAct * 100).toFixed(1) : '-';
  const maxVal = Math.max(totalExp, ...items.map(p => Math.max(p.projectAmount, p.actual)));

  if (loading) return <div style={{ color: T.ink4, padding: 40, textAlign: 'center' }}>加载中...</div>;

  return (
    <div style={{ padding: 24, minHeight: '100%', background: T.bg }}>
      <div style={{ fontSize: 20, fontWeight: 600, color: T.ink, marginBottom: 16, letterSpacing: -0.3 }}>营收分析</div>

      {/* 总览 KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
        <RevKPI label="预计总营收" value={`¥${fr(totalExp)}`} sub={`${items.length} 个项目`} />
        <RevKPI label="实际总营收" value={`¥${fr(totalAct)}`} sub={`${withActual} 个有数据`}
          valColor={totalAct > totalExp ? T.ok : totalAct > 0 ? T.warn : T.ink4} />
        <RevKPI label="实际毛利润" value={`¥${fr(totalActProfit)}`} sub={items.filter(p => p.actualProfit > 0).length + '个有数据'}
          valColor={totalActProfit > totalExpProfit ? T.ok : totalActProfit > 0 ? T.warn : T.ink4} />
        <RevKPI label="毛利率" value={profitRate === '-' ? '-' : `${profitRate}%`}
          sub="实际毛利/实际营收" />
      </div>

      {/* 预计 vs 实际对比 */}
      <div style={{ background: T.s1, border: `1px solid ${T.hl}`, borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.ink, marginBottom: 16 }}>
          预计 vs 实际营收对比<span style={{ fontSize: 12, color: T.ink4, fontWeight: 400, marginLeft: 8 }}>{withActual} 个有实际数据</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
          {items.filter(p => p.actual > 0).slice(0, 12).map(p => {
            const diff = p.actual - p.projectAmount;
            const diffPct = p.projectAmount > 0 ? Math.round(diff / p.projectAmount * 100) : 0;
            const isPositive = diff >= 0;
            const expW = Math.round(p.projectAmount / maxVal * 100);
            const actW = Math.round(p.actual / maxVal * 100);
            const diffColor = isPositive ? T.ok : T.err;

            return (
              <div key={p.id} onClick={() => nav(`/projects/${p.id}`)}
                style={{ cursor: 'pointer', padding: 16, background: T.s2, borderRadius: 8, border: `1px solid ${T.hl}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{p.projectName}</div>
                    <div style={{ fontSize: 10, color: T.ink4, marginTop: 1 }}>{p.projectManager} · {p.deptBelong || ''}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: diffColor }}>{isPositive ? '+' : ''}{fr(diff)}</span>
                    <span style={{ fontSize: 10, color: diffColor, marginLeft: 2 }}>{isPositive ? '+' : ''}{diffPct}%</span>
                  </div>
                </div>
                {/* 预计 */}
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 10, color: T.ink4, textTransform: 'uppercase', letterSpacing: 0.5 }}>预计</span>
                    <span style={{ fontSize: 12, color: T.ink2 }}>¥{fr(p.projectAmount)}</span>
                  </div>
                  <div style={{ height: 6, background: T.s1, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 3, background: T.p, opacity: 0.4, width: `${Math.max(expW, 3)}%` }} />
                  </div>
                </div>
                {/* 实际 */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 10, color: T.ink4, textTransform: 'uppercase', letterSpacing: 0.5 }}>实际</span>
                    <span style={{ fontSize: 12, color: T.ink2 }}>¥{fr(p.actual)}</span>
                  </div>
                  <div style={{ height: 6, background: T.s1, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 3, background: diffColor, opacity: 0.5, width: `${Math.max(actW, 3)}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
          {withActual === 0 && <div style={{ fontSize: 12, color: T.ink4, padding: '16px 0', gridColumn: '1/-1' }}>暂无实际营收数据，可在项目详情页补充</div>}
        </div>
      </div>
    </div>
  );
}

function RevKPI({ label, value, sub, valColor }: { label: string; value: string; sub: string; valColor?: string }) {
  return (
    <div style={{ background: T.s1, border: `1px solid ${T.hl}`, borderRadius: 12, padding: '18px 20px' }}>
      <div style={{ fontSize: 12, color: T.ink4, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.5, color: valColor || T.ink }}>{value}</div>
      <div style={{ fontSize: 11, color: T.ink4, marginTop: 4 }}>{sub}</div>
    </div>
  );
}
