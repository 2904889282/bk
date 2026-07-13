/** PM 关键目标 */
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../store/useTheme';
import { fetchProjectPage, updateProject, type ProjectVO } from '../../api/project';

const d = { s1: '#0f1011', s2: '#141516', s3: '#18191a', hl: '#23252a', hls: '#34343a', ink: '#f7f8f8', ink2: '#d0d6e0', ink3: '#8a8f98', ink4: '#757880', p: '#5e6ad2', ok: '#27a644', warn: '#d4a030', err: '#e05050', bg: '#010102' };
const l = { s1: '#fff', s2: '#f5f5f5', s3: '#e5e5e5', hl: '#e5e5e5', hls: '#c5c5c5', ink: '#171717', ink2: '#444', ink3: '#737373', ink4: '#999', p: '#5e6ad2', ok: '#16a34a', warn: '#ca8a04', err: '#dc2626', bg: '#fafafa' };

const sortGoals = (a: ProjectVO, b: ProjectVO) => {
  const ap = (a as any).goalName ? (a.progress || 0) : -1;
  const bp = (b as any).goalName ? (b.progress || 0) : -1;
  return bp - ap;
};

export default function PMGoals() {
  const nav = useNavigate();
  const { isDark } = useTheme();
  const T = isDark ? d : l;
  const [projects, setProjects] = useState<ProjectVO[]>([]);
  const [loading, setLoading] = useState(true);
  const [dept, setDept] = useState('');
  const [rating, setRating] = useState('');

  useEffect(() => {
    (async () => {
      try { const r = await fetchProjectPage({ pageNum: 1, pageSize: 500 }); setProjects((r.records || []).filter(p => (p as any).goalName || p.progress > 0).sort(sortGoals)); }
      catch { setProjects([]); }
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    let d = projects;
    if (rating) d = d.filter(p => p.projectLevel === rating);
    if (dept) d = d.filter(p => p.deptBelong === dept);
    return d;
  }, [projects, dept, rating]);

  const depts = useMemo(() => [...new Set(projects.map(p => p.deptBelong).filter(Boolean))].sort(), [projects]);

  const saveGoal = async (id: number, field: string, val: number) => {
    try {
      await updateProject(id, { [field]: val } as any);
      setProjects(prev => prev.map(p => p.id === id ? { ...p, progress: val } : p));
    } catch { /* ignore */ }
  };

  if (loading) return <div style={{ color: T.ink4, padding: 40, textAlign: 'center' }}>加载中...</div>;

  const avgProg = filtered.length ? Math.round(filtered.reduce((s, p) => s + (p.progress || 0), 0) / filtered.length) : 0;
  const done = filtered.filter(p => (p.progress || 0) >= 100).length;

  return (
    <div style={{ padding: 24, minHeight: '100%', background: T.bg }}>
      <div style={{ fontSize: 20, fontWeight: 600, color: T.ink, marginBottom: 16, letterSpacing: -0.3 }}>关键目标</div>

      {/* 筛选行 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: T.ink4 }}>部门:</span>
        <PillGroup>
          <Pill active={!dept} onClick={() => setDept('')}>全部</Pill>
          {depts.map(d => <Pill key={d} active={dept === d} onClick={() => setDept(d)}>{d}</Pill>)}
        </PillGroup>
        <span style={{ fontSize: 12, color: T.ink4, marginLeft: 12 }}>评级:</span>
        <PillGroup>
          <Pill active={!rating} onClick={() => setRating('')}>全部</Pill>
          {['A', 'B', 'C'].map(r => <Pill key={r} active={rating === r} onClick={() => setRating(r)}>{r}级</Pill>)}
        </PillGroup>
      </div>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
        <GoalKPI label="目标总数" value={String(filtered.length)} sub={`${projects.length} 个含目标`} />
        <GoalKPI label="平均进度" value={`${avgProg}%`} sub="有进度均值" valColor={avgProg >= 80 ? T.ok : avgProg > 0 ? T.p : T.ink4} />
        <GoalKPI label="已达标" value={String(done)} sub={<span style={{ color: T.ok }}>{filtered.length ? Math.round(done / filtered.length * 100) : 0}%</span>} valColor={T.ok} />
        <GoalKPI label="筛选结果" value={String(filtered.length)} sub="个" />
      </div>

      {/* 卡片列表 */}
      {filtered.map(p => {
        const prog = p.progress || 0;
        const clr = prog >= 100 ? T.ok : prog > 0 ? T.p : T.ink4;
        const goalName = (p as any).goalName || p.remark || '';
        const goalTarget = (p as any).goalTarget || '';
        return (
          <div key={p.id} onClick={() => nav(`/projects/${p.id}`)}
            style={{ background: T.s1, border: `1px solid ${T.hl}`, borderRadius: 12, marginBottom: 12, overflow: 'hidden', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: T.s2, borderBottom: `1px solid ${T.hl}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: p.projectLevel === 'A' ? 'rgba(94,106,210,0.15)' : 'rgba(138,143,152,0.1)', color: p.projectLevel === 'A' ? T.p : T.ink3 }}>{p.projectLevel || '-'}</span>
                <strong style={{ color: T.ink, fontSize: 14 }}>{p.projectName}</strong>
                <span style={{ fontSize: 10, color: T.ink4 }}>{p.projectManager} · {p.deptBelong || ''}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 100, height: 6, background: T.s2, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, background: clr, width: `${Math.min(prog, 100)}%`, transition: 'width 0.3s' }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: clr, minWidth: 36 }}>{prog}%</span>
              </div>
            </div>
            <div style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 10, color: T.ink4, marginBottom: 4 }}>目标</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 8 }}>{goalName || '未设定目标名称'}</div>
              {goalTarget ? <div style={{ fontSize: 11, color: T.ink3, marginBottom: 8 }}>交付目标: {goalTarget}</div> : null}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 10, color: T.ink4 }}>完成进度</span>
                <input
                  defaultValue={prog || ''}
                  type="number" placeholder="%"
                  onClick={e => e.stopPropagation()}
                  onBlur={e => { const v = parseInt(e.target.value) || 0; saveGoal(p.id, 'progress', v); }}
                  style={{ width: 52, height: 24, fontSize: 11, fontWeight: 600, textAlign: 'center', background: T.s2, border: `1px solid ${T.hl}`, borderRadius: 4, color: clr, fontFamily: 'inherit', padding: 2, outline: 'none' }}
                  onFocus={e => { e.target.style.borderColor = T.hls; e.target.style.background = T.s1; }}
                  onBlur={e => { e.target.style.borderColor = T.hl; e.target.style.background = T.s2; }}
                />
                <div style={{ flex: 1, height: 5, background: T.s2, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, background: clr, width: `${Math.min(prog, 100)}%`, transition: 'width 0.3s' }} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PillGroup({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', background: T.s2, borderRadius: 99, padding: 2, gap: 1 }}>{children}</div>;
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button onClick={onClick} style={{
      padding: '5px 14px', borderRadius: 99, fontSize: 12, cursor: 'pointer', border: 0,
      background: active ? T.s1 : 'transparent', color: active ? T.ink : T.ink3,
      fontFamily: 'inherit', fontWeight: active ? 500 : 400,
    }}>{children}</button>
  );
}

function GoalKPI({ label, value, sub, valColor }: { label: string; value: string; sub: React.ReactNode; valColor?: string }) {
  return (
    <div style={{ background: T.s1, border: `1px solid ${T.hl}`, borderRadius: 12, padding: '18px 20px' }}>
      <div style={{ fontSize: 12, color: T.ink4, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: -0.8, color: valColor || T.ink }}>{value}</div>
      <div style={{ fontSize: 11, color: T.ink4, marginTop: 4 }}>{sub}</div>
    </div>
  );
}
