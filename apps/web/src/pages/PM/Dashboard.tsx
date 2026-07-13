/** PM 数据看板 */
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../store/useTheme';
import { fetchProjectPage, type ProjectVO } from '../../api/project';

const d = { s1: '#0f1011', s2: '#141516', hl: '#23252a', p: '#5e6ad2', ink: '#f7f8f8', ink2: '#d0d6e0', ink3: '#8a8f98', ink4: '#757880', ok: '#27a644', warn: '#d4a030', err: '#e05050', bg: '#010102' };
const l = { s1: '#fff', s2: '#f5f5f5', hl: '#e5e5e5', p: '#5e6ad2', ink: '#171717', ink2: '#444', ink3: '#737373', ink4: '#999', ok: '#16a34a', warn: '#ca8a04', err: '#dc2626', bg: '#fafafa' };

const fr = (v: number) => v >= 10000 ? Math.round(v / 10000) + '万' : v.toLocaleString();
const fmtMonth = (d: string) => d ? parseInt(d.slice(5, 7)) + '月' : '-';

export default function PMDashboard() {
  const nav = useNavigate();
  const { isDark } = useTheme();
  const T = isDark ? d : l;
  const [projects, setProjects] = useState<ProjectVO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchProjectPage({ pageNum: 1, pageSize: 500 });
        setProjects(res.records || []);
      } catch { setProjects([]); }
      setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => {
    const t = projects.length;
    const totalRev = projects.reduce((s, p) => s + (p.projectAmount || 0), 0);
    const wg = projects.filter(p => (p as any).goalName).length;
    const deptMap: Record<string, number> = {};
    projects.forEach(p => { const d = p.deptBelong || '未分配'; deptMap[d] = (deptMap[d] || 0) + 1; });
    const maxDept = Math.max(...Object.values(deptMap), 1);
    const monthMap: Record<string, number> = {};
    projects.forEach(p => {
      if (p.startDate) {
        const m = p.startDate.slice(0, 7);
        monthMap[m] = (monthMap[m] || 0) + (p.projectAmount || 0);
      }
    });
    const maxMonth = Math.max(...Object.values(monthMap), 1);
    const recent = [...projects].sort((a, b) => (b.createTime || '').localeCompare(a.createTime || '')).slice(0, 8);
    return { t, totalRev, wg, deptMap, maxDept, monthMap, maxMonth, recent };
  }, [projects]);

  if (loading) return <div style={{ color: T.ink4, padding: 40, textAlign: 'center' }}>加载中...</div>;

  return (
    <div style={{ padding: 24, minHeight: '100%', background: T.bg }}>
      <div style={{ fontSize: 20, fontWeight: 600, color: T.ink, marginBottom: 16, letterSpacing: -0.3 }}>
        数据看板
      </div>

      {/* KPI 网格 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
        <KPI label="项目总数" value={String(stats.t)} sub="个项目" />
        <KPI label="预计总营收" value={`¥${fr(stats.totalRev)}`} sub={`${projects.filter(p => p.projectAmount > 0).length} 个有数据`} valueSize={22} />
        <KPI label="设有关键目标" value={String(stats.wg)} sub={<span style={{ color: T.ok }}>{Math.round(stats.wg / Math.max(stats.t, 1) * 100)}%</span>} />
        <KPI
          label="项目总进度"
          value={`${projects.length ? Math.round(projects.reduce((s, p) => s + (p.progress || 0), 0) / projects.length) : 0}%`}
          sub="均值"
          valueColor={projects.length ? (projects.reduce((s, p) => s + (p.progress || 0), 0) / projects.length >= 80 ? T.ok : T.warn) : T.ink3}
        />
      </div>

      {/* 部门分布 + 月度营收 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <Panel title="部门分布" count={`${Object.keys(stats.deptMap).length} 个`}>
          {Object.entries(stats.deptMap).map(([d, c]) => (
            <BarRow key={d} label={d} count={String(c)} pct={Math.round(c / stats.maxDept * 100)} color={T.p} />
          ))}
        </Panel>
        <Panel title="月度营收" count="预计">
          {Object.entries(stats.monthMap).sort().map(([m, v]) => (
            <BarRow key={m} label={fmtMonth(m)} count={`¥${fr(v)}`} pct={Math.round(v / stats.maxMonth * 100)} color={T.p} />
          ))}
        </Panel>
      </div>

      {/* 最近项目 */}
      <Panel full title="最近项目">
        {stats.recent.map(p => (
          <div key={p.id}
            onClick={() => nav(`/projects/${p.id}`)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: `1px solid ${T.hl}`, cursor: 'pointer', fontSize: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.projectLevel === 'A' ? T.p : p.projectLevel === 'B' ? T.ink2 : T.ink4 }} />
            <strong style={{ color: T.ink }}>{p.projectName}</strong>
            <span style={{ color: T.ink4 }}>{p.deptBelong || '未分配'}</span>
            <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, background: 'rgba(39,166,68,0.16)', color: T.ok }}>{p.projectStatus}</span>
            <span style={{ marginLeft: 'auto', color: T.ink3 }}>{p.projectManager} · {fmtMonth(p.startDate)}{p.projectAmount > 0 ? ` · ¥${fr(p.projectAmount)}` : ''}</span>
          </div>
        ))}
      </Panel>
    </div>
  );
}

/* ──── 子组件 ──── */
function KPI({ label, value, sub, valueSize, valueColor }: { label: string; value: string; sub: React.ReactNode; valueSize?: number; valueColor?: string }) {
  return (
    <div style={{ background: T.s1, border: `1px solid ${T.hl}`, borderRadius: 12, padding: '18px 20px' }}>
      <div style={{ fontSize: 12, color: T.ink4, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: valueSize || 30, fontWeight: 600, letterSpacing: -0.8, lineHeight: 1.15, color: valueColor || T.ink }}>{value}</div>
      <div style={{ fontSize: 11, color: T.ink4, marginTop: 4 }}>{sub}</div>
    </div>
  );
}

function Panel({ title, children, count, full }: { title: string; children: React.ReactNode; count?: string; full?: boolean }) {
  return (
    <div style={{ background: T.s1, border: `1px solid ${T.hl}`, borderRadius: 12, padding: 20, gridColumn: full ? '1/-1' : undefined }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: T.ink, marginBottom: 16 }}>
        {title}{count ? <span style={{ fontSize: 12, color: T.ink4, fontWeight: 400, marginLeft: 8 }}>{count}</span> : null}
      </div>
      {children}
    </div>
  );
}

function BarRow({ label, count, pct, color }: { label: string; count: string; pct: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <span style={{ width: 70, fontSize: 12, color: T.ink3, textAlign: 'right', flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 24, background: T.s2, borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 6, background: color, opacity: 0.25 + 0.25 * pct / 100, width: `${pct}%`, transition: 'width 0.6s' }} />
      </div>
      <span style={{ width: 36, fontSize: 12, color: T.ink2, textAlign: 'right' }}>{count}</span>
    </div>
  );
}
