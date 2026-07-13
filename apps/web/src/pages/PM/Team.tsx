/** PM 团队总览 */
import { useEffect, useState } from 'react';
import { useTheme } from '../../store/useTheme';
import { fetchProjectPage, type ProjectVO } from '../../api/project';
const d = { s1: '#0f1011', s2: '#141516', hl: '#23252a', ink: '#f7f8f8', ink2: '#d0d6e0', ink3: '#8a8f98', ink4: '#757880', p: '#5e6ad2', bg: '#010102' };
const l = { s1: '#fff', s2: '#f5f5f5', hl: '#e5e5e5', ink: '#171717', ink2: '#444', ink3: '#737373', ink4: '#999', p: '#5e6ad2', bg: '#fafafa' };

export default function PMTeam() {
  const { isDark } = useTheme();
  const T = isDark ? d : l;
  const [projects, setProjects] = useState<ProjectVO[]>([]);
  useEffect(() => { (async () => { try { const r = await fetchProjectPage({ pageNum: 1, pageSize: 500 }); setProjects(r.records || []); } catch { setProjects([]); } })(); }, []);

  const mgrMap: Record<string, { projects: ProjectVO[]; revenue: number }> = {};
  projects.forEach(p => {
    const m = p.projectManager || '未分配';
    if (!mgrMap[m]) mgrMap[m] = { projects: [], revenue: 0 };
    mgrMap[m].projects.push(p);
    mgrMap[m].revenue += p.projectAmount || 0;
  });
  const sorted = Object.entries(mgrMap).sort((a, b) => b[1].projects.length - a[1].projects.length);
  const maxCount = Math.max(...sorted.map(([, v]) => v.projects.length), 1);
  const fr = (v: number) => v >= 10000 ? Math.round(v / 10000) + '万' : v.toLocaleString();

  return (
    <div style={{ padding: 24, minHeight: '100%', background: T.bg }}>
      <div style={{ fontSize: 20, fontWeight: 600, color: T.ink, marginBottom: 16 }}>团队总览</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        <div style={{ background: T.s1, border: `1px solid ${T.hl}`, borderRadius: 12, padding: 18, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 600, color: T.ink }}>{sorted.length}</div>
          <div style={{ fontSize: 10, color: T.ink4, marginTop: 2 }}>负责经理人数</div>
        </div>
        <div style={{ background: T.s1, border: `1px solid ${T.hl}`, borderRadius: 12, padding: 18, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 600, color: T.ink }}>{projects.length}</div>
          <div style={{ fontSize: 10, color: T.ink4, marginTop: 2 }}>项目总数</div>
        </div>
        <div style={{ background: T.s1, border: `1px solid ${T.hl}`, borderRadius: 12, padding: 18, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 600, color: T.ink }}>{(projects.length / Math.max(sorted.length, 1)).toFixed(1)}</div>
          <div style={{ fontSize: 10, color: T.ink4, marginTop: 2 }}>人均项目</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {sorted.map(([name, data]) => (
          <div key={name} style={{ background: T.s1, border: `1px solid ${T.hl}`, borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div><div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{name}</div></div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: T.ink }}>{data.projects.length}<span style={{ fontSize: 11, color: T.ink4, fontWeight: 400 }}> 个项目</span></div>
                <div style={{ fontSize: 12, color: T.ink3 }}>¥{fr(data.revenue)}</div>
              </div>
            </div>
            <div style={{ height: 4, background: T.s2, borderRadius: 2, overflow: 'hidden', marginBottom: 10 }}>
              <div style={{ height: '100%', background: T.p, width: `${Math.round(data.projects.length / maxCount * 100)}%` }} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {data.projects.slice(0, 5).map(p => (
                <span key={p.id} style={{ fontSize: 10, background: T.s2, padding: '2px 8px', borderRadius: 99, color: T.ink3 }}>{p.projectName.slice(0, 12)}{p.projectName.length > 12 ? '...' : ''}</span>
              ))}
              {data.projects.length > 5 && <span style={{ fontSize: 10, color: T.ink4 }}>+{data.projects.length - 5}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
