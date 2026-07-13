/** PM 项目列表 — 1:1 像素级对齐原 HTML 规范 (renderList) */
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../store/useTheme';
import { fetchProjectPage, type ProjectVO } from '../../../api/project';

const darkTokens = { s1: '#0f1011', s2: '#141516', s3: '#18191a', hl: '#23252a', hls: '#34343a', ink: '#f7f8f8', ink2: '#d0d6e0', ink3: '#8a8f98', ink4: '#757880', p: '#5e6ad2', ok: '#27a644', warn: '#d4a030', err: '#e05050', bg: '#010102' };
const lightTokens = { s1: '#fff', s2: '#f5f5f5', s3: '#e5e5e5', hl: '#e5e5e5', hls: '#c5c5c5', ink: '#171717', ink2: '#444', ink3: '#737373', ink4: '#999', p: '#5e6ad2', ok: '#16a34a', warn: '#ca8a04', err: '#dc2626', bg: '#fafafa' };
const fr = (v: number) => v >= 10000 ? (v / 10000).toFixed(0) + '万' : (v || 0).toLocaleString();
const fmtMonth = (d: string) => d ? parseInt(d.slice(5, 7)) + '月' : '-';
const fmtDate = (d: string) => { if (!d) return '-'; const m = d.match(/(\d{4})-(\d{2})-(\d{2})/); return m ? parseInt(m[2]) + '/' + parseInt(m[3]) : d; };

const STATUS_OPTIONS = ['', '进行中', '正式执行', '已完成', '已暂停'];
const RATING_OPTIONS = ['', 'A', 'B', 'C'];

let T = lightTokens;

export default function PmProjects() {
  const nav = useNavigate();
  const { isDark } = useTheme();
  T = isDark ? darkTokens : lightTokens;
  const [projects, setProjects] = useState<ProjectVO[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [rating, setRating] = useState('');
  const [manager, setManager] = useState('');
  const [dept, setDept] = useState('');
  const [keyword, setKeyword] = useState('');
  const [group, setGroup] = useState('');
  const [density, setDensity] = useState<'compact' | 'comfortable' | 'spacious'>('comfortable');
  const [showColConfig, setShowColConfig] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [sortField, setSortField] = useState<'name' | 'manager' | 'revenue' | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    (async () => {
      try {
        const r = await fetchProjectPage({ pageNum: 1, pageSize: 500 });
        setProjects(r.records || []);
      } catch { setProjects([]); }
      setLoading(false);
    })();
  }, []);

  const managers = useMemo(() => [...new Set(projects.map(p => p.projectManager).filter(Boolean))].sort(), [projects]);

  const filtered = useMemo(() => {
    let d = projects;
    if (status) d = d.filter(p => p.projectStatus === status);
    if (rating) d = d.filter(p => p.projectLevel === rating);
    if (manager) d = d.filter(p => p.projectManager === manager);
    if (dept) d = d.filter(p => p.deptBelong === dept);
    if (keyword) d = d.filter(p => (p.projectName || '').includes(keyword) || (p.clientName || '').includes(keyword));
    if (sortField) {
      d = [...d].sort((a, b) => {
        const av = sortField === 'name' ? (a.projectName || '') : sortField === 'manager' ? (a.projectManager || '') : (a.projectAmount || 0);
        const bv = sortField === 'name' ? (b.projectName || '') : sortField === 'manager' ? (b.projectManager || '') : (b.projectAmount || 0);
        const r = av > bv ? 1 : av < bv ? -1 : 0;
        return sortDir === 'asc' ? r : -r;
      });
    }
    return d;
  }, [projects, status, rating, manager, dept, keyword, sortField, sortDir]);

  const grouped = useMemo(() => {
    if (!group) return [{ name: '', items: filtered }];
    const map: Record<string, ProjectVO[]> = {};
    filtered.forEach(p => {
      const k = (p as any)[group] || '未分配';
      if (!map[k]) map[k] = [];
      map[k].push(p);
    });
    return Object.entries(map).map(([k, v]) => ({ name: k, items: v }));
  }, [filtered, group]);

  if (loading) return <div style={{ color: T.ink4, padding: 40, textAlign: 'center', background: T.bg, minHeight: '100%' }}>加载中...</div>;

  const rowStyle = (isFirst: boolean) => ({
    display: 'grid',
    gridTemplateColumns: '34px minmax(140px,1.2fr) 100px 90px 80px 90px 72px 80px 72px 52px',
    alignItems: 'center',
    padding: density === 'compact' ? '6px 16px' : density === 'spacious' ? '16px' : '11px 16px',
    borderBottom: `1px solid ${T.hl}`,
    cursor: 'pointer',
    transition: 'background 0.08s',
    fontSize: density === 'compact' ? 12 : 13,
    background: isFirst ? T.s1 : 'transparent',
  });

  const totalRev = filtered.reduce((s, p) => s + (p.projectAmount || 0), 0);

  return (
    <div style={{ padding: 24, minHeight: '100%', background: T.bg }}>
      {/* 标题 */}
      <div style={{ fontSize: 20, fontWeight: 600, color: T.ink, marginBottom: 16, letterSpacing: -0.3 }}>项目列表</div>

      {/* 工具栏 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: T.ink4 }}>状态:</span>
        <PillsUI T={T}>
          {STATUS_OPTIONS.map(s => <PillUI T={T} key={s || 'all'} active={status === s} onClick={() => setStatus(s)}>{s || '全部'}</PillUI>)}
        </PillsUI>
        <span style={{ fontSize: 12, color: T.ink4 }}>评级:</span>
        <PillsUI T={T}>
          {RATING_OPTIONS.map(r => <PillUI T={T} key={r || 'all'} active={rating === r} onClick={() => setRating(r)}>{r ? r + '级' : '全部'}</PillUI>)}
        </PillsUI>
        <span style={{ fontSize: 12, color: T.ink4 }}>经理:</span>
        <PillsUI T={T}>
          <PillUI T={T} active={!manager} onClick={() => setManager('')}>全部</PillUI>
          {managers.slice(0, 5).map(m => <PillUI T={T} key={m} active={manager === m} onClick={() => setManager(m)}>{m}</PillUI>)}
        </PillsUI>
        <span style={{ fontSize: 12, color: T.ink4 }}>分组:</span>
        <PillsUI T={T}>
          {[{ v: '', l: '不分组' }, { v: 'deptBelong', l: '按部门' }, { v: 'projectStatus', l: '按状态' }, { v: 'projectLevel', l: '按评级' }].map(o =>
            <PillUI T={T} key={o.v} active={group === o.v} onClick={() => setGroup(o.v)}>{o.l}</PillUI>
          )}
        </PillsUI>
        <input
          placeholder="搜索项目名称、客户公司"
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          style={{ background: T.s1, border: `1px solid ${T.hl}`, borderRadius: 6, padding: '5px 10px', fontSize: 12, color: T.ink, fontFamily: 'inherit', outline: 'none', minWidth: 200 }}
        />
        <span style={{ fontSize: 12, color: T.ink4, marginLeft: 6 }}>密度:</span>
        <PillsUI T={T}>
          {(['compact', 'comfortable', 'spacious'] as const).map(d =>
            <PillUI T={T} key={d} active={density === d} onClick={() => setDensity(d)}>
              {d === 'compact' ? '≡' : d === 'comfortable' ? '☰' : '≣'}
            </PillUI>
          )}
        </PillsUI>
        <button onClick={() => { setStatus(''); setRating(''); setManager(''); setDept(''); setKeyword(''); setGroup(''); setSortField(null); setSelected(new Set()); }}
          style={{ background: 'transparent', color: T.ink3, border: `1px solid ${T.hl}`, borderRadius: 99, padding: '3px 11px', fontSize: 11, fontFamily: 'inherit', cursor: 'pointer', marginLeft: 'auto' }}>重置</button>
        <button onClick={() => setShowColConfig(!showColConfig)} style={{ background: 'transparent', color: T.ink3, border: `1px solid ${T.hl}`, borderRadius: 99, padding: '3px 11px', fontSize: 11, fontFamily: 'inherit', cursor: 'pointer' }}>⚙ 列</button>
        <button onClick={() => nav('/projects/-1')} style={{ background: T.p, color: '#fff', border: `1px solid ${T.p}`, borderRadius: 99, padding: '3px 11px', fontSize: 11, fontFamily: 'inherit', cursor: 'pointer' }}>+ 新增</button>
      </div>

      {/* 摘要栏 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '10px 16px', marginBottom: 12, background: T.s2, borderRadius: 8, fontSize: 12, color: T.ink3 }}>
        <span>共 <span style={{ fontWeight: 600, color: T.ink }}>{filtered.length}</span> 个项目</span>
        <span>预计营收 <span style={{ fontWeight: 600, color: T.ink }}>¥{fr(totalRev)}</span></span>
        <span>已完成 <span style={{ fontWeight: 600, color: T.ok }}>{filtered.filter(p => p.projectStatus === '已完成').length}</span></span>
        <span>进行中 <span style={{ fontWeight: 600, color: T.p }}>{filtered.filter(p => p.projectStatus === '正式执行' || p.projectStatus === '进行中').length}</span></span>
      </div>

      {/* 批量操作条 */}
      {selected.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: T.s2, border: `1px solid ${T.hl}`, borderRadius: 8, padding: '10px 16px', marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: T.ink }}>已选 {selected.size} 项</span>
          <button onClick={() => { if (confirm('确定删除选中项目？')) { setProjects(prev => prev.filter(p => !selected.has(p.id))); setSelected(new Set()); } }}
            style={{ background: 'transparent', color: T.err, border: `1px solid rgba(224,80,80,0.3)`, borderRadius: 99, padding: '3px 11px', fontSize: 11, fontFamily: 'inherit', cursor: 'pointer' }}>批量删除</button>
          <button onClick={() => setSelected(new Set())} style={{ background: 'transparent', color: T.ink3, border: `1px solid ${T.hl}`, borderRadius: 99, padding: '3px 11px', fontSize: 11, fontFamily: 'inherit', cursor: 'pointer', marginLeft: 'auto' }}>取消选择</button>
        </div>
      )}

      {/* 表格 */}
      <div style={{ background: T.s1, border: `1px solid ${T.hl}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '34px minmax(140px,1.2fr) 100px 90px 80px 90px 72px 80px 72px 52px', padding: '10px 16px', borderBottom: `1px solid ${T.hl}`, fontSize: 11, fontWeight: 500, color: T.ink4, background: T.s1 }}>
          <span style={{ textAlign: 'center' }}>
            <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={e => setSelected(e.target.checked ? new Set(filtered.map(p => p.id)) : new Set())} style={{ width: 14, height: 14, accentColor: T.p }} />
          </span>
          <span onClick={() => { setSortField(sortField === 'name' ? null : 'name'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }} style={{ cursor: 'pointer', userSelect: 'none', color: sortField === 'name' ? T.p : T.ink4 }}>项目名称</span>
          <span onClick={() => { setSortField(sortField === 'manager' ? null : 'manager'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }} style={{ cursor: 'pointer', userSelect: 'none', color: sortField === 'manager' ? T.p : T.ink4 }}>经理</span>
          <span>部门</span>
          <span onClick={() => { setSortField(sortField === 'revenue' ? null : 'revenue'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }} style={{ cursor: 'pointer', userSelect: 'none', color: sortField === 'revenue' ? T.p : T.ink4 }}>预计/实际营收</span>
          <span>评级</span>
          <span>状态</span>
          <span>月度进度</span>
          <span>归属月</span>
          <span></span>
        </div>

        {grouped.map((g) => (
          <div key={g.name || 'all'}>
            {group && (
              <div style={{ display: 'grid', gridTemplateColumns: '34px 1fr auto 52px', alignItems: 'center', padding: '10px 16px', borderBottom: `1px solid ${T.hl}`, fontSize: 12, fontWeight: 500, color: T.ink2, background: T.s2 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: T.p }} />
                <span>{g.name}</span>
                <span style={{ fontSize: 11, color: T.ink4 }}>{g.items.length} 个项目</span>
                <span></span>
              </div>
            )}
            {g.items.map((p, i) => {
              const progress = p.progress || 0;
              const progColor = progress >= 100 ? T.ok : progress > 0 ? T.p : T.ink4;
              const isSelected = selected.has(p.id);
              return (
                <div key={p.id} onClick={() => nav(`/projects/${p.id}`)} style={{ ...rowStyle(i === 0), background: isSelected ? 'rgba(94,106,210,0.06)' : 'transparent' }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = T.s2; }}
                  onMouseLeave={e => { e.currentTarget.style.background = isSelected ? 'rgba(94,106,210,0.06)' : 'transparent'; }}>
                  <span onClick={e => { e.stopPropagation(); setSelected(prev => { const n = new Set(prev); n.has(p.id) ? n.delete(p.id) : n.add(p.id); return n; }); }} style={{ textAlign: 'center' }}>
                    <input type="checkbox" checked={isSelected} onChange={() => {}} style={{ width: 14, height: 14, accentColor: T.p }} />
                  </span>
                  <span style={{ fontWeight: 500, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.projectName}</span>
                  <span style={{ fontSize: 12, color: T.ink3 }}>{p.projectManager}</span>
                  <span style={{ fontSize: 12, color: T.ink3 }}>{p.deptBelong || '-'}</span>
                  <span style={{ fontSize: 12, color: T.ink3 }}>¥{fr(p.projectAmount || 0)}</span>
                  <span><span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: p.projectLevel === 'A' ? 'rgba(94,106,210,0.15)' : p.projectLevel === 'B' ? 'rgba(208,214,224,0.08)' : 'rgba(138,143,152,0.05)', color: p.projectLevel === 'A' ? T.p : p.projectLevel === 'B' ? T.ink2 : T.ink4, border: p.projectLevel === 'C' ? `1px solid ${T.hl}` : 'none' }}>{p.projectLevel || '-'}</span></span>
                  <span><span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 500, background: p.projectStatus === '已完成' ? 'rgba(39,166,68,0.16)' : p.projectStatus === '已暂停' ? 'rgba(212,160,48,0.18)' : 'rgba(94,106,210,0.16)', color: p.projectStatus === '已完成' ? T.ok : p.projectStatus === '已暂停' ? T.warn : T.p }}>{p.projectStatus || '-'}</span></span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 50, height: 4, background: T.s2, borderRadius: 2, overflow: 'hidden' }}>
                      <span style={{ display: 'block', height: '100%', borderRadius: 2, background: progColor, width: `${Math.min(progress, 100)}%` }} />
                    </span>
                    <span style={{ fontSize: 10, color: T.ink3, minWidth: 32 }}>{progress}%</span>
                  </span>
                  <span style={{ fontSize: 12, color: T.ink3 }}>{fmtMonth(p.startDate)}</span>
                  <span style={{ fontSize: 11, color: T.ink4 }}>{fmtDate(p.startDate)}</span>
                </div>
              );
            })}
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: T.ink4 }}>
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.25 }}>○</div>
            <div style={{ fontSize: 14, marginBottom: 4 }}>无匹配项目</div>
            <div style={{ fontSize: 12, opacity: 0.5 }}>尝试调整筛选条件</div>
          </div>
        )}
      </div>

      {/* 分页 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', fontSize: 12, color: T.ink4 }}>
        <span>共 {filtered.length} 条</span>
        <div style={{ display: 'flex', gap: 3 }}>
          <button style={{ padding: '5px 11px', borderRadius: 6, border: `1px solid ${T.hl}`, background: 'transparent', color: T.ink3, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>上一页</button>
          <button style={{ padding: '5px 11px', borderRadius: 6, border: `1px solid ${T.hls}`, background: T.s2, color: T.ink, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>1</button>
          <button style={{ padding: '5px 11px', borderRadius: 6, border: `1px solid ${T.hl}`, background: 'transparent', color: T.ink3, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>下一页</button>
        </div>
      </div>
    </div>
  );
}

/* 内联子组件 — 需要 T 令牌 */
function PillsUI({ children, T }: { children: React.ReactNode; T: typeof darkTokens }) {
  return <div style={{ display: 'flex', background: T.s1, borderRadius: 99, padding: 2 }}>{children}</div>;
}
function PillUI({ active, onClick, children, T }: { active: boolean; onClick: () => void; children: React.ReactNode; T: typeof darkTokens }) {
  return (
    <button onClick={onClick} style={{
      padding: '5px 14px', borderRadius: 99, fontSize: 12, cursor: 'pointer', border: 0,
      background: active ? T.s2 : 'transparent', color: active ? T.ink : T.ink3,
      fontFamily: 'inherit', fontWeight: active ? 500 : 400,
    }}>{children}</button>
  );
}

