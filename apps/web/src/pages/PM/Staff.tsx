/** PM 人员分配 */
import { useEffect, useState } from 'react';
import { useTheme } from '../../store/useTheme';
import { fetchProjectPage, type ProjectVO } from '../../api/project';
const d = { s1: '#0f1011', s2: '#141516', hl: '#23252a', hls: '#34343a', ink: '#f7f8f8', ink2: '#d0d6e0', ink3: '#8a8f98', ink4: '#757880', p: '#5e6ad2', ok: '#27a644', warn: '#d4a030', bg: '#010102' };
const l = { s1: '#fff', s2: '#f5f5f5', hl: '#e5e5e5', hls: '#c5c5c5', ink: '#171717', ink2: '#444', ink3: '#737373', ink4: '#999', p: '#5e6ad2', ok: '#16a34a', warn: '#ca8a04', bg: '#fafafa' };

let T = l;

export default function PMStaff() {
  const { isDark } = useTheme();
  T = isDark ? d : l;
  const [projects, setProjects] = useState<ProjectVO[]>([]);
  useEffect(() => { (async () => { try { const r = await fetchProjectPage({ pageNum: 1, pageSize: 500 }); setProjects(r.records || []); } catch { setProjects([]); } })(); }, []);

  const staffMap: Record<string, { projects: ProjectVO[]; roles: Set<string> }> = {};
  projects.forEach(p => {
    const add = (name: string | undefined, role: string) => {
      if (!name) return;
      if (!staffMap[name]) staffMap[name] = { projects: [], roles: new Set() };
      staffMap[name].projects.push(p);
      staffMap[name].roles.add(role);
    };
    add(p.projectManager, '客户经理');
    add(p.deliveryManager, '交付经理');
    add(p.productManager, '方案经理');
  });
  const sorted = Object.entries(staffMap).sort((a, b) => b[1].projects.length - a[1].projects.length);

  return (
    <div style={{ padding: 24, minHeight: '100%', background: T.bg }}>
      <div style={{ fontSize: 20, fontWeight: 600, color: T.ink, marginBottom: 16 }}>人员分配</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        {sorted.map(([name, data], i) => (
          <div key={name} style={{ background: T.s1, border: `1px solid ${T.hl}`, borderTop: `3px solid ${[T.p, T.ok, T.warn, '#e5484d'][i % 4]}`, borderRadius: 12, padding: 18 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(94,106,210,0.15)', color: T.p, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, marginBottom: 10 }}>
              {(name || '未').slice(-2)}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.ink, marginBottom: 2 }}>{name}</div>
            <div style={{ fontSize: 10, color: T.ink4, marginBottom: 8 }}>{[...data.roles].join(' · ')}</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: T.p }}>{data.projects.length}<span style={{ fontSize: 11, color: T.ink4, fontWeight: 400 }}> 个项目</span></div>
            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {data.projects.slice(0, 3).map(p => (
                <span key={p.id} style={{ fontSize: 10, background: T.s2, padding: '2px 6px', borderRadius: 4, color: T.ink3 }}>{p.projectName.slice(0, 10)}</span>
              ))}
              {data.projects.length > 3 && <span style={{ fontSize: 10, color: T.ink4 }}>+{data.projects.length - 3}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
