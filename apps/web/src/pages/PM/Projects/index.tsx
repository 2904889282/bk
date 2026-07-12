/**
 * 项目列表 — 表格 + 筛选 + 分组 + 分页 + 批量操作
 * 参考: 项目管理系统_完整规范文档.md §3.3
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProjectPage, createProject, deleteProject, deleteProjectBatch, updateProject, type ProjectVO } from '../../../api/project';
import ContextMenu, { type ContextMenuAction } from '../../../components/project/ContextMenu';
import ProjectModal from '../../../components/project/ProjectModal';
import { T, RATING, fmtMoney } from '../tokens';

/* 项目家族名清洗 */
const cleanFamily = (name: string) =>
  name.replace(/[-–—]\d+月$/, '').replace(/\d{4,6}/g, '').replace(/[-–—]\s*Q\d$/i, '')
      .replace(/[-–—]?\s*副本\s*$/, '').replace(/[（(]副本[）)]/, '').toLowerCase().trim();

/* 评级色标 */
const RatingDot = ({ level }: { level: string }) => (
  <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:20, height:18, borderRadius:4, fontSize:10, fontWeight:600, background:RATING[level] ? `${RATING[level]}22` : 'transparent', color:RATING[level]||T.ink4, border: level==='C'||!RATING[level]?`1px solid ${T.hl}`:'none' }}>{level||'-'}</span>
);
const StatusTag = ({ status }: { status: string }) => {
  const isActive = status === '进行中' || status === '正式执行';
  const isDone = status === '已完成';
  return (
    <span style={{ display:'inline-flex', padding:'3px 9px', borderRadius:999, fontSize:10, fontWeight:500, whiteSpace:'nowrap',
      background: isActive ? 'rgba(94,106,210,0.15)' : isDone ? 'rgba(39,166,68,0.15)' : 'rgba(138,143,152,0.1)',
      color: isActive ? T.p : isDone ? '#5ad478' : T.ink3 }}>{status||'-'}</span>
  );
};

export default function PMProjects() {
  const navigate = useNavigate();
  const PER_PAGE = 15;
  const [projects, setProjects] = useState<ProjectVO[]>([]);
  const [page, setPage] = useState(1);
  const [ratingFilter, setRatingFilter] = useState<string | null>(null);
  const [deptFilter, setDeptFilter] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [groupBy, setGroupBy] = useState<'none'|'family'>('none');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [ctx, setCtx] = useState<{ x:number; y:number; project: ProjectVO } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ProjectVO | null>(null);
  const [density, setDensity] = useState<'comfortable'|'compact'|'spacious'>('comfortable');
  const [presets, setPresets] = useState<{name:string;rating:string|null;dept:string|null;search:string}[]>([]);

  /* 导出 CSV */
  const exportCSV = () => {
    const cols = ['项目名称','一条龙经理','交付经理','产品经理','部门','评级','状态','预计营收','开始日期','结束日期'];
    const keys = ['projectName','projectManager','deliveryManager','productManager','deptBelong','projectLevel','projectStatus','projectAmount','startDate','expectEndDate'];
    const csv = '\uFEFF' + cols.join(',') + '\n' + sorted.map(p => keys.map(k => `"${(p as any)[k]||''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = '项目列表.csv'; a.click();
  };

  /* 复制项目（下月版本） */
  const duplicateProject = async (p: ProjectVO) => {
    const d = new Date(); const nextMonth = `${d.getFullYear()}-${String(d.getMonth()+2).padStart(2,'0')}`;
    const family = cleanFamily(p.projectName);
    try {
      await createProject({
        projectName: `${family}-${d.getMonth()+2}月`, projectManager: p.projectManager, clientName: p.clientName, projectLevel: p.projectLevel,
        projectStatus: '进行中', deptBelong: p.deptBelong, projectAmount: 0, startDate: `${nextMonth}-01`, deliveryManager: p.deliveryManager,
        productManager: p.productManager, clientContact: p.clientContact, supplier: p.supplier, riskAssessment: p.riskAssessment, description: p.description,
      });
      load(page);
    } catch {}
  };

  const load = useCallback(async (p = 1) => {
    try {
      const params: any = { pageNum: p, pageSize: 200 };
      if (search) params.keyword = search;
      if (ratingFilter) params.projectLevel = ratingFilter;
      if (deptFilter) params.deptBelong = deptFilter;
      const res = await fetchProjectPage(params);
      setProjects(res.records || []); setPage(p);
    } catch {}
  }, [search, ratingFilter, deptFilter]);

  useEffect(() => { load(1); }, [load]);

  const depts = useMemo(() => [...new Set(projects.map(p => p.deptBelong).filter(Boolean))], [projects]);

  /* 排序 */
  const sorted = useMemo(() => {
    const d = [...projects];
    if (sortField) {
      d.sort((a:any,b:any) => {
        const va = a[sortField] ?? '', vb = b[sortField] ?? '';
        if (typeof va==='number') return sortDir==='asc'?va-vb:vb-va;
        return sortDir==='asc'?String(va).localeCompare(String(vb)):String(vb).localeCompare(String(va));
      });
    }
    return d;
  }, [projects, sortField, sortDir]);

  /* 分页 */
  const paged = useMemo(() => sorted.slice((page-1)*PER_PAGE, page*PER_PAGE), [sorted, page]);
  const tp = Math.ceil(sorted.length / PER_PAGE);

  /* 分组 */
  const families = useMemo(() => {
    const m = new Map<string, ProjectVO[]>();
    projects.forEach(p => { const f = cleanFamily(p.projectName); if (!m.has(f)) m.set(f,[]); m.get(f)!.push(p); });
    return m;
  }, [projects]);

  /* 批量 */
  const toggleSel = (id: number) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected(selected.size === paged.length ? new Set() : new Set(paged.map(p => p.id)));
  const handleBatchDelete = async () => {
    if (!confirm(`确定要删除选中的 ${selected.size} 个项目吗？`)) return;
    try { await deleteProjectBatch([...selected]); setSelected(new Set()); load(page); } catch {}
  };

  const toggleSort = (field: string) => {
    if (sortField === field) { setSortDir(d => d==='asc'?'desc':'asc'); } else { setSortField(field); setSortDir('asc'); }
  };

  const tgGroup = (g: string) => setCollapsedGroups(prev => { const n = new Set(prev); n.has(g) ? n.delete(g) : n.add(g); return n; });

  /* 右键菜单 */
  const ctxActions: ContextMenuAction[] = ctx ? [
    { label: '查看详情', icon: '📋', onClick: () => navigate(`/projects/${ctx.project.id}`) },
    { label: '复制项目', icon: '📋', onClick: () => duplicateProject(ctx.project), dividerAfter: true },
    { label: '状态: 进行中', onClick: () => updateProject(ctx.project.id, {projectStatus:'进行中'} as any).then(()=>load(page)).catch(()=>{})},
    { label: '状态: 已完成', onClick: () => updateProject(ctx.project.id, {projectStatus:'已完成'} as any).then(()=>load(page)).catch(()=>{})},
    { label: '状态: 暂停', onClick: () => updateProject(ctx.project.id, {projectStatus:'暂停'} as any).then(()=>load(page)).catch(()=>{}), dividerAfter: true},
    { label: '删除项目', icon: '🗑', danger: true, onClick: () => { deleteProject(ctx.project.id).then(()=>load(page)).catch(()=>{}); }},
  ] : [];

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
        <h2 style={{fontSize:20,fontWeight:600,margin:0,letterSpacing:'-0.3px',color:T.ink}}>项目列表</h2>
        <div style={{display:'flex',gap:8}}>
          <button onClick={exportCSV} style={{padding:'7px 16px',borderRadius:8,border:`1px solid ${T.hl}`,background:'transparent',color:T.ink3,fontSize:13,fontFamily:'inherit',cursor:'pointer'}}>📥 导出</button>
          <button onClick={() => { setEditTarget(null); setModalOpen(true); }} style={{padding:'7px 16px',borderRadius:8,border:'none',background:T.p,color:'#fff',fontSize:13,fontFamily:'inherit',cursor:'pointer',fontWeight:500}}>+ 新增项目</button>
        </div>
      </div>

      {/* 评级筛选 pills */}
      <div style={{ display:'flex', gap:6, marginBottom:10, flexWrap:'wrap' }}>
        <button onClick={() => setRatingFilter(null)} style={pillStyle(!ratingFilter)}>全部</button>
        {['A','B','C'].map(r => <button key={r} onClick={() => setRatingFilter(ratingFilter===r?null:r)} style={pillStyle(ratingFilter===r)}>{r}级</button>)}
      </div>

      {/* 部门筛选 + 搜索 */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12, flexWrap:'wrap' }}>
        {depts.slice(0,8).map(d => <button key={d} onClick={() => setDeptFilter(deptFilter===d?null:d)} style={pillStyle(deptFilter===d)}>{d}</button>)}
        <input placeholder="搜索项目..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ marginLeft:'auto', background:T.s2, border:`1px solid ${T.hl}`, borderRadius:8, padding:'7px 12px', fontSize:13, color:T.ink, outline:'none', width:200, fontFamily:'inherit' }} />
        <select value={groupBy} onChange={e => setGroupBy(e.target.value as any)}
          style={{ background:T.s2, border:`1px solid ${T.hl}`, borderRadius:8, padding:'7px 8px', fontSize:12, color:T.ink3, fontFamily:'inherit', cursor:'pointer' }}>
          <option value="none">不分组</option><option value="family">按家族</option>
        </select>
        <select value={density} onChange={e => setDensity(e.target.value as any)}
          style={{ background:T.s2, border:`1px solid ${T.hl}`, borderRadius:8, padding:'7px 8px', fontSize:12, color:T.ink3, fontFamily:'inherit', cursor:'pointer' }}>
          <option value="comfortable">舒适</option><option value="compact">紧凑</option><option value="spacious">宽敞</option>
        </select>
        <button onClick={() => { const p={name:`预设${presets.length+1}`,rating:ratingFilter,dept:deptFilter,search}; setPresets([...presets,p]); }}
          style={{ background:'transparent',border:`1px solid ${T.hl}`,borderRadius:8,padding:'5px 10px',fontSize:11,color:T.ink3,cursor:'pointer',fontFamily:'inherit' }}>💾 保存筛选</button>
        {presets.map((p,i) => (
          <button key={i} onClick={() => { setRatingFilter(p.rating); setDeptFilter(p.dept); setSearch(p.search); }}
            style={{ background:T.s2,border:`1px solid ${T.hl}`,borderRadius:8,padding:'5px 10px',fontSize:11,color:T.ink3,cursor:'pointer',fontFamily:'inherit' }}
            onDoubleClick={() => setPresets(presets.filter((_,j)=>j!==i))}>{p.name}</button>
        ))}
      </div>

      {/* 摘要栏 */}
      <div style={{ display:'flex', alignItems:'center', gap:20, padding:'10px 16px', marginBottom:12, background:T.s2, borderRadius:8, fontSize:12, color:T.ink3 }}>
        {depts.slice(0,5).map(d => <span key={d}><b style={{color:T.ink}}>{d}</b>: {projects.filter(p=>p.deptBelong===d).length}个</span>)}
        <div style={{ display:'flex', alignItems:'center', gap:6, height:18, borderRadius:4, overflow:'hidden', background:T.s1, marginLeft:'auto' }}>
          {['A','B','C'].map(r => {
            const cnt = projects.filter(p => p.projectLevel===r).length;
            return cnt > 0 ? <div key={r} onClick={() => setRatingFilter(r)} style={{ cursor:'pointer', background:RATING[r], minWidth:24, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:600, color:'#fff' }}>{r}{cnt}</div> : null;
          })}
        </div>
        <span style={{color:T.ink4}}>共 {sorted.length} 条 · 第 {page}/{tp||1} 页</span>
      </div>

      {/* 批量操作栏 */}
      {selected.size > 0 && (
        <div style={{ display:'flex', alignItems:'center', gap:10, background:T.s2, border:`1px solid ${T.hl}`, borderRadius:8, padding:'10px 16px', marginBottom:12, animation:'slideDown 0.2s ease' }}>
          <span style={{fontSize:12, color:T.ink2}}>已选 <b style={{color:T.ink}}>{selected.size}</b> 项</span>
          <button onClick={() => setSelected(new Set())} style={btnStyle}>取消</button>
          <button onClick={handleBatchDelete} style={{...btnStyle, color:T.err}}>批量删除</button>
        </div>
      )}

      {/* 表格 */}
      <div style={{ background:T.s1, border:`1px solid ${T.hl}`, borderRadius:12, overflow:'hidden' }}>
        {/* 表头 */}
        <div style={{ display:'grid', gridTemplateColumns:'34px minmax(140px,1.2fr) 90px 80px 72px 80px 72px 52px', padding:'10px 16px', borderBottom:`1px solid ${T.hl}`, fontSize:11, fontWeight:500, color:T.ink4, background:T.s1, position:'sticky', top:0, zIndex:10 }}>
          <span style={{textAlign:'center'}}><input type="checkbox" checked={selected.size>0&&paged.every(p=>selected.has(p.id))} onChange={toggleAll} style={{accentColor:T.p,width:14,height:14}} /></span>
          <span onClick={()=>toggleSort('projectName')} style={{cursor:'pointer', color:sortField==='projectName'?T.p:T.ink4}}>项目名称 {sortField==='projectName'&&(sortDir==='asc'?'▲':'▼')}</span>
          <span>经理</span><span>部门</span><span>评级</span><span>状态</span>
          <span onClick={()=>toggleSort('projectAmount')} style={{cursor:'pointer', color:sortField==='projectAmount'?T.p:T.ink4}}>营收 {sortField==='projectAmount'&&(sortDir==='asc'?'▲':'▼')}</span>
          <span style={{textAlign:'center'}}>操作</span>
        </div>

        {/* 表体 */}
        {groupBy === 'none' ? (
          paged.map((p, idx) => <Row key={p.id} p={p} idx={idx} sel={selected.has(p.id)} onToggle={()=>toggleSel(p.id)} onOpen={()=>navigate(`/projects/${p.id}`)} onCtx={e => { e.preventDefault(); setCtx({x:e.clientX, y:e.clientY, project:p}); }} density={density} />)
        ) : (
          /* 分组视图 */
          Array.from(families.entries()).sort((a,b) => b[1].length - a[1].length).map(([fam, items]) => {
            const isCollapsed = collapsedGroups.has(fam);
            return (
              <div key={fam}>
                <div onClick={() => tgGroup(fam)} style={{ display:'grid', gridTemplateColumns:'34px 1fr auto 52px', padding:'10px 16px', borderBottom:`1px solid ${T.hl}`, fontSize:12, fontWeight:500, cursor:'pointer', color:T.ink2, background:T.s2 }}
                  onMouseEnter={e => { e.currentTarget.style.background = T.hl; }} onMouseLeave={e => { e.currentTarget.style.background = T.s2; }}>
                  <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', transition:'transform 0.15s', transform: isCollapsed?'rotate(-90deg)':'none', fontSize:10, color:T.ink4 }}>▼</span>
                  <span>{fam || '其他项目'}</span>
                  <span style={{ fontSize:11, color:T.ink4 }}>{items.length} 个月</span>
                </div>
                {!isCollapsed && items.map((p, idx) => <Row key={p.id} p={p} idx={idx} sel={selected.has(p.id)} onToggle={()=>toggleSel(p.id)} onOpen={()=>navigate(`/projects/${p.id}`)} onCtx={e => { e.preventDefault(); setCtx({x:e.clientX, y:e.clientY, project:p}); }} isGroup density={density} />)}
              </div>
            );
          })
        )}
        {sorted.length === 0 && <div style={{ textAlign:'center', padding:60, color:T.ink4, fontSize:13 }}>暂无项目</div>}

        {/* 分页 */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderTop:`1px solid ${T.hl}`, fontSize:12, color:T.ink4 }}>
          <span>第 {page}/{tp||1} 页</span>
          <div style={{display:'flex', gap:3}}>
            {page>1 && <PgBtn onClick={()=>{setPage(1);scrollTo(0,0)}}>1</PgBtn>}
            {page>2 && <PgBtn disabled onClick={()=>{}}>…</PgBtn>}
            {Array.from({length: tp}, (_,i) => i+1).filter(n => n >= page-2 && n <= page+2).map(n => <PgBtn key={n} active={n===page} onClick={()=>{setPage(n);scrollTo(0,0)}}>{n}</PgBtn>)}
            {page<tp-1 && <PgBtn disabled onClick={()=>{}}>…</PgBtn>}
            {page<tp && <PgBtn onClick={()=>{setPage(tp);scrollTo(0,0)}}>{tp}</PgBtn>}
          </div>
        </div>
      </div>

      <ProjectModal open={modalOpen} editProject={editTarget} onClose={saved => { setModalOpen(false); setEditTarget(null); if (saved) load(page); }} />
      <ContextMenu x={ctx?.x||0} y={ctx?.y||0} open={!!ctx} actions={ctxActions} onClose={() => setCtx(null)} />
    </div>
  );
}

/* === 行组件 === */
function Row({ p, idx, sel, onToggle, onOpen, onCtx, isGroup, density }: { p: ProjectVO; idx: number; sel: boolean; onToggle: ()=>void; onOpen: ()=>void; onCtx: (e:React.MouseEvent)=>void; isGroup?: boolean; density?: string }) {
  const amount = Number(p.projectAmount);
  const progress = p.progress || 0;
  const py = density==='compact'?'6px 16px':density==='spacious'?'16px 16px':'11px 16px';
  const fs = density==='compact'?12:density==='spacious'?14:13;
  return (
    <div style={{ display:'grid', gridTemplateColumns:'34px minmax(140px,1.2fr) 90px 80px 72px 80px 72px 52px', padding:py, borderBottom:`1px solid ${T.hl}`, cursor:'pointer', fontSize:fs, color:T.ink,
      background: sel ? 'rgba(94,106,210,0.06)' : idx%2===0 ? T.s1 : 'transparent', transition:'background 0.08s', position:'relative', opacity: isGroup ? 0.7 : 1,
    }}
      onDoubleClick={onOpen} onContextMenu={onCtx}
      onMouseEnter={e => { if(!sel) e.currentTarget.style.background = T.s2; }}
      onMouseLeave={e => { if(!sel) e.currentTarget.style.background = idx%2===0 ? T.s1 : 'transparent'; }}>
      <span style={{textAlign:'center'}} onClick={e => e.stopPropagation()}><input type="checkbox" checked={sel} onChange={onToggle} style={{accentColor:T.p,width:14,height:14}} /></span>
      <div>
        <span style={{fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'block'}} onClick={onOpen}>{p.projectName}</span>
        <div style={{display:'flex', alignItems:'center', gap:6, marginTop:2}}>
          <div style={{flex:1, height:4, background:T.s2, borderRadius:2, overflow:'hidden', maxWidth:80}}>
            <div style={{height:'100%', borderRadius:2, width:`${progress}%`, background:T.p, transition:'width 0.3s'}} />
          </div>
          <span style={{fontSize:11, color:T.ink3}}>{progress}%</span>
        </div>
      </div>
      <span style={{fontSize:12, color:T.ink3}}>{p.projectManager||'-'}</span>
      <span style={{fontSize:12, color:T.ink3}}>{p.deptBelong||'-'}</span>
      <span><RatingDot level={p.projectLevel} /></span>
      <span><StatusTag status={p.projectStatus||'-'} /></span>
      <span style={{fontSize:12, fontWeight:500}}>{fmtMoney(amount)||'-'}</span>
      <div onClick={e => e.stopPropagation()} style={{display:'flex',alignItems:'center',gap:2,justifyContent:'center'}}>
        <button onClick={e => { e.stopPropagation(); onOpen(); }} style={btnSm}>详情</button>
      </div>
    </div>
  );
}

/* === 样式工具 === */
const pillStyle = (active: boolean) => ({
  padding:'3px 11px', borderRadius:999, fontSize:11, color:active?T.ink:T.ink3,
  background:active?T.s2:'transparent', border:active?`1px solid ${T.hls}`:`1px solid ${T.hl}`,
  cursor:'pointer', whiteSpace:'nowrap' as const, fontFamily:'inherit',
});
const btnStyle: React.CSSProperties = { padding:'5px 12px', borderRadius:6, border:`1px solid ${T.hl}`, background:'transparent', color:T.ink3, fontSize:12, fontFamily:'inherit', cursor:'pointer' };
const btnSm: React.CSSProperties = { padding:'3px 6px', borderRadius:4, fontSize:11, color:T.ink3, cursor:'pointer', border:'none', background:'transparent', fontFamily:'inherit' };

function PgBtn({ children, active, disabled, onClick }: { children: React.ReactNode; active?: boolean; disabled?: boolean; onClick: ()=>void }) {
  return <button onClick={disabled?undefined:onClick} style={{ padding:'5px 11px', borderRadius:6, border:`1px solid ${T.hl}`, background:active?T.s2:'transparent', color:active?T.ink:disabled?T.ink4:T.ink3, fontSize:12, fontFamily:'inherit', cursor:disabled?'default':'pointer', fontWeight:active?600:400 }}>{children}</button>;
}
