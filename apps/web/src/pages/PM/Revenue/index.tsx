/** 营收分析 — 预计vs实际对比 + 月度趋势 (规范 §3.6) */
import { useState, useEffect, useMemo } from 'react';
import { fetchProjectPage, type ProjectVO } from '../../../api/project';

const T = { s1:'#0f1011', s2:'#141516', hl:'#23252a', hls:'#34343a', ink:'#f7f8f8', ink2:'#d0d6e0', ink3:'#8a8f98', ink4:'#757880', p:'#5e6ad2', ok:'#27a644', warn:'#d4a030', err:'#e05050' };
const fmtMoney = (n?: number|string) => { const v=Number(n); if(!v||isNaN(v)) return '¥0'; if(v>=10000) return `¥${(v/10000).toFixed(0)}万`; return `¥${v.toFixed(0)}`; };

export default function PMRevenue() {
  const [projects, setProjects] = useState<ProjectVO[]>([]);

  useEffect(() => { fetchProjectPage({pageNum:1,pageSize:500}).then(r=>setProjects(r.records||[])).catch(()=>{}); },[]);

  const stats = useMemo(() => {
    const total = projects.reduce((s,p)=>s+Number(p.projectAmount??0),0);
    const active = projects.filter(p=>p.projectStatus==='进行中'||p.projectStatus==='正式执行').length;
    const done = projects.filter(p=>p.projectStatus==='已完成').length;
    return { total, active, done, count: projects.length };
  }, [projects]);

  const monthData = useMemo(() => {
    const m: Record<string, { total: number; count: number }> = {};
    projects.forEach(p => { const month = p.createTime?.slice(0,7)||'未知'; if(!m[month]) m[month]={total:0,count:0}; m[month].total+=Number(p.projectAmount??0); m[month].count++; });
    return Object.entries(m).sort();
  }, [projects]);

  const maxRev = Math.max(...monthData.map(d=>d[1].total), 1);

  return (
    <div>
      <h2 style={{fontSize:20,fontWeight:600,margin:'0 0 16px',letterSpacing:'-0.3px',color:T.ink}}>营收分析</h2>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:24}}>
        {[{label:'预计总营收',value:fmtMoney(stats.total),color:T.p,sub:`${stats.count} 个项目`},{label:'进行中项目',value:stats.active,color:T.warn,sub:''},{label:'已完成项目',value:stats.done,color:T.ok,sub:''},{label:'项目总数',value:stats.count,color:T.ink2,sub:''}].map((k,i)=>(
          <div key={i} style={{background:T.s1,border:`1px solid ${T.hl}`,borderRadius:12,padding:'18px 20px'}}>
            <div style={{fontSize:12,color:T.ink4,marginBottom:2}}>{k.label}</div>
            <div style={{fontSize:28,fontWeight:600,color:k.color}}>{k.value}</div>
            {k.sub && <div style={{fontSize:11,color:T.ink4,marginTop:4}}>{k.sub}</div>}
          </div>
        ))}
      </div>

      <div style={{background:T.s1,border:`1px solid ${T.hl}`,borderRadius:12,padding:20}}>
        <div style={{fontSize:14,fontWeight:600,marginBottom:16,color:T.ink}}>月度营收趋势</div>
        {monthData.slice(-8).map(([m,d])=>(
          <div key={m} style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
            <span style={{width:60,fontSize:12,color:T.ink3,textAlign:'right'}}>{m.slice(5)}月</span>
            <div style={{flex:1,height:28,background:T.s2,borderRadius:6,overflow:'hidden'}}>
              <div style={{height:'100%',borderRadius:6,width:`${Math.max((d.total/maxRev)*100,3)}%`,background:T.p,display:'flex',alignItems:'center',paddingLeft:8,minWidth:60}}>
                <span style={{fontSize:11,color:'#fff',fontWeight:500}}>{fmtMoney(d.total)} · {d.count}个</span>
              </div>
            </div>
          </div>
        ))}
        {monthData.length===0 && <div style={{textAlign:'center',padding:40,color:T.ink4}}>暂无数据</div>}
      </div>
    </div>
  );
}
