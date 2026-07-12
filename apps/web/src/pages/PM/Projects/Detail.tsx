/** 项目详情 — 1:1 像素级对齐规范 (renderProjectDetail) */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchDashboard, fetchProjectPage, createProject, updateProject, type ProjectDashboard, type ProjectVO } from '../../../api/project';

const T={s1:'#0f1011',s2:'#141516',hl:'#23252a',hls:'#34343a',ink:'#f7f8f8',ink2:'#d0d6e0',ink3:'#8a8f98',ink4:'#757880',p:'#5e6ad2',ok:'#27a644',warn:'#d4a030',err:'#e05050',bg:'#010102'};
const fm = (n?:number|string)=>{const v=Number(n);if(!v||isNaN(v))return'-';return v>=10000?`¥${(v/10000).toFixed(0)}万`:`¥${v.toFixed(0)}`;};

const inlineInput = (val:string,onChange:(v:string)=>void,style:React.CSSProperties={})=>(
  <input defaultValue={val}
    onBlur={e=>{if(e.target.value!==val)onChange(e.target.value);e.target.style.borderColor='transparent';e.target.style.background=T.s2;}}
    style={{background:T.s2,border:'1px solid transparent',borderRadius:4,padding:'3px 6px',fontSize:12,color:T.ink,fontFamily:'inherit',outline:'none',...style}}
    onFocus={e=>{e.target.style.borderColor=T.hls;e.target.style.background=T.s1;}}
  />
);

const Panel=({title,children}:{title:string;children:React.ReactNode})=>(
  <div style={{background:T.s1,border:`1px solid ${T.hl}`,borderRadius:12,padding:20,height:'fit-content'}}>
    <div style={{fontSize:14,fontWeight:600,marginBottom:16,color:T.ink}}>{title}</div>
    {children}
  </div>
);

export default function ProjectDetail(){
  const {id}=useParams<{id:string}>(); const nav=useNavigate();
  const [d,setD]=useState<ProjectDashboard|null>(null); const [l,setL]=useState(true);
  const [fam,setFam]=useState<ProjectVO[]>([]); const [msg,setMsg]=useState('');

  useEffect(()=>{if(!id){setL(false);return}
    Promise.all([fetchDashboard(+id),fetchProjectPage({pageNum:1,pageSize:500})])
      .then(([d,all])=>{setD(d);const cn=(n:string)=>n.replace(/[-–—]\d+月$/,'').replace(/\d{4,6}/g,'').toLowerCase().trim();
        setFam((all.records||[]).filter(x=>cn(x.projectName)===cn(d.project.projectName)).sort((a,b)=>a.projectName.localeCompare(b.projectName)));})
      .catch(()=>setD(null)).finally(()=>setL(false));},[id]);

  const sv=(f:string,v:any)=>{try{updateProject(d!.project.id,{[f]:v}as any);setMsg('已保存');setTimeout(()=>setMsg(''),2000);}catch{setMsg('保存失败')}};
  const duplicate=async()=>{const p=d!.project;const da=new Date();const nm=`${da.getFullYear()}-${String(da.getMonth()+2).padStart(2,'0')}`;
    try{await createProject({projectName:p.projectName.replace(/\d+月/,(da.getMonth()+2)+'月'),projectManager:p.projectManager,clientName:p.clientName,projectLevel:p.projectLevel,projectStatus:'进行中',deptBelong:p.deptBelong,projectAmount:0,startDate:`${nm}-01`,deliveryManager:p.deliveryManager,productManager:p.productManager,clientContact:p.clientContact,supplier:p.supplier});nav(`/projects/-1`)}catch{};};

  const w:React.CSSProperties={position:'fixed',inset:0,zIndex:1000,background:T.bg,color:T.ink,fontFamily:'inherit',overflowY:'auto',padding:'24px 32px 80px'};
  if(l)return<div style={w}><div style={{textAlign:'center',paddingTop:'30vh',color:T.ink4}}>加载中...</div></div>;
  if(!d?.project)return<div style={w}><div style={{textAlign:'center',paddingTop:'30vh',color:T.ink4}}>
    <div style={{fontSize:48,marginBottom:12}}>📭</div><div style={{fontSize:16,marginBottom:8,color:T.ink2}}>项目不存在或无权限</div>
    <button onClick={()=>nav('/pm/projects')} style={{padding:'8px 20px',borderRadius:8,border:`1px solid ${T.p}`,background:'transparent',color:T.p,cursor:'pointer',fontSize:14,fontFamily:'inherit'}}>返回项目列表</button></div></div>;

  const p=d.project; const ms=d.milestones||[]; const wks=d.periods||[]; const wk=wks[0]as any;
  const prg=p.progress||0; const today=new Date(); const startDay=Math.max(1,Math.ceil((today.getTime()-new Date(p.startDate||today).getTime())/86400000));
  const logs=d.changes||[];

  return (<div style={w}>
    {msg&&<div style={{position:'fixed',top:16,right:24,zIndex:2000,background:T.s2,border:`1px solid ${T.hl}`,borderRadius:8,padding:'8px 16px',fontSize:13,color:T.ink}}>{msg}</div>}
    <div style={{maxWidth:1100}}>

      {/* ① Hero Card */}
      <div style={{background:T.s1,border:`1px solid ${T.hl}`,borderRadius:12,padding:'20px 24px',marginBottom:16}}>
        <div style={{display:'flex',alignItems:'flex-start',gap:12,marginBottom:12}}>
          <button onClick={()=>nav('/pm/projects')} style={{padding:'6px 14px',borderRadius:8,border:`1px solid ${T.hl}`,background:'transparent',color:T.ink3,cursor:'pointer',fontSize:13,fontFamily:'inherit',flexShrink:0,marginTop:2,display:'flex',alignItems:'center',gap:6}}>← 返回</button>
          <div style={{flex:1}}>
            {inlineInput(p.projectName,v=>sv('projectName',v),{fontSize:22,fontWeight:600,letterSpacing:'-0.4px',padding:'4px 8px',borderRadius:6,width:'100%'})}
            <div style={{display:'flex',alignItems:'center',gap:8,marginTop:2}}>
              <select value={p.projectLevel||''} onChange={e=>sv('projectLevel',e.target.value)} style={{background:T.s2,border:`1px solid ${T.hl}`,borderRadius:4,color:T.ink,fontSize:12,fontFamily:'inherit',padding:'4px 8px',cursor:'pointer'}}>
                <option value="">-</option><option value="A">A级</option><option value="B">B级</option><option value="C">C级</option>
              </select>
              <span style={{padding:'3px 12px',borderRadius:999,fontSize:11,fontWeight:500,background:'rgba(94,106,210,0.15)',color:T.p}}>{p.projectStatus||'-'}</span>
              {[p.projectManager,p.deptBelong].filter(Boolean).join(' · ')||<span style={{opacity:0.4}}>暂无详情</span>}
            </div>
          </div>
          <div style={{flexShrink:0,display:'flex',gap:8}}>
            <select value={p.projectStatus||''} onChange={e=>sv('projectStatus',e.target.value)} style={{background:T.s2,border:`1px solid ${T.hl}`,borderRadius:8,color:T.ink,fontSize:13,fontFamily:'inherit',padding:'8px 14px',cursor:'pointer'}}>
              <option value="">更新状态...</option><option value="正式执行">正式执行</option><option value="进行中">进行中</option><option value="已完成">已完成</option><option value="暂停">暂停</option>
            </select>
            <button onClick={duplicate} style={{background:'transparent',color:T.ink3,border:`1px solid ${T.hl}`,borderRadius:8,fontSize:13,padding:'8px 14px',cursor:'pointer',fontFamily:'inherit'}}>📄</button>
            <button onClick={()=>{if(confirm('确定删除该项目？')){}} } style={{background:'transparent',color:T.err,border:'1px solid rgba(200,60,60,0.3)',borderRadius:8,fontSize:13,padding:'8px 14px',cursor:'pointer',fontFamily:'inherit'}}>🗑</button>
          </div>
        </div>
        {/* KPI行 */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginTop:16,paddingTop:14,borderTop:`1px solid ${T.hl}`,textAlign:'center'}}>
          {[{l:'预计营收',v:fm(p.projectAmount),c:T.p},{l:'实际营收',v:'--',c:T.ink3},{l:'目标进度',v:`${prg}%`,c:prg>=100?T.ok:prg>0?T.p:T.ink3},{l:'开工天数',v:`${startDay}天`,c:T.ink3}].map((k,i)=>(
            <div key={i}><div style={{fontSize:10,color:T.ink4,marginBottom:2}}>{k.l}</div><div style={{fontSize:18,fontWeight:600,color:k.c}}>{k.v}</div></div>
          ))}</div>
        {/* 环形进度SVG */}
        <div style={{display:'flex',justifyContent:'center',padding:'16px 0 0'}}>
          <svg width="44" height="44" viewBox="0 0 44 44"><circle cx="22" cy="22" r="18" fill="none" stroke={T.hl} strokeWidth="4"/><circle cx="22" cy="22" r="18" fill="none" stroke={T.p} strokeWidth="4" strokeDasharray={`${prg*1.13} 113`} strokeLinecap="round" transform="rotate(-90 22 22)"/><text x="22" y="26" textAnchor="middle" fontSize="10" fontWeight="600" fill={T.ink}>{prg}%</text></svg>
        </div>
      </div>

      {/* ② Family Panel */}
      {fam.length>1&&(<div style={{background:T.s1,border:`1px solid ${T.hl}`,borderRadius:12,overflow:'hidden',marginBottom:16}}>
        <div style={{padding:'10px 16px',background:T.s2,borderBottom:`1px solid ${T.hl}`,fontSize:13,fontWeight:600,color:T.ink,display:'flex',justifyContent:'space-between'}}>
          <span>项目组 · {fam[0].projectName.replace(/[-–—]\d+月$/,'')} <span style={{fontWeight:400,fontSize:11,color:T.ink4}}>共{fam.length}月</span></span>
          <span style={{fontSize:11,color:T.ink4,fontWeight:400}}>总营收 {fm(fam.reduce((s,x)=>s+Number(x.projectAmount||0),0))} · 均{Math.round(fam.reduce((s,x)=>s+(x.progress||0),0)/fam.length)}% · 完成 {fam.filter(x=>x.projectStatus==='已完成').length}月</span>
        </div>
        <div style={{display:'flex',gap:0,overflowX:'auto',padding:'12px 16px'}}>
          {fam.map(fp=>{const cur=fp.id===p.id;const pp=fp.progress||0;
            return(<div key={fp.id} onClick={()=>{if(!cur)nav(`/projects/${fp.id}`)}} style={{flexShrink:0,width:72,textAlign:'center',cursor:cur?'default':'pointer',padding:'8px 4px',borderRadius:8,background:cur?'rgba(94,106,210,0.08)':'transparent',border:cur?'1px solid rgba(94,106,210,0.2)':'1px solid transparent'}}
              onMouseEnter={e=>{if(!cur)e.currentTarget.style.background=T.s2}} onMouseLeave={e=>{if(!cur)e.currentTarget.style.background='transparent'}}>
              <div style={{fontSize:10,color:cur?T.p:T.ink4,marginBottom:6,fontWeight:cur?600:500}}>{fp.projectName.split('-').pop()?.replace('月','')||'?'}月</div>
              <div style={{width:36,height:36,borderRadius:'50%',margin:'0 auto 4px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:600,border:`2px solid ${cur?T.p:T.hl}`,background:pp>=100?T.ok:pp>0?T.p:'transparent',color:'#fff'}}>{pp>=100?'✓':pp>0?`${pp}`:'·'}</div>
              <div style={{fontSize:9,color:T.ink4}}>{fp.projectStatus||'-'}{cur&&<div style={{fontSize:9,color:T.p}}>当前</div>}</div>
            </div>);})}
        </div>
      </div>)}

      {/* ③④⑤ 双列 */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        {/* 基本信息 */}
        <Panel title="基本信息">
          {[{l:'项目编号',f:'projectNumber',v:p.projectNumber},{l:'一条龙经理',f:'projectManager',v:p.projectManager},{l:'交付经理',f:'deliveryManager',v:p.deliveryManager},{l:'产品经理',f:'productManager',v:p.productManager},{l:'部门',f:'deptBelong',v:p.deptBelong},{l:'甲方对接人',f:'clientContact',v:p.clientContact},{l:'供应商',f:'supplier',v:p.supplier},{l:'客户信息',f:'clientName',v:p.clientName},
          ].map((x,i)=><div key={i} style={{display:'flex',alignItems:'center',padding:'4px 0'}}><span style={{width:85,fontSize:12,color:T.ink4,flexShrink:0}}>{x.l}</span>{inlineInput(x.v||'',v=>sv(x.f,v))}</div>)}
        </Panel>
        {/* 铁三角 */}
        <Panel title="铁三角 · 核心团队">
          {[{name:p.projectManager,role:'一条龙经理',icon:'👤'},{name:p.deliveryManager,role:'交付经理',icon:'🚀'},{name:p.productManager,role:'产品经理',icon:'📋'}].map((m,i)=>(
            <div key={i} style={{marginBottom:i<2?12:0,paddingBottom:i<2?12:0,borderBottom:i<2?`1px solid ${T.hl}`:'none'}}>
              <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
                <div style={{width:32,height:32,borderRadius:'50%',background:'rgba(94,106,210,0.15)',border:'1px solid rgba(94,106,210,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:T.p,flexShrink:0}}>{(m.name||'未')?.slice(-2)}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:500,color:T.ink}}>{m.name||'未分配'}</div>
                  <div style={{fontSize:10,color:T.ink4}}>{m.role}</div>
                  <textarea placeholder={`描述${m.role}工作内容...`} defaultValue={m.name?m.name:'用户'} onBlur={e=>{if(e.target.value)sv('description',e.target.value);}}
                    style={{width:'100%',minHeight:48,background:T.s2,border:`1px solid ${T.hl}`,borderRadius:6,padding:'6px 8px',fontSize:12,color:T.ink2,fontFamily:'inherit',resize:'vertical',outline:'none',marginTop:6}}/>
                </div>
              </div>
            </div>
          ))}</Panel>
      </div>

      {/* 里程碑 | 进展风险 */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        <Panel title={`里程碑 ${ms.filter((m:any)=>m.status==='done'||m.status==='已完成').length}/${ms.length} 完成`}>
          {ms.length===0&&<div style={{color:T.ink4,fontSize:12,padding:'12px 0'}}>暂无里程碑</div>}
          {ms.map((m:any,i:number)=>{const done=m.status==='done'||m.status==='已完成';
            return(<div key={i} style={{marginBottom:6,padding:'8px 10px',border:`1px solid ${T.hl}`,borderRadius:6,borderLeft:`3px solid ${done?T.ok:T.warn}`,background:done?'rgba(39,166,68,0.04)':T.s1}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:(m.deadline||m.reward)?4:0}}>
                <span style={{fontSize:11,color:done?T.ok:T.warn}}>{done?'●':'○'}</span>
                {inlineInput(m.name||'新里程碑',()=>{}, {fontSize:12,fontWeight:500,flex:1})}
                <select defaultValue={m.status||''} onChange={()=>{}} style={{background:T.s2,border:`1px solid ${T.hl}`,borderRadius:4,color:T.ink,fontSize:10,padding:'2px 6px',cursor:'pointer',fontFamily:'inherit',marginLeft:'auto'}}>
                  <option value="未完成">未完成</option><option value="已完成">已完成</option>
                </select>
              </div>
              <div style={{display:'flex',gap:6,paddingLeft:19}}>
                <input defaultValue={m.deadline||''} placeholder="截止日" type="date" onBlur={()=>{}} style={{flex:1,background:T.s2,border:'1px solid transparent',borderRadius:4,padding:'2px 4px',fontSize:10,color:T.ink,fontFamily:'inherit',outline:'none'}}/>
                <input defaultValue={m.reward||''} placeholder="奖励" onBlur={()=>{}} style={{flex:1,background:T.s2,border:'1px solid transparent',borderRadius:4,padding:'2px 4px',fontSize:10,color:T.ink,fontFamily:'inherit',outline:'none'}}/>
              </div>
            </div>);})}
          {ms.length<6&&<div onClick={()=>{}} style={{padding:'6px 10px',textAlign:'center',color:T.ink4,fontSize:11,cursor:'pointer',border:'1px dashed '+T.hl,borderRadius:6,marginTop:4}}>+ 添加里程碑 ({ms.length}/6)</div>}
        </Panel>
        <Panel title="进展与风险">
          <div style={{marginBottom:8}}><div style={{fontSize:11,color:T.ink4,marginBottom:4}}>风险评估</div>
            <input defaultValue={p.riskAssessment||''} onBlur={e=>{sv('riskAssessment',e.target.value);e.target.style.borderColor=T.hl}} placeholder="输入风险评估..." style={{width:'100%',background:T.s2,border:`1px solid ${T.hl}`,borderRadius:6,padding:'6px 10px',fontSize:12,color:T.ink,fontFamily:'inherit',outline:'none'}}
              onFocus={e=>e.target.style.borderColor=T.hls}/></div>
          <div style={{marginTop:8}}><div style={{fontSize:11,color:T.ink4,marginBottom:4}}>进展解读</div>
            <textarea defaultValue={p.description||''} onBlur={e=>{sv('description',e.target.value);e.target.style.borderColor=T.hl}} placeholder="描述项目进展..." style={{width:'100%',minHeight:70,background:T.s2,border:`1px solid ${T.hl}`,borderRadius:6,padding:'6px 10px',fontSize:12,color:T.ink,fontFamily:'inherit',resize:'vertical',outline:'none'}}
              onFocus={e=>e.target.style.borderColor=T.hls}/></div>
          <div style={{fontSize:10,color:T.ink4,marginTop:6}}>修改后自动保存</div>
        </Panel>
      </div>

      {/* W1-W4 */}
      {wk&&(<div style={{background:T.s1,border:`1px solid ${T.hl}`,borderRadius:12,padding:20,marginBottom:16}}>
        <div style={{fontSize:14,fontWeight:600,marginBottom:16,color:T.ink}}>W1-W4 周进度</div>
        <div style={{display:'flex',gap:8}}>
          {[1,2,3,4].map(w=>{const p=wk[`w${w}Progress`]||'';const t=wk[`w${w}Target`]||'';const v=Number(p||0);const tv=Number(t||0);const done=v>=tv&&tv>0;
            return(<div key={w} style={{flex:1,minWidth:0,textAlign:'center',padding:'4px 6px',borderRadius:6,border:`1px solid ${T.hl}`,background:T.s2}}>
              <div style={{fontSize:10,color:T.ink4,marginBottom:4}}>W{w}</div>
              <input type="number" defaultValue={p} placeholder="%" style={{textAlign:'center',width:'100%',fontSize:12,fontWeight:600,padding:4,border:`1px solid ${T.hl}`,borderRadius:4,background:T.s1,color:done?T.ok:v>0&&v<tv?T.warn:T.ink3,fontFamily:'inherit',outline:'none'}}/>
              <div style={{fontSize:9,color:T.ink4,marginTop:2}}>目标 {t||'-'}</div>
            </div>);})}
        </div>
        <div style={{fontSize:10,color:T.ink4,marginTop:8}}>输入进度后自动保存 · 绿色=达标 · 黄=未达标</div>
      </div>)}

      {/* ⑥ 操作日志 */}
      <div style={{background:T.s1,border:`1px solid ${T.hl}`,borderRadius:12,padding:20}}>
        <div style={{fontSize:14,fontWeight:600,marginBottom:16,color:T.ink}}>操作日志 <span style={{fontWeight:400,fontSize:12,color:T.ink4}}>{logs.length}条</span></div>
        {logs.length===0&&<div style={{textAlign:'center',padding:20,color:T.ink4,fontSize:12}}>暂无操作记录</div>}
        {logs.slice(-6).reverse().map((l:any,i:number)=>(
          <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 0',borderBottom:`1px solid ${T.hl}`,fontSize:12}}>
            <span style={{color:T.ink4,width:52,flexShrink:0}}>{l.createTime?.slice(5)}</span>
            <span style={{color:T.ink3}}>{l.actionSummary||l.action||'-'}</span>
          </div>
        ))}
      </div>
    </div>
  </div>);
}
