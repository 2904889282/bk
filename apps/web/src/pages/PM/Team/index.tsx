/** 团队管理 — 按一条龙经理分组 (规范 §3.7) */
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProjectPage, type ProjectVO } from '../../../api/project';
import { T, RATING, fmtMoney } from '../tokens';

export default function PMTeam() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectVO[]>([]);
  useEffect(() => { fetchProjectPage({pageNum:1,pageSize:500}).then(r=>setProjects(r.records||[])).catch(()=>{}); },[]);

  const groups = useMemo(() => {
    const m = new Map<string, ProjectVO[]>();
    projects.forEach(p => { const mgr = p.projectManager || '未分配'; if(!m.has(mgr)) m.set(mgr,[]); m.get(mgr)!.push(p); });
    return Array.from(m.entries()).sort((a,b)=>b[1].length - a[1].length);
  }, [projects]);

  return (
    <div>
      <h2 style={{fontSize:20,fontWeight:600,margin:'0 0 16px',letterSpacing:'-0.3px',color:T.ink}}>团队管理</h2>
      {groups.map(([mgr, items]) => (
        <div key={mgr} style={{marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',gap:10,padding:'12px 16px',background:T.s2,borderRadius:'8px 8px 0 0',border:`1px solid ${T.hl}`,borderBottom:'none'}}>
            <span style={{width:8,height:8,borderRadius:'50%',background:T.p}} />
            <span style={{fontSize:14,fontWeight:600,color:T.ink}}>{mgr}</span>
            <span style={{fontSize:11,color:T.ink4,background:T.s1,padding:'1px 8px',borderRadius:999}}>{items.length} 个项目</span>
          </div>
          <div style={{background:T.s1,border:`1px solid ${T.hl}`,borderTop:'none',borderRadius:'0 0 8px 8px',overflow:'hidden'}}>
            {items.map(p => (
              <div key={p.id} onClick={()=>navigate(`/projects/${p.id}`)} style={{
                display:'flex',alignItems:'center',gap:12,padding:'10px 16px',borderBottom:`1px solid ${T.hl}`,cursor:'pointer',transition:'background 0.1s',
              }} onMouseEnter={e=>e.currentTarget.style.background=T.s2} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <span style={{width:8,height:8,borderRadius:'50%',background:RATING[p.projectLevel]||T.ink4}} />
                <span style={{fontWeight:500,fontSize:13,color:T.ink,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.projectName}</span>
                <span style={{fontSize:11,color:T.ink4}}>{p.deptBelong||'-'}</span>
                <span style={{fontSize:12,color:T.ink2,minWidth:70,textAlign:'right'}}>{fmtMoney(p.projectAmount)}</span>
                <span style={{fontSize:10,padding:'3px 9px',borderRadius:999,background:'rgba(94,106,210,0.12)',color:T.p}}>{p.projectStatus||'-'}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      {groups.length===0 && <div style={{textAlign:'center',padding:60,color:T.ink4}}>暂无数据</div>}
    </div>
  );
}
