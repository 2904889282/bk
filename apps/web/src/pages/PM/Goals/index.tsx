/**
 * 关键目标 — 批量进度表 (进度填写 / 目标设定 双模式)
 * 参考: 项目管理系统_完整规范文档.md §3.4
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProjectPage, fetchPeriods, savePeriod, type ProjectVO, type ProjectPeriod } from '../../../api/project';

const T = {
  s1:'#0f1011', s2:'#141516', hl:'#23252a', hls:'#34343a',
  ink:'#f7f8f8', ink2:'#d0d6e0', ink3:'#8a8f98', ink4:'#757880',
  p:'#5e6ad2', ok:'#27a644', warn:'#d4a030',
};

/* 计算当前周 (1-4) 基于项目月份 */
function getCurrentWeek(month?: string): number {
  if (!month) return 1;
  const d = new Date(month + '-01');
  const now = new Date();
  if (now.getMonth() !== d.getMonth() || now.getFullYear() !== d.getFullYear()) return 4;
  return Math.min(Math.ceil(now.getDate() / 7), 4);
}

export default function PMGoals() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectVO[]>([]);
  const [periods, setPeriods] = useState<Record<number, ProjectPeriod>>({});
  const [mode, setMode] = useState<'progress'|'target'>('progress');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  });

  useEffect(() => {
    fetchProjectPage({ pageNum: 1, pageSize: 200 }).then(res => {
      const items = (res.records || []).filter(p => p.projectStatus !== '终止');
      setProjects(items);
      items.forEach(p => {
        fetchPeriods(p.id).then(ps => {
          const current = ps.find(x => x.periodMonth === selectedMonth);
          if (current) setPeriods(prev => ({...prev, [p.id]: current}));
        }).catch(() => {});
      });
    }).catch(() => {});
  }, [selectedMonth]);

  const weeks = ['W1','W2','W3','W4'];
  const cw = getCurrentWeek(selectedMonth);

  /* 快速保存 */
  const save = async (projectId: number, field: string, value: string) => {
    const existing = periods[projectId];
    const data: any = existing ? {...existing} : { projectId, periodMonth: selectedMonth };
    data[field] = value;
    try {
      const saved = await savePeriod(data);
      setPeriods(prev => ({...prev, [projectId]: saved}));
    } catch {}
  };

  /* 获取 W 值 */
  const getW = (p: ProjectPeriod | undefined, w: number, type: 'target'|'progress') => {
    if (!p) return '';
    const prefix = type === 'target' ? 'w' : 'w';
    const suffix = type === 'target' ? 'Target' : 'Progress';
    return (p as any)[`${prefix}${w}${suffix}`] || '';
  };

  /* 状态判断 */
  const rowStatus = (p: ProjectPeriod | undefined) => {
    if (!p) return 'empty';
    const vals = [1,2,3,4].map(w => getW(p, w, 'progress')).filter(Boolean);
    if (vals.length === 0) return 'empty';
    if (vals.length === 4) return 'done';
    return 'partial';
  };

  return (
    <div>
      <h2 style={{ fontSize:20, fontWeight:600, margin:'0 0 16px', letterSpacing:'-0.3px', color:T.ink }}>关键目标</h2>

      {/* 顶栏: 月份选择 + 模式切换 */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
          style={{ background:T.s2, border:`1px solid ${T.hl}`, borderRadius:8, padding:'7px 12px', fontSize:13, color:T.ink, fontFamily:'inherit', outline:'none' }} />
        <div style={{ display:'flex', background:T.s1, borderRadius:999, padding:2 }}>
          {[{k:'progress'as const,l:'进度填写'},{k:'target'as const,l:'目标设定'}].map(item => (
            <button key={item.k} onClick={() => setMode(item.k)} style={{
              padding:'6px 16px', borderRadius:999, border:'none', fontSize:12, fontFamily:'inherit', cursor:'pointer',
              background: mode===item.k ? T.s2 : 'transparent', color: mode===item.k ? T.ink : T.ink3, fontWeight: mode===item.k ? 500 : 400,
            }}>{item.l}</button>
          ))}
        </div>
        <span style={{ marginLeft:'auto', fontSize:12, color:T.ink4 }}>{projects.length} 个项目 · 第{cw}周</span>
      </div>

      {/* 表头 */}
      <div style={{ background:T.s1, border:`1px solid ${T.hl}`, borderRadius:12, overflow:'hidden' }}>
        <div style={{ display:'grid', gridTemplateColumns:'minmax(160px,1.3fr) 80px 80px 80px 80px 72px', padding:'10px 16px', borderBottom:`1px solid ${T.hl}`, fontSize:11, fontWeight:500, color:T.ink4 }}>
          <span>项目</span>
          {weeks.map((w, i) => (
            <span key={w} style={{ textAlign:'center', color: i+1===cw ? T.p : T.ink4, fontWeight: i+1===cw ? 600 : 500 }}>
              {w}{i+1===cw ? ' 本周' : ''}
            </span>
          ))}
          <span style={{textAlign:'center'}}>状态</span>
        </div>

        {projects.map(p => {
          const period = periods[p.id];
          const status = rowStatus(period);
          return (
            <div key={p.id} style={{
              display:'grid', gridTemplateColumns:'minmax(160px,1.3fr) 80px 80px 80px 80px 72px',
              padding:'10px 16px', borderBottom:`1px solid ${T.hl}`, fontSize:13, alignItems:'center',
              background: 'transparent', transition:'background 0.08s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = T.s2; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
              <span style={{ fontWeight:500, color:T.ink, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', cursor:'pointer' }}
                onClick={() => navigate(`/projects/${p.id}`)}>{p.projectName}</span>
              {weeks.map((_, i) => {
                const w = i + 1;
                const field = mode === 'target' ? `w${w}Target` : `w${w}Progress`;
                const val = getW(period, w, mode === 'target' ? 'target' : 'progress');
                const isFuture = w > cw && mode === 'progress';
                const isCurrent = w === cw && mode === 'progress';
                const isPast = w < cw && mode === 'progress';

                if (mode === 'target') {
                  return <input key={w} defaultValue={val} onBlur={e => { if (e.target.value !== val) save(p.id, field, e.target.value); }}
                    placeholder="--" style={cellStyle(isCurrent)} />;
                }
                if (isFuture) return <span key={w} style={{textAlign:'center', color:T.ink4, fontSize:16}}>--</span>;
                if (isPast) return <span key={w} style={{textAlign:'center', color:T.ok, fontWeight:600, fontSize:16}}>{val||'--'}</span>;
                return <input key={w} defaultValue={val} onBlur={e => { if (e.target.value !== val) save(p.id, field, e.target.value); }}
                  placeholder="填写" style={{...cellStyle(true), border:`1px solid ${T.p}`, background:'rgba(94,106,210,0.08)'}} />;
              })}
              <span style={{textAlign:'center'}}>
                <span style={{
                  display:'inline-flex', padding:'2px 10px', borderRadius:999, fontSize:10, fontWeight:500,
                  background: status==='done'?'rgba(39,166,68,0.15)':status==='partial'?'rgba(212,160,48,0.15)':'rgba(138,143,152,0.1)',
                  color: status==='done'?T.ok:status==='partial'?T.warn:T.ink4,
                }}>{status==='done'?'✓ 完成':status==='partial'?'进行中':'待填'}</span>
              </span>
            </div>
          );
        })}
        {projects.length === 0 && <div style={{textAlign:'center', padding:60, color:T.ink4, fontSize:13}}>暂无项目</div>}
      </div>
    </div>
  );
}

const cellStyle = (highlight: boolean) => ({
  width:'100%', textAlign:'center' as const, background: T.s2, border:`1px solid ${T.hl}`, borderRadius:6,
  padding:'6px 4px', fontSize:14, color: highlight ? T.ink : T.ink3, fontFamily:'inherit', outline:'none',
});
