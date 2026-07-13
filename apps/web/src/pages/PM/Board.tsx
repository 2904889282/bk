/** PM 多视图看板 */
import { useEffect, useState } from 'react';
import { fetchProjectPage, type ProjectVO } from '../../api/project';
const T = { s1: '#0f1011', s2: '#141516', hl: '#23252a', ink: '#f7f8f8', ink4: '#757880', p: '#5e6ad2', ok: '#27a644', warn: '#d4a030', bg: '#010102' };

export default function PMBoard() {
  const [projects, setProjects] = useState<ProjectVO[]>([]);
  useEffect(() => { (async () => { try { const r = await fetchProjectPage({ pageNum: 1, pageSize: 500 }); setProjects(r.records || []); } catch { setProjects([]); } })(); }, []);

  const byStatus: Record<string, ProjectVO[]> = {};
  projects.forEach(p => { const s = p.projectStatus || '未知'; if (!byStatus[s]) byStatus[s] = []; byStatus[s].push(p); });
  const colors = [T.p, T.ok, T.warn, '#e5484d', '#5f6b7a'];
  const keys = Object.keys(byStatus);

  return (
    <div style={{ padding: 24, minHeight: '100%', background: T.bg }}>
      <div style={{ fontSize: 20, fontWeight: 600, color: T.ink, marginBottom: 16 }}>多视图看板</div>
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 24 }}>
        {keys.map((k, i) => (
          <div key={k} style={{ minWidth: 280, flexShrink: 0 }}>
            <div style={{ padding: '10px 12px', background: T.s1, border: `1px solid ${T.hl}`, borderRadius: 8, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 13, color: T.ink }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: colors[i % colors.length], flexShrink: 0 }} />
              {k}<span style={{ marginLeft: 'auto', fontSize: 10, color: T.ink4 }}>{byStatus[k].length}</span>
            </div>
            {byStatus[k].map(p => (
              <div key={p.id} style={{ background: T.s1, border: `1px solid ${T.hl}`, borderLeft: `3px solid ${colors[i % colors.length]}`, borderRadius: 8, padding: 12, marginBottom: 8, cursor: 'pointer', fontSize: 13, color: T.ink }}>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>{p.projectName}</div>
                <div style={{ fontSize: 11, color: T.ink4 }}>{p.projectManager} · {p.deptBelong || ''} · ¥{(p.projectAmount || 0).toLocaleString()}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
