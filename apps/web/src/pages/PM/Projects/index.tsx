/** PM 项目列表 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProjectPage, type ProjectVO } from '../../../api/project';

const T = { s1: '#0f1011', s2: '#141516', hl: '#23252a', hls: '#34343a', ink: '#f7f8f8', ink2: '#d0d6e0', ink3: '#8a8f98', ink4: '#757880', p: '#5e6ad2', ok: '#27a644', warn: '#d4a030', bg: '#010102' };

export default function PmProjects() {
  const nav = useNavigate();
  const [projects, setProjects] = useState<ProjectVO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const r = await fetchProjectPage({ pageNum: 1, pageSize: 500 }); setProjects(r.records || []); } catch { setProjects([]); }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div style={{ color: T.ink4, padding: 40, textAlign: 'center', background: T.bg, minHeight: '100%' }}>加载中...</div>;

  return (
    <div style={{ padding: 24, minHeight: '100%', background: T.bg }}>
      <div style={{ fontSize: 20, fontWeight: 600, color: T.ink, marginBottom: 16 }}>项目列表 <span style={{ fontSize: 12, color: T.ink4, fontWeight: 400 }}>{projects.length} 个项目</span></div>
      <div style={{ background: T.s1, border: `1px solid ${T.hl}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 90px 80px 90px', padding: '10px 16px', borderBottom: `1px solid ${T.hl}`, fontSize: 11, color: T.ink4 }}>
          <span>项目名称</span><span>经理</span><span>部门</span><span>评级</span><span>状态</span>
        </div>
        {projects.map(p => (
          <div key={p.id} onClick={() => nav(`/projects/${p.id}`)} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 90px 80px 90px', padding: '11px 16px', borderBottom: `1px solid ${T.hl}`, cursor: 'pointer', fontSize: 13, color: T.ink }}>
            <span style={{ fontWeight: 500 }}>{p.projectName}</span><span style={{ color: T.ink3 }}>{p.projectManager}</span><span style={{ color: T.ink3 }}>{p.deptBelong || '-'}</span>
            <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: p.projectLevel === 'A' ? 'rgba(94,106,210,0.15)' : 'rgba(138,143,152,0.1)', color: p.projectLevel === 'A' ? T.p : T.ink3 }}>{p.projectLevel || '-'}</span>
            <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, background: 'rgba(39,166,68,0.16)', color: T.ok }}>{p.projectStatus}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
