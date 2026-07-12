/** 人员分配 — 按角色分列 (规范 §3.8) */
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProjectPage, type ProjectVO } from '../../../api/project';
import { T } from '../tokens';

export default function PMStaff() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectVO[]>([]);
  useEffect(() => { fetchProjectPage({pageNum:1,pageSize:500}).then(r=>setProjects(r.records||[])).catch(()=>{}); },[]);

  const roles = useMemo(() => [
    { key:'projectManager', label:'一条龙经理' },
    { key:'deliveryManager', label:'交付经理' },
    { key:'productManager', label:'产品经理' },
  ], []);

  return (
    <div>
      <h2 style={{fontSize:20,fontWeight:600,margin:'0 0 16px',letterSpacing:'-0.3px',color:T.ink}}>人员分配</h2>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
        {roles.map(role => {
          const grouped = new Map<string, ProjectVO[]>();
          projects.forEach(p => { const name = (p as any)[role.key] || '未分配'; if(!grouped.has(name)) grouped.set(name,[]); grouped.get(name)!.push(p); });
          return (
            <div key={role.key} style={{background:T.s1,border:`1px solid ${T.hl}`,borderRadius:12,overflow:'hidden'}}>
              <div style={{padding:'12px 16px',borderBottom:`1px solid ${T.hl}`,fontSize:13,fontWeight:600,color:T.ink,background:T.s2}}>{role.label}</div>
              {Array.from(grouped.entries()).sort((a,b)=>b[1].length-a[1].length).map(([name,items])=>(
                <div key={name} style={{padding:'10px 16px',borderBottom:`1px solid ${T.hl}`,fontSize:12}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                    <span style={{fontWeight:500,color:T.ink}}>{name}</span>
                    <span style={{fontSize:10,color:T.ink4,background:T.s2,padding:'1px 6px',borderRadius:999}}>{items.length}个</span>
                  </div>
                  {items.slice(0,3).map(p => (
                    <div key={p.id} onClick={()=>navigate(`/projects/${p.id}`)} style={{color:T.ink3,cursor:'pointer',padding:'2px 0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontSize:11}}
                      onMouseEnter={e=>e.currentTarget.style.color=T.p} onMouseLeave={e=>e.currentTarget.style.color=T.ink3}>{p.projectName}</div>
                  ))}
                  {items.length>3 && <div style={{color:T.ink4,fontSize:10}}>+{items.length-3} 更多...</div>}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
