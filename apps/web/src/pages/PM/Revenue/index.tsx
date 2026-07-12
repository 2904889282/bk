/** 营收分析 — KPI + 预计vs实际对比 + 月度趋势 (规范 §3.6) */
import { useState, useEffect, useMemo } from 'react';
import { fetchProjectPage, fetchPeriods, type ProjectVO } from '../../../api/project';
import { T, fmtMoney } from '../tokens';

export default function PMRevenue() {
  const [projects, setProjects] = useState<ProjectVO[]>([]);
  const [periodData, setPeriodData] = useState<Record<number, any>>({});

  useEffect(() => {
    fetchProjectPage({pageNum:1,pageSize:500}).then(r => {
      setProjects(r.records||[]);
      (r.records||[]).forEach(p => {
        fetchPeriods(p.id).then(ps => {
          const latest = ps.find(x => x.actualRevenue && Number(x.actualRevenue) > 0);
          if (latest) setPeriodData(prev => ({...prev, [p.id]: latest}));
        }).catch(()=>{});
      });
    }).catch(()=>{});
  }, []);

  const stats = useMemo(() => {
    const total = projects.reduce((s,p)=>s+Number(p.projectAmount??0),0);
    const active = projects.filter(p=>p.projectStatus==='进行中'||p.projectStatus==='正式执行').length;
    const done = projects.filter(p=>p.projectStatus==='已完成').length;
    return { total, active, done, count:projects.length };
  }, [projects]);

  const monthData = useMemo(() => {
    const m: Record<string, {total:number;count:number}> = {};
    projects.forEach(p => { const mo = p.createTime?.slice(0,7)||'未知'; if(!m[mo]) m[mo]={total:0,count:0}; m[mo].total+=Number(p.projectAmount??0); m[mo].count++; });
    return Object.entries(m).sort();
  }, [projects]);

  const maxRev = Math.max(...monthData.map(d=>d[1].total), 1);

  /* 预计vs实际对比 */
  const comparisons = useMemo(() => projects.filter(p => {
    const pd = periodData[p.id];
    return pd && Number(pd.actualRevenue) > 0;
  }).slice(0, 12).map(p => {
    const pd = periodData[p.id];
    const expected = Number(p.projectAmount || 0);
    const actual = Number(pd?.actualRevenue || 0);
    const diff = expected > 0 ? Math.round((actual - expected) / expected * 100) : 0;
    return { p, expected, actual, diff, pd };
  }), [projects, periodData]);

  return (
    <div>
      <h2 style={{fontSize:20,fontWeight:600,margin:'0 0 16px',letterSpacing:'-0.3px',color:T.ink}}>营收分析</h2>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:24}}>
        {[
          {label:'预计总营收',value:fmtMoney(stats.total),color:T.p,sub:`${stats.count} 个项目`},
          {label:'进行中',value:stats.active,color:T.warn,sub:''},
          {label:'已完成',value:stats.done,color:T.ok,sub:''},
          {label:'有实际数据',value:comparisons.length,color:T.ink2,sub:''}
        ].map((k,i)=>(
          <div key={i} style={{background:T.s1,border:`1px solid ${T.hl}`,borderRadius:12,padding:'18px 20px'}}>
            <div style={{fontSize:12,color:T.ink4,marginBottom:2}}>{k.label}</div>
            <div style={{fontSize:28,fontWeight:600,color:k.color}}>{k.value}</div>
            {k.sub ? <div style={{fontSize:11,color:T.ink4,marginTop:4}}>{k.sub}</div> : null}
          </div>
        ))}
      </div>

      {/* 预计 vs 实际对比卡片 */}
      {comparisons.length > 0 && (
        <div style={{background:T.s1,border:`1px solid ${T.hl}`,borderRadius:12,padding:20,marginBottom:24}}>
          <div style={{fontSize:14,fontWeight:600,marginBottom:16,color:T.ink}}>预计 vs 实际营收对比 ({comparisons.length}个有实际数据)</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12}}>
            {comparisons.map(({p,expected,actual,diff}) => (
              <div key={p.id} style={{background:T.s2,borderRadius:8,padding:14}}>
                <div style={{fontSize:13,fontWeight:500,color:T.ink,marginBottom:8}}>{p.projectName.slice(0,20)}</div>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4,fontSize:12}}>
                  <span style={{color:T.ink4}}>预计</span><span style={{color:T.ink2,fontWeight:500}}>{fmtMoney(expected)}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12}}>
                  <span style={{color:T.ink4}}>实际</span><span style={{color:T.ink2,fontWeight:500}}>{fmtMoney(actual)}</span>
                </div>
                <div style={{fontSize:11,color:diff>=0?T.ok:T.err,fontWeight:600,marginTop:6}}>
                  {diff>=0?'+':''}{diff}% {diff>=0?'超预期':'未达预期'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 月度趋势 */}
      <div style={{background:T.s1,border:`1px solid ${T.hl}`,borderRadius:12,padding:20}}>
        <div style={{fontSize:14,fontWeight:600,marginBottom:16,color:T.ink}}>月度营收趋势</div>
        {monthData.slice(-8).map(([m,d])=>(
          <div key={m} style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
            <span style={{width:60,fontSize:12,color:T.ink3,textAlign:'right'}}>{m.slice(5)}月</span>
            <div style={{flex:1,height:28,background:T.s2,borderRadius:6,overflow:'hidden'}}>
              <div style={{height:'100%',borderRadius:6,width:`${Math.max((d.total/maxRev)*100,3)}%`,background:'#e5484d',display:'flex',alignItems:'center',paddingLeft:8,minWidth:60}}>
                <span style={{fontSize:11,color:'#fff',fontWeight:500}}>{fmtMoney(d.total)} · {d.count}个</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
