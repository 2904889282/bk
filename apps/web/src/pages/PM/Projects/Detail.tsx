/** 项目详情 — Hero+KPI+家族+左右栏布局 (规范 §3.5) */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchDashboard, fetchProjectPage, updateProject, type ProjectDashboard, type ProjectVO } from '../../../api/project';
import { ArrowLeftOutlined, DeleteOutlined } from '@ant-design/icons';

const T = { s1:'#0f1011', s2:'#141516', hl:'#23252a', hls:'#34343a', ink:'#f7f8f8', ink2:'#d0d6e0', ink3:'#8a8f98', ink4:'#757880', p:'#5e6ad2', ok:'#27a644', warn:'#d4a030', err:'#e05050', bg:'#010102' };
const RATING: Record<string,string> = { A:'#e5484d', B:'#f5a623', C:'#6b7280' };
const fmtMoney = (n?:number|string) => { const v=Number(n); if(!v||isNaN(v)) return ''; if(v>=10000) return `¥${(v/10000).toFixed(0)}万`; return `¥${v.toFixed(0)}`; };

const wrapper: React.CSSProperties = { position:'fixed',inset:0,zIndex:1000,background:T.bg,color:T.ink,fontFamily:'inherit',overflowY:'auto',padding:'24px 32px 80px' };

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dash, setDash] = useState<ProjectDashboard|null>(null);
  const [loading, setLoading] = useState(true);
  const [familyProjects, setFamilyProjects] = useState<ProjectVO[]>([]);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    Promise.all([
      fetchDashboard(Number(id)),
      fetchProjectPage({pageNum:1,pageSize:500}),
    ]).then(([d, all]) => {
      setDash(d);
      const p = d.project;
      const clean = (n:string) => n.replace(/[-–—]\d+月$/,'').replace(/\d{4,6}/g,'').toLowerCase().trim();
      const fam = (all.records||[]).filter(x => clean(x.projectName) === clean(p.projectName)).sort((a,b) => a.projectName.localeCompare(b.projectName));
      setFamilyProjects(fam);
    }).catch(() => setDash(null)).finally(() => setLoading(false));
  }, [id]);

  const save = async (field:string, value:any) => {
    try { await updateProject(dash!.project.id, {[field]:value} as any); setSaveMsg('已保存'); setTimeout(()=>setSaveMsg(''),2000); }
    catch { setSaveMsg('保存失败'); }
  };

  if (loading) return <div style={wrapper}><div style={{textAlign:'center',paddingTop:'30vh',color:T.ink4}}>加载中...</div></div>;
  if (!dash?.project) return <div style={wrapper}><div style={{textAlign:'center',paddingTop:'30vh',color:T.ink4}}>
    <div style={{fontSize:48,marginBottom:12}}>📭</div>
    <div style={{fontSize:16,marginBottom:8,color:T.ink2}}>项目不存在或无权限</div>
    <button onClick={()=>navigate('/pm/projects')} style={{padding:'8px 20px',borderRadius:8,border:`1px solid ${T.p}`,background:'transparent',color:T.p,cursor:'pointer',fontSize:14,fontFamily:'inherit'}}>返回项目列表</button>
  </div></div>;

  const p = dash.project;
  const milestones = dash.milestones||[];
  const periods = dash.periods||[];
  const weekly = periods[0] as any;

  return (
    <div style={wrapper}>
      {saveMsg && <div style={{position:'fixed',top:16,right:24,zIndex:2000,background:T.s2,border:`1px solid ${T.hl}`,borderRadius:8,padding:'8px 16px',fontSize:13,color:T.ink}}>{saveMsg}</div>}
      <div style={{maxWidth:1100}}>

        {/* ===== Hero Card ===== */}
        <div style={{background:T.s1,border:`1px solid ${T.hl}`,borderRadius:12,padding:'20px 24px',marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
            <button onClick={()=>navigate('/pm/projects')} style={{padding:'6px 14px',borderRadius:8,border:`1px solid ${T.hl}`,background:'transparent',color:T.ink3,cursor:'pointer',fontSize:13,fontFamily:'inherit',display:'flex',alignItems:'center',gap:6}}>
              <ArrowLeftOutlined/> 返回
            </button>
            <input defaultValue={p.projectName} onBlur={e => { if(e.target.value!==p.projectName) save('projectName',e.target.value); }}
              style={{fontSize:22,fontWeight:600,letterSpacing:'-0.4px',color:T.ink,background:'transparent',border:'1px solid transparent',borderRadius:4,padding:'2px 8px',outline:'none',fontFamily:'inherit',flex:1}}
              onFocus={e=>e.target.style.borderColor=T.hls}
            />
            <span style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:24,height:24,borderRadius:5,fontSize:11,fontWeight:700,background:RATING[p.projectLevel]||T.ink4,color:'#fff'}}>{p.projectLevel||'-'}</span>
            <span style={{padding:'3px 12px',borderRadius:999,fontSize:11,fontWeight:500,background:'rgba(94,106,210,0.15)',color:T.p}}>{p.projectStatus||'-'}</span>
          </div>
          <div style={{fontSize:12,color:T.ink4,display:'flex',gap:16,flexWrap:'wrap',marginBottom:12}}>
            <span>{p.projectManager||'-'} · {p.deptBelong||'-'} · {p.startDate||'-'} → {p.expectEndDate||'-'}</span>
          </div>
          {/* KPI 行 */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginTop:16,paddingTop:14,borderTop:`1px solid ${T.hl}`}}>
            {[{l:'预计营收',v:fmtMoney(p.projectAmount),c:T.ink2},{l:'进度',v:`${p.progress||0}%`,c:T.p},{l:'开始日期',v:p.startDate?.slice(0,10)||'-',c:T.ink3},{l:'结束日期',v:p.expectEndDate?.slice(0,10)||'-',c:T.ink3}].map((k,i)=>(<div key={i}><div style={{fontSize:11,color:T.ink4}}>{k.l}</div><div style={{fontSize:18,fontWeight:600,color:k.c}}>{k.v}</div></div>))}
          </div>
          {/* 操作按钮 */}
          <div style={{display:'flex',gap:8,marginTop:14}}>
            <select defaultValue={p.projectStatus} onChange={e=>save('projectStatus',e.target.value)}
              style={{background:T.s2,border:`1px solid ${T.hl}`,borderRadius:8,padding:'6px 10px',fontSize:12,color:T.p,fontFamily:'inherit',cursor:'pointer'}}>
              {['进行中','正式执行','已完成','暂停','终止'].map(s=><option key={s}>{s}</option>)}
            </select>
            <button onClick={()=>navigate('/pm/projects')} style={{padding:'6px 14px',borderRadius:8,border:`1px solid ${T.hl}`,background:'transparent',color:T.ink3,cursor:'pointer',fontSize:12,fontFamily:'inherit'}}>📄 复制</button>
            <button style={{padding:'6px 14px',borderRadius:8,border:`1px solid ${T.err}`,background:'transparent',color:T.err,cursor:'pointer',fontSize:12,fontFamily:'inherit',marginLeft:'auto'}}><DeleteOutlined/> 删除</button>
          </div>
        </div>

        {/* ===== 家族时间轴 ===== */}
        {familyProjects.length > 1 && (
          <div style={{background:T.s1,border:`1px solid ${T.hl}`,borderRadius:12,overflow:'hidden',marginBottom:20}}>
            <div style={{padding:'10px 18px',background:T.s2,borderBottom:`1px solid ${T.hl}`,fontSize:13,fontWeight:600,color:T.ink}}>
              项目组 · {familyProjects[0].projectName.replace(/[-–—]\d+月$/,'')} <span style={{fontWeight:400,fontSize:11,color:T.ink4}}>共{familyProjects.length}月</span>
            </div>
            <div style={{display:'flex',gap:0,overflowX:'auto',padding:'12px 16px'}}>
              {familyProjects.map(fp => {
                const isCurrent = fp.id === p.id;
                const prog = fp.progress||0;
                return (
                  <div key={fp.id} onClick={() => fp.id!==p.id && navigate(`/projects/${fp.id}`)}
                    style={{flexShrink:0,width:72,textAlign:'center',cursor:'pointer',padding:'8px 4px',borderRadius:8,background:isCurrent?'rgba(94,106,210,0.08)':'transparent',border:isCurrent?`1px solid rgba(94,106,210,0.2)`:'1px solid transparent',transition:'background 0.15s'}}
                    onMouseEnter={e=>{if(!isCurrent)e.currentTarget.style.background=T.s2}}
                    onMouseLeave={e=>{if(!isCurrent)e.currentTarget.style.background='transparent'}}>
                    <div style={{fontSize:10,color:isCurrent?T.p:T.ink4,marginBottom:6,fontWeight:500}}>{fp.projectName.split('-').pop()?.replace('月','')||'?'}月</div>
                    <div style={{width:36,height:36,borderRadius:'50%',margin:'0 auto 4px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:600,border:`2px solid ${isCurrent?T.p:T.hl}`,background:prog>=100?T.ok:prog>0?T.p:'transparent',color:'#fff'}}>
                      {prog>=100?'✓':prog>0?`${prog}`:'·'}
                    </div>
                    <div style={{fontSize:9,color:T.ink4}}>{fp.projectStatus||'-'}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== 两列 Grid: 基本信息 + 铁三角 ===== */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
          {/* 基本信息 */}
          <div style={{background:T.s1,border:`1px solid ${T.hl}`,borderRadius:12,padding:20}}>
            <div style={{fontSize:14,fontWeight:600,marginBottom:16,color:T.ink}}>基本信息</div>
            {[
              {l:'项目编号',f:'projectNumber',v:p.projectNumber},
              {l:'开始日期',f:'startDate',v:p.startDate},
              {l:'甲方对接人',f:'clientContact',v:p.clientContact},
              {l:'供应商',f:'supplier',v:p.supplier},
              {l:'预计营收',f:'projectAmount',v:String(p.projectAmount||'')},
            ].map((x,i)=><Field key={i} label={x.l} val={x.v||''} onChange={v=>save(x.f,v)}/>)}
          </div>
          {/* 铁三角 */}
          <div style={{background:T.s1,border:`1px solid ${T.hl}`,borderRadius:12,padding:20}}>
            <div style={{fontSize:14,fontWeight:600,marginBottom:16,color:T.ink}}>铁三角 · 核心团队</div>
            {[
              {l:'一条龙经理',f:'projectManager',v:p.projectManager},
              {l:'交付经理',f:'deliveryManager',v:p.deliveryManager},
              {l:'产品经理',f:'productManager',v:p.productManager},
            ].map((x,i)=><Field key={i} label={x.l} val={x.v||''} onChange={v=>save(x.f,v)}/>)}
          </div>
        </div>

        {/* ===== 两列 Grid: 里程碑 + 进展风险 ===== */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
          {/* 里程碑 */}
          <div style={{background:T.s1,border:`1px solid ${T.hl}`,borderRadius:12,padding:20}}>
            <div style={{fontSize:14,fontWeight:600,marginBottom:16,color:T.ink}}>
              里程碑 {milestones.filter((m:any)=>m.status==='done'||m.status==='已完成').length}/{milestones.length} 完成
            </div>
            {milestones.length===0 && <div style={{color:T.ink4,fontSize:12,padding:'12px 0'}}>暂无里程碑</div>}
            {milestones.map((m:any,i:number)=>(
              <div key={i} style={{background:T.s2,border:`1px solid ${T.hl}`,borderRadius:8,padding:10,marginBottom:8,display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontSize:14}}>{m.status==='done'||m.status==='已完成'?'●':'○'}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:500,color:T.ink}}>{m.name||'新里程碑'}</div>
                  <div style={{fontSize:10,color:T.ink4}}>{m.deadline?`截止${m.deadline}`:''}{m.reward?` · ¥${m.reward}`:''}</div>
                </div>
                <span style={{fontSize:10,padding:'2px 8px',borderRadius:999,background:m.status==='done'?'rgba(39,166,68,0.15)':'rgba(138,143,152,0.1)',color:m.status==='done'?T.ok:T.ink3}}>{m.status==='done'?'已完成':'未完成'}</span>
              </div>
            ))}
          </div>
          {/* 进展与风险 */}
          <div style={{background:T.s1,border:`1px solid ${T.hl}`,borderRadius:12,padding:20}}>
            <div style={{fontSize:14,fontWeight:600,marginBottom:16,color:T.ink}}>进展与风险</div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,color:T.ink4,marginBottom:4}}>进展解读</div>
              <textarea defaultValue={p.description||''} onBlur={e=>{if(e.target.value!==(p.description||'')) save('description',e.target.value);}}
                style={{width:'100%',minHeight:60,background:T.s2,border:`1px solid ${T.hl}`,borderRadius:6,padding:'6px 10px',fontSize:13,color:T.ink,fontFamily:'inherit',resize:'vertical',outline:'none'}}
                onFocus={e=>e.target.style.borderColor=T.hls}/>
            </div>
            <div>
              <div style={{fontSize:11,color:T.ink4,marginBottom:4}}>风险评估</div>
              <textarea defaultValue={p.riskAssessment||''} onBlur={e=>{if(e.target.value!==(p.riskAssessment||'')) save('riskAssessment',e.target.value);}}
                style={{width:'100%',minHeight:60,background:T.s2,border:`1px solid ${T.hl}`,borderRadius:6,padding:'6px 10px',fontSize:13,color:T.ink,fontFamily:'inherit',resize:'vertical',outline:'none'}}
                onFocus={e=>e.target.style.borderColor=T.hls}/>
            </div>
          </div>
        </div>

        {/* ===== 环形进度 + 沟通记录 ===== */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
          <div style={{background:T.s1,border:`1px solid ${T.hl}`,borderRadius:12,padding:20}}>
            <div style={{fontSize:14,fontWeight:600,marginBottom:16,color:T.ink}}>项目进度</div>
            <div style={{display:'flex',alignItems:'center',gap:20}}>
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke={T.hl} strokeWidth="6"/>
                <circle cx="40" cy="40" r="34" fill="none" stroke={T.p} strokeWidth="6" strokeDasharray={`${(p.progress||0)*2.14} 214`} strokeLinecap="round" transform="rotate(-90 40 40)"/>
                <text x="40" y="44" textAnchor="middle" fontSize="18" fontWeight="600" fill={T.ink}>{(p.progress||0)}%</text>
              </svg>
              <div style={{fontSize:12,color:T.ink3}}>{(p.progress||0)>=100?'项目已完成':(p.progress||0)>=50?'项目进行中':'项目初期'}</div>
            </div>
          </div>
          <div style={{background:T.s1,border:`1px solid ${T.hl}`,borderRadius:12,padding:20}}>
            <div style={{fontSize:14,fontWeight:600,marginBottom:16,color:T.ink}}>沟通记录</div>
            <div style={{display:'flex',gap:8,marginBottom:8}}>
              <input placeholder="添加沟通记录..." style={{flex:1,background:T.s2,border:`1px solid ${T.hl}`,borderRadius:6,padding:'6px 10px',fontSize:12,color:T.ink,fontFamily:'inherit',outline:'none'}}
                onFocus={e=>e.target.style.borderColor=T.hls} onBlur={e=>e.target.style.borderColor=T.hl}/>
              <button style={{padding:'6px 14px',borderRadius:6,border:'none',background:T.p,color:'#fff',fontSize:12,fontFamily:'inherit',cursor:'pointer'}}>发送</button>
            </div>
            <div style={{fontSize:12,color:T.ink4}}>暂无沟通记录</div>
          </div>
        </div>

        {/* ===== W1-W4 周进度 ===== */}
        {weekly && (
          <div style={{background:T.s1,border:`1px solid ${T.hl}`,borderRadius:12,padding:20,marginBottom:20}}>
            <div style={{fontSize:14,fontWeight:600,marginBottom:16,color:T.ink}}>W1-W4 周进度</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
              {[1,2,3,4].map(w=>{
                const prog = weekly[`w${w}Progress`]||'';
                const target = weekly[`w${w}Target`]||'';
                return <div key={w} style={{background:T.s2,borderRadius:8,padding:12,textAlign:'center'}}>
                  <div style={{fontSize:10,color:T.ink4}}>W{w}</div>
                  <div style={{fontSize:20,fontWeight:600,color:prog?T.p:T.ink4}}>{prog||'--'}</div>
                  {target&&<div style={{fontSize:10,color:T.ink4,marginTop:2}}>目标 {target}</div>}
                </div>;
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function Field({label,val,onChange}:{label:string;val:string;onChange:(v:string)=>void}){
  return (
    <div style={{display:'flex',alignItems:'center',padding:'5px 0'}}>
      <span style={{width:85,fontSize:12,color:T.ink4,flexShrink:0}}>{label}</span>
      <input defaultValue={val} onBlur={e=>{if(e.target.value!==val) onChange(e.target.value);e.target.style.borderColor='transparent'}}
        style={{flex:1,background:T.s2,border:'1px solid transparent',borderRadius:4,padding:'5px 8px',fontSize:13,color:T.ink2,fontFamily:'inherit',outline:'none'}}
        onFocus={e=>e.target.style.borderColor=T.hls}/>
    </div>
  );
}
