/**
 * 甘特图 — Linear暗色风格 + 项目时间跨度可视化 (规范 §3.9)
 */
import { useEffect, useState, useMemo } from 'react';
import { fetchProjectPage, type ProjectVO } from '../../../api/project';

const T = { s1:'#0f1011', s2:'#141516', hl:'#23252a', hls:'#34343a', ink:'#f7f8f8', ink2:'#d0d6e0', ink3:'#8a8f98', ink4:'#757880', p:'#5e6ad2', ok:'#27a644' };
const RATING_COLORS: Record<string,string> = { A:'#5e6ad2', B:'rgba(208,214,224,0.5)', C:'rgba(138,143,152,0.4)' };
const STATUS_OPTIONS = ['全部', '进行中', '正式执行', '已完成', '暂停'];

export default function PmGantt() {
  const [projects, setProjects] = useState<ProjectVO[]>([]);
  const [statusFilter, setStatusFilter] = useState('全部');
  const [periods, setPeriods] = useState(12);

  useEffect(() => {
    fetchProjectPage({pageNum:1,pageSize:500}).then(r => setProjects(r.records||[])).catch(()=>{});
  }, []);

  const filtered = useMemo(() =>
    statusFilter==='全部' ? projects : projects.filter(p => p.projectStatus===statusFilter),
  [projects, statusFilter]);

  /* 计算月份范围 */
  const months = useMemo(() => {
    const set = new Set<string>();
    const now = new Date();
    for (let i = 0; i < periods; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      set.add(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
    }
    return Array.from(set).sort();
  }, [periods]);

  const getMonthIndex = (dateStr?: string) => {
    if (!dateStr) return -1;
    const d = dateStr.slice(0, 7);
    return months.indexOf(d);
  };

  /* 统计 */
  const activeCount = filtered.filter(p => p.projectStatus==='进行中'||p.projectStatus==='正式执行').length;

  return (
    <div>
      <h2 style={{fontSize:20,fontWeight:600,margin:'0 0 16px',letterSpacing:'-0.3px',color:T.ink}}>甘特图</h2>

      {/* 筛选栏 */}
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        <div style={{display:'flex',gap:4}}>
          {STATUS_OPTIONS.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={pillStyle(statusFilter===s)}>{s}</button>
          ))}
        </div>
        <select value={periods} onChange={e => setPeriods(Number(e.target.value))}
          style={{background:T.s2,border:`1px solid ${T.hl}`,borderRadius:8,padding:'6px 8px',fontSize:12,color:T.ink3,fontFamily:'inherit',cursor:'pointer',marginLeft:'auto'}}>
          <option value={6}>6个月</option><option value={12}>12个月</option><option value={24}>24个月</option>
        </select>
      </div>

      {/* 图例 */}
      <div style={{display:'flex',gap:16,marginBottom:12,fontSize:12,color:T.ink3}}>
        {[{k:'A',c:RATING_COLORS.A},{k:'B',c:RATING_COLORS.B},{k:'C',c:RATING_COLORS.C}].map(r => (
          <span key={r.k} style={{display:'flex',alignItems:'center',gap:6}}><span style={{width:10,height:10,borderRadius:2,background:r.c}} />{r.k}级</span>
        ))}
        <span style={{marginLeft:'auto',color:T.ink4}}>{filtered.length} 个项目 · {activeCount} 进行中</span>
      </div>

      {/* 甘特图 */}
      <div style={{overflowX:'auto',background:T.s1,border:`1px solid ${T.hl}`,borderRadius:12}}>
        {/* 表头 */}
        <div style={{display:'flex',position:'sticky',top:0,zIndex:2,background:T.s1,borderBottom:`1px solid ${T.hl}`}}>
          <div style={{minWidth:180,padding:'8px 12px',fontSize:12,fontWeight:500,color:T.ink4,flexShrink:0}}>项目</div>
          {months.map(m => (
            <div key={m} style={{minWidth:72,textAlign:'center',padding:'8px 0',fontSize:11,color:T.ink4,flexShrink:0}}>{m.slice(5)}月</div>
          ))}
        </div>

        {/* 行 */}

        {filtered.map(p => {
          const startIdx = getMonthIndex(p.startDate);
          const endIdx = getMonthIndex(p.expectEndDate);
          const progress = p.progress || 0;

          return (
            <div key={p.id} style={{display:'flex',borderBottom:`1px solid ${T.hl}`,transition:'background 0.1s',minHeight:40}}
              onMouseEnter={e => e.currentTarget.style.background=T.s2} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              <div style={{minWidth:180,padding:'8px 12px',flexShrink:0,display:'flex',alignItems:'center',gap:6,cursor:'pointer'}}>
                <span style={{width:6,height:6,borderRadius:'50%',background:RATING_COLORS[p.projectLevel]||T.ink4,flexShrink:0}} />
                <span style={{fontSize:12,fontWeight:500,color:T.ink,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.projectName}</span>
              </div>
              {months.map((m, mi) => {
                const inRange = startIdx >= 0 && endIdx >= 0 && mi >= startIdx && mi <= endIdx;
                const isFirst = mi === startIdx;
                const isLast = mi === endIdx;
                return (
                  <div key={m} style={{minWidth:72,height:40,position:'relative',flexShrink:0}}>
                    {inRange && (
                      <div title={`${p.projectName}\n${p.projectManager||''}\n${p.projectStatus||''}`} style={{
                        position:'absolute',top:isFirst?6:6,bottom:6,
                        left: isFirst ? 4 : -12, right: isLast ? 4 : -12,
                        borderRadius:4, background:RATING_COLORS[p.projectLevel]||T.ink4,
                        display:'flex',alignItems:'center',overflow:'hidden',minWidth:4,
                      }}>
                        {/* 进度覆盖 */}
                        {isFirst && <div style={{position:'absolute',top:0,bottom:0,left:0,width:`${progress}%`,background:'rgba(255,255,255,0.15)',borderRadius:4}} />}
                        {isFirst && <span style={{position:'relative',zIndex:1,padding:'0 8px',fontSize:10,color:'#fff',fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.projectName.slice(0,6)}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
        {filtered.length === 0 && <div style={{textAlign:'center',padding:60,color:T.ink4,fontSize:13}}>暂无项目</div>}
      </div>
    </div>
  );
}

const pillStyle = (active: boolean) => ({
  padding:'3px 11px',borderRadius:999,fontSize:11,color:active?T.ink:T.ink3,
  background:active?T.s2:'transparent',border:active?`1px solid ${T.hls}`:`1px solid ${T.hl}`,
  cursor:'pointer',whiteSpace:'nowrap' as const,fontFamily:'inherit',
});
