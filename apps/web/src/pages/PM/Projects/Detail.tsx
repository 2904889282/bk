/** 项目详情 — 1:1 像素级对齐规范 (renderProjectDetail) */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import {
  fetchDashboard, fetchProjectPage, createProject, updateProject, deleteProject,
  saveWeekly, saveTeam, saveMilestones, type ProjectDashboard, type ProjectVO,
} from '../../../api/project';

/* ──── 设计令牌 ──── */
const T = { s1: '#0f1011', s2: '#141516', hl: '#23252a', hls: '#34343a',
  ink: '#f7f8f8', ink2: '#d0d6e0', ink3: '#8a8f98', ink4: '#757880',
  p: '#5e6ad2', ok: '#27a644', warn: '#d4a030', err: '#e05050', bg: '#010102' };

/* ──── 工具函数 ──── */
const fr = (v: number) => v >= 10000 ? `¥${(v / 10000).toFixed(0)}万` : v ? `¥${v.toLocaleString()}` : '--';
const pp = (v?: number | null) => (v != null ? `${Math.round(v)}%` : '0%');
const dayDiff = (s?: string, t?: Date) => {
  if (!s) return 0;
  const start = new Date(s);
  const end = t || new Date();
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
};
const fmtDate = (s?: string) => {
  if (!s) return '';
  const d = new Date(s);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};
const fmtMonth = (s?: string) => {
  if (!s) return '';
  const m = s.match(/(\d+)月/);
  if (m) return `${m[1]}月`;
  const d = new Date(s);
  return `${d.getMonth() + 1}月`;
};
const cleanFamily = (name: string) =>
  name.replace(/[-–—]\d+月$/, '').replace(/\d{4,6}/g, '').replace(/[-–—]\s*Q\d$/i, '')
    .replace(/[-–—]?\s*副本\s*$/, '').replace(/[（(]副本[）)]/, '').toLowerCase().trim();

/* ──── 可复用内联输入 ──── */
const InlineInput = ({ val, onChange, style, type, placeholder }: {
  val: string; onChange: (v: string) => void; style?: React.CSSProperties;
  type?: string; placeholder?: string;
}) => (
  <input type={type || 'text'} defaultValue={val} placeholder={placeholder}
    onBlur={e => {
      if (e.target.value !== val) onChange(e.target.value);
      e.target.style.borderColor = 'transparent'; e.target.style.background = T.s2;
    }}
    style={{ background: T.s2, border: '1px solid transparent', borderRadius: 4,
      padding: '4px 8px', fontSize: 12, color: T.ink, fontFamily: 'inherit',
      outline: 'none', transition: 'all 0.15s', ...style }}
    onFocus={e => { e.target.style.borderColor = T.hls; e.target.style.background = T.s1; }}
    onMouseEnter={e => { if (document.activeElement !== e.target) e.target.style.borderColor = T.hl; }}
    onMouseLeave={e => { if (document.activeElement !== e.target) { e.target.style.borderColor = 'transparent'; e.target.style.background = T.s2; } }}
  />
);

/* ──── Panel 容器 ──── */
const Panel = ({ title, children, full }: { title?: React.ReactNode; children: React.ReactNode; full?: boolean }) => (
  <div style={{ background: T.s1, border: `1px solid ${T.hl}`, borderRadius: 12, padding: full ? '20px 24px' : '16px 20px', height: full ? 'auto' : 'fit-content' }}>
    {title && <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: T.ink }}>{title}</div>}
    {children}
  </div>
);

/* ──── 主组件 ──── */
export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { logout } = useAuth();
  const [d, setD] = useState<ProjectDashboard | null>(null);
  const [l, setL] = useState(true);
  const [fam, setFam] = useState<ProjectVO[]>([]);
  const [msg, setMsg] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  /* 刷新 */
  const refresh = () => { setRefreshKey(k => k + 1); setL(true); };

  useEffect(() => {
    if (!id) { setL(false); return; }
    Promise.all([fetchDashboard(+id), fetchProjectPage({ pageNum: 1, pageSize: 500 })])
      .then(([dash, all]) => {
        setD(dash);
        const cn = (n: string) => cleanFamily(n);
        setFam((all.records || [])
          .filter(x => cn(x.projectName) === cn(dash.project.projectName))
          .sort((a, b) => a.projectName.localeCompare(b.projectName)));
      })
      .catch(() => setD(null))
      .finally(() => setL(false));
  }, [id, refreshKey]);

  /* 快速保存 */
  const sv = async (f: string, v: any) => {
    try {
      if (!d) return;
      await updateProject(d.project.id, { [f]: v } as any);
      setMsg('✓ 已保存'); setTimeout(() => setMsg(''), 2000);
      refresh();
    } catch { setMsg('保存失败'); setTimeout(() => setMsg(''), 2000); }
  };

  /* Toast */
  const toast = (text: string) => { setMsg(text); setTimeout(() => setMsg(''), 2000); };

  /* 保存工作描述（铁三角）—— 通过 team.workDescription 存储，不刷新 */
  const saveWorkDesc = async (roleKey: string, name: string, value: string) => {
    try {
      if (!d) return;
      const team = (d.team || []).map((t: any) => ({ ...t }));
      const existing = team.find((t: any) =>
        (t.role === roleKey) || (t.name === name && t.role === roleKey));
      if (existing) {
        existing.workDescription = value;
      } else {
        team.push({ name, role: roleKey, workDescription: value });
      }
      await saveTeam(d.project.id, team);
      // 非破坏性更新本地缓存
      setD(prev => prev ? { ...prev, team } : prev);
      toast('✓ 工作描述已保存');
    } catch { toast('保存失败'); }
  };

  /* 复制项目 — 保留目标字段和里程碑结构，清除进度 */
  const duplicate = async (p: ProjectVO) => {
    const da = new Date();
    const nm = cleanFamily(p.projectName);
    const nextM = da.getMonth() + 2;
    try {
      const newProj = await createProject({
        projectName: `${nm}-${nextM}月`, projectManager: p.projectManager,
        clientName: p.clientName, projectLevel: p.projectLevel,
        projectStatus: '进行中', deptBelong: p.deptBelong, projectAmount: 0,
        startDate: `${da.getFullYear()}-${String(nextM).padStart(2, '0')}-01`,
        deliveryManager: p.deliveryManager, productManager: p.productManager,
        clientContact: p.clientContact, supplier: p.supplier,
      });
      // 保留里程碑结构
      const ms = d?.milestones || [];
      if (ms.length > 0 && newProj?.id) {
        try {
          await saveMilestones(newProj.id, ms.map((m: any) => ({
            stage: m.stage || '', milestone: m.milestone || m.name || '',
            plannedDate: m.plannedDate || '', actualDate: m.actualDate || '',
            status: '未完成',
          })));
        } catch { /* 里程碑复制失败不影响主流程 */ }
      }
      nav(`/projects/-1`);
    } catch { toast('复制失败'); }
  };

  /* 删除 */
  const deleteFromDetail = async () => {
    if (!d || !confirm('⚠ 确定永久删除该项目？此操作不可撤销。')) return;
    try {
      await deleteProject(d.project.id);
      nav('/pm/projects');
    } catch { toast('删除失败'); }
  };

  /* 保存单个里程碑字段 */
  const saveMilestoneField = async (index: number, field: string, value: string) => {
    try {
      if (!d) return;
      const ms = [...(d.milestones || [])];
      if (!ms[index]) return;
      ms[index] = { ...ms[index], [field]: value };
      await saveMilestones(d.project.id, ms);
      setD(prev => prev ? { ...prev, milestones: ms } : prev);
      toast('✓ 里程碑已保存');
    } catch { toast('保存失败'); }
  };

  /* 添加里程碑 */
  const addMilestone = async () => {
    try {
      if (!d) return;
      const ms = [...(d.milestones || []), { stage: '', milestone: '新里程碑', plannedDate: '', actualDate: '', status: '未完成' }];
      await saveMilestones(d.project.id, ms);
      setD(prev => prev ? { ...prev, milestones: ms } : prev);
      toast('✓ 已添加里程碑');
    } catch { toast('添加失败'); }
  };

  /* 保存 W1-W4 进度 */
  const quickSaveProg = async () => {
    try {
      const period = d?.periods?.[0];
      if (!d || !period?.id) { toast('暂无期数数据'); return; }
      const container = document.getElementById('projGoals');
      if (!container) return;
      const fields: Record<string, string> = {};
      container.querySelectorAll<HTMLInputElement>('[data-field]').forEach(el => {
        fields[el.dataset.field!] = el.value;
      });
      await saveWeekly(d.project.id, {
        ...period,
        ...fields,
        periodMonth: period.periodMonth,
        weekNumber: 1,
      });
      toast('✓ 进度已保存'); refresh();
    } catch { toast('保存失败'); }
  };

  /* ──── 加载态 / 空态 ──── */
  const pageStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 1000, background: T.bg, color: T.ink,
    fontFamily: 'inherit', overflowY: 'auto', padding: '24px 32px 80px',
  };

  if (l) return <div style={pageStyle}><div style={{ textAlign: 'center', paddingTop: '30vh', color: T.ink4 }}>加载中...</div></div>;
  if (!d?.project) return (
    <div style={pageStyle}>
      <div style={{ textAlign: 'center', paddingTop: '30vh', color: T.ink4 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
        <div style={{ fontSize: 16, marginBottom: 8, color: T.ink2 }}>项目不存在或无权限</div>
        <button onClick={() => nav('/pm/projects')}
          style={{ padding: '8px 20px', borderRadius: 8, border: `1px solid ${T.p}`, background: 'transparent', color: T.p, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>
          返回项目列表</button>
      </div>
    </div>
  );

  const p = d.project;
  const msList = d.milestones || [];
  const period = d.periods?.[0];
  const changes = d.changes || [];
  const today = new Date();

  /* 获取项目家族 */
  const getProjectFamily = (): ProjectVO[] => fam;

  /* 提取月份（从项目名中） */
  const extractMonth = (name: string) => {
    const m = name.match(/(\d+)月/);
    return m ? `${m[1]}月` : (p.startDate ? fmtMonth(p.startDate) : '');
  };

  try {
    return (
      <div style={pageStyle}>
        {/* Toast */}
        {msg && (
          <div style={{ position: 'fixed', top: 16, right: 24, zIndex: 2000, background: T.s2, border: `1px solid ${T.hl}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, color: T.ink }}>
            {msg}
          </div>
        )}

        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* ══════════════ ① Hero Card ══════════════ */}
          <div style={{ background: T.s1, border: `1px solid ${T.hl}`, borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              {/* 返回按钮 — 浏览器历史回退，无历史则回线索板块 */}
              <button onClick={() => { if (window.history.length > 1) nav(-1); else nav('/ltc/leads'); }}
                style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${T.hl}`,
                  background: 'transparent', color: T.ink3, cursor: 'pointer', fontSize: 13,
                  fontFamily: 'inherit', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                ← 返回
              </button>

              {/* 项目名称 + 元数据 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <InlineInput val={p.projectName || ''} onChange={v => sv('projectName', v)}
                  style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.4px', padding: '4px 8px', borderRadius: 6, width: '100%' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                  {/* 评级选择器 */}
                  <select value={p.projectLevel || ''} onChange={e => sv('projectLevel', e.target.value)}
                    style={{ background: T.s2, border: `1px solid ${T.hl}`, borderRadius: 4, color: T.ink,
                      fontSize: 12, fontFamily: 'inherit', padding: '4px 8px', cursor: 'pointer' }}>
                    <option value="">-</option><option value="A">A级</option><option value="B">B级</option><option value="C">C级</option>
                  </select>
                  {/* 状态标签 */}
                  <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 500,
                    background: p.projectStatus === '已完成' ? 'rgba(39,166,68,0.15)' :
                      (p.projectStatus === '已暂停' || p.projectStatus === '暂停') ? 'rgba(138,143,152,0.12)' :
                        'rgba(94,106,210,0.15)',
                    color: p.projectStatus === '已完成' ? '#5ad478' :
                      (p.projectStatus === '已暂停' || p.projectStatus === '暂停') ? T.ink3 : T.p }}>
                    {p.projectStatus || '-'}
                  </span>
                  {/* 元数据行 */}
                  {(() => {
                    const parts = [
                      p.projectManager,
                      p.deptBelong,
                      extractMonth(p.projectName) || fmtMonth(p.startDate),
                      fmtDate(p.startDate) ? `${fmtDate(p.startDate)} → ${fmtDate(p.expectEndDate)}` : '',
                    ].filter(Boolean);
                    return parts.length > 0 ? (
                      <span style={{ fontSize: 13, color: T.ink3 }}>
                        {parts.map((part, i) => (
                          <span key={i}>{i > 0 && <span style={{ opacity: 0.3 }}> · </span>}{part}</span>
                        ))}
                      </span>
                    ) : <span style={{ opacity: 0.4, fontSize: 13 }}>暂无详情</span>;
                  })()}
                </div>
              </div>

              {/* 右上角操作区 */}
              <div style={{ flexShrink: 0, display: 'flex', gap: 8 }}>
                <select value={p.projectStatus || ''} onChange={e => {
                  if (!e.target.value) return;
                  sv('projectStatus', e.target.value);
                }} style={{ background: T.s2, border: `1px solid ${T.hl}`, borderRadius: 8, color: T.ink,
                  fontSize: 13, fontFamily: 'inherit', padding: '8px 14px', cursor: 'pointer', appearance: 'auto' }}>
                  <option value="">更新状态...</option>
                  <option value="正式执行">正式执行</option>
                  <option value="已完成">已完成</option>
                  <option value="已暂停">已暂停</option>
                </select>
                <button onClick={() => duplicate(p)} title="复制项目"
                  style={{ background: 'transparent', color: T.ink3, border: `1px solid ${T.hl}`,
                    borderRadius: 8, fontSize: 13, padding: '8px 14px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  📄
                </button>
                <button onClick={deleteFromDetail} title="删除项目"
                  style={{ background: 'transparent', color: T.err, border: '1px solid rgba(200,60,60,0.3)',
                    borderRadius: 8, fontSize: 13, padding: '8px 14px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  🗑
                </button>
                <button onClick={() => { if (confirm('确定要退出登录吗？')) { logout(); nav('/login'); } }} title="退出登录"
                  style={{ background: 'transparent', color: T.ink4, border: `1px solid ${T.hl}`,
                    borderRadius: 8, fontSize: 13, padding: '8px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  🚪
                </button>
              </div>
            </div>

            {/* Hero KPI 行 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12,
              marginTop: 16, paddingTop: 14, borderTop: `1px solid ${T.hl}`, textAlign: 'center' }}>
              {(() => {
                const actualRev = period?.actualRevenue ? Number(period.actualRevenue) : 0;
                const revNum = Number(p.projectAmount || 0);
                const actualOk = actualRev > 0 && actualRev >= revNum;
                return ([
                  { l: '预计营收', v: fr(revNum), c: T.p },
                  {
                    l: '实际营收', v: actualRev ? fr(actualRev) : '--',
                    c: actualOk ? T.ok : (actualRev > 0 ? T.warn : T.ink3),
                  },
                  {
                    l: '目标进度', v: pp(p.progress),
                    c: (p.progress || 0) >= 100 ? T.ok : (p.progress || 0) > 50 ? T.p : T.ink3,
                  },
                  { l: '开工天数', v: `${dayDiff(p.startDate)}天`, c: T.ink3 },
                ]).map((k, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 10, color: T.ink4, marginBottom: 2 }}>{k.l}</div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: k.c }}>{k.v}</div>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* ══════════════ ② Project Family Panel ══════════════ */}
          {getProjectFamily().length > 1 && (
            <div style={{ background: T.s1, border: `1px solid ${T.hl}`, borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
              {/* 家族头 */}
              {(() => {
                const family = getProjectFamily();
                const familyName = cleanFamily(family[0].projectName).replace(/[-–—]/g, ' ').trim();
                const totalRevenue = family.reduce((s, x) => s + Number(x.projectAmount || 0), 0);
                const avgProgress = Math.round(family.reduce((s, x) => s + (x.progress || 0), 0) / family.length);
                const completedCount = family.filter(x => x.projectStatus === '已完成').length;
                return (
                  <div style={{ padding: '10px 16px', background: T.s2, borderBottom: `1px solid ${T.hl}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>
                      项目组 · {familyName}
                      <span style={{ fontWeight: 400, fontSize: 11, color: T.ink4 }}> 共{family.length}月</span>
                    </span>
                    <span style={{ fontSize: 11, color: T.ink4, fontWeight: 400 }}>
                      总营收 {fr(totalRevenue)} · 均进度 {avgProgress}% · 完成 {completedCount} 个月
                    </span>
                  </div>
                );
              })()}
              {/* 时间轴 */}
              <div style={{ display: 'flex', gap: 0, overflowX: 'auto', padding: '12px 16px' }}>
                {getProjectFamily().map(fp => {
                  const cur = fp.id === p.id;
                  const fprg = fp.progress || 0;
                  const isDone = fp.projectStatus === '已完成';
                  const dotBg = fprg >= 100 || (fprg === 0 && isDone) ? T.ok :
                    fprg > 0 ? T.p : T.s2;
                  const dotTxt = fprg >= 100 || (fprg === 0 && isDone) ? '✓' :
                    fprg > 0 ? `${fprg}` : '·';
                  const dotColor = fprg >= 100 || (fprg === 0 && isDone) ? '#fff' :
                    fprg > 0 ? '#fff' : T.ink4;
                  const dotBorder = fprg >= 100 || (fprg === 0 && isDone) ? T.ok :
                    (cur ? T.p : T.hl);
                  const monthLabel = extractMonth(fp.projectName) || '?月';
                  return (
                    <div key={fp.id}
                      onClick={() => { if (!cur) nav(`/projects/${fp.id}`); }}
                      style={{ flexShrink: 0, width: 72, textAlign: 'center',
                        cursor: cur ? 'default' : 'pointer', padding: '8px 4px', borderRadius: 8,
                        background: cur ? 'rgba(94,106,210,0.08)' : 'transparent',
                        border: cur ? '1px solid rgba(94,106,210,0.2)' : '1px solid transparent',
                        scrollSnapAlign: 'start', transition: 'background 0.15s' }}
                      onMouseEnter={e => { if (!cur) e.currentTarget.style.background = T.s2; }}
                      onMouseLeave={e => { if (!cur) e.currentTarget.style.background = 'transparent'; }}>
                      <div style={{ fontSize: 10, color: cur ? T.p : T.ink4, marginBottom: 6,
                        fontWeight: cur ? 600 : 500 }}>{monthLabel}</div>
                      <div style={{ width: 36, height: 36, borderRadius: '50%',
                        margin: '0 auto 4px', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 10, fontWeight: 600,
                        border: `2px solid ${dotBorder}`, background: dotBg, color: dotColor }}>
                        {dotTxt}
                      </div>
                      <div style={{ fontSize: 9, color: T.ink4 }}>
                        {fp.projectStatus || '-'}
                        {cur && <div style={{ fontSize: 9, color: T.p }}>当前</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══════════════ ③④ 两列 — 基本信息 + 铁三角 ══════════════ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            {/* 基本信息 */}
            <Panel title="基本信息">
              {[
                { l: '项目编号', f: 'projectNumber', v: p.projectNumber, t: 'text' },
                { l: '一条龙经理', f: 'projectManager', v: p.projectManager, t: 'text' },
                { l: '方案经理', f: 'productManager', v: p.productManager, t: 'text' },
                { l: '交付经理', f: 'deliveryManager', v: p.deliveryManager, t: 'text' },
                { l: '部门', f: 'deptBelong', v: p.deptBelong, t: 'text' },
                { l: '甲方对接人', f: 'clientContact', v: p.clientContact, t: 'text' },
                { l: '归属月份', f: 'startDate', v: p.startDate?.slice(0, 7) || '', t: 'month' },
                { l: '开始日期', f: 'startDate', v: p.startDate?.slice(0, 10) || '', t: 'date' },
                { l: '结束日期', f: 'expectEndDate', v: p.expectEndDate?.slice(0, 10) || '', t: 'date' },
                { l: '供应商', f: 'supplier', v: p.supplier, t: 'text' },
                { l: '客户信息', f: 'clientName', v: p.clientName, t: 'text' },
              ].map((x, i) => (
                <div key={i} style={{ display: 'flex', marginBottom: 8, fontSize: 13, alignItems: 'center' }}>
                  <span style={{ width: 85, color: T.ink4, flexShrink: 0, fontSize: 12 }}>{x.l}</span>
                  <InlineInput
                    val={(x.v || '').replace(/"/g, '&quot;')}
                    onChange={v => sv(x.f, v)}
                    type={x.t}
                    style={{ flex: 1 }}
                    placeholder={x.t === 'month' ? 'YYYY-MM' : (x.t === 'date' ? 'YYYY-MM-DD' : undefined)}
                  />
                </div>
              ))}
            </Panel>

            {/* 铁三角 · 核心团队 */}
            <Panel title={<span>铁三角<span style={{ color: T.ink4, fontSize: 11, fontWeight: 400 }}> 核心团队</span></span>}>
              {[
                { name: p.projectManager, roleName: '客户经理', icon: '👤', roleKey: 'manager' },
                { name: p.productManager, roleName: '方案经理', icon: '📋', roleKey: 'product' },
                { name: p.deliveryManager, roleName: '交付经理', icon: '🚀', roleKey: 'delivery' },
              ].map((m, i) => {
                const initials = (m.name || '未').slice(-2);
                /* 从 team 表匹配工作描述和时间戳 */
                const teamMember = d.team?.find((t: any) => t.role === m.roleKey);
                const workDesc = teamMember?.workDescription || '';
                const tsDisplay = teamMember?.updateTime
                  ? (() => {
                      const dt = new Date(teamMember.updateTime);
                      return `${dt.getMonth() + 1}/${dt.getDate()} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
                    })()
                  : '';
                return (
                  <div key={i} style={{
                    marginBottom: i < 2 ? 12 : 0,
                    paddingBottom: i < 2 ? 12 : 0,
                    borderBottom: i < 2 ? `1px solid ${T.hl}` : 'none',
                  }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      {/* 头像 */}
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'rgba(94,106,210,0.15)', color: T.p,
                        border: '1px solid rgba(94,106,210,0.3)', fontSize: 12,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {initials}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: T.ink }}>
                          {m.name || '未分配'}
                          {tsDisplay && <span style={{ fontSize: 10, color: T.ink4, fontWeight: 400, marginLeft: 8 }}>· 最后编辑 {tsDisplay}</span>}
                        </div>
                        <div style={{ fontSize: 10, color: T.ink4 }}>{m.roleName}</div>
                        {/* 工作描述 textarea */}
                        <textarea defaultValue={workDesc}
                          placeholder={`描述${m.roleName}在项目中的具体工作内容...`}
                          onBlur={e => {
                            if (e.target.value !== workDesc)
                              saveWorkDesc(m.roleKey, m.name || m.roleKey, e.target.value);
                          }}
                          style={{
                            width: '100%', minHeight: 48, background: T.s2,
                            border: `1px solid ${T.hl}`, borderRadius: 6,
                            padding: '8px 10px', fontSize: 12, color: T.ink2,
                            fontFamily: 'inherit', resize: 'vertical', outline: 'none',
                            lineHeight: 1.5, marginTop: 8,
                          }}
                          onFocus={e => e.currentTarget.style.borderColor = T.hls}
                          onBlur={e => e.currentTarget.style.borderColor = T.hl}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </Panel>
          </div>

          {/* ══════════════ ④ 关键目标 — 全宽 ══════════════ */}
          <div id="projGoals" style={{ background: T.s1, border: `1px solid ${T.hl}`, borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>
            {/* 标题行 + 目标名称 */}
            <div style={{ fontSize: 14, fontWeight: 600, color: T.ink, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              关键目标
              <InlineInput val={p.remark || ''} onChange={v => sv('remark', v)}
                style={{ width: 200, fontSize: 12, padding: '3px 6px' }}
                placeholder="目标名称" />
            </div>

            {/* 进度数字 + 趋势 */}
            {(() => {
              const w1 = Number(period?.w1Progress || 0);
              const w2 = Number(period?.w2Progress || 0);
              const w3 = Number(period?.w3Progress || 0);
              const w4 = Number(period?.w4Progress || 0);
              const vals = [w1, w2, w3, w4].filter(v => v > 0);
              const prg = p.progress || 0;
              const avgV = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
              const trend = vals.length >= 2 ? vals[vals.length - 1] - vals[vals.length - 2] : 0;
              const pred = avgV * 4;
              const goalTarget = period?.monthlyTarget ? Number(period.monthlyTarget) : 100;
              return (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 12, flexWrap: 'wrap' }}>
                    {/* 进度大字 */}
                    <span style={{
                      fontSize: 32, fontWeight: 600,
                      color: prg >= 100 ? T.ok : prg > 0 ? T.p : T.ink3,
                    }}>{pp(prg)}</span>
                    {/* 目标值 */}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 12, color: T.ink4 }}>目标值:</span>
                      <InlineInput val={String(goalTarget)} onChange={v => {
                        /* 通过 saveWeekly 更新 monthlyTarget */
                        if (period?.id && d) {
                          saveWeekly(d.project.id, { ...period, monthlyTarget: v, periodMonth: period.periodMonth, weekNumber: 1 })
                            .then(() => toast('✓ 目标已保存')).catch(() => toast('保存失败'));
                        }
                      }} style={{ width: 100, fontSize: 12, padding: '3px 6px' }} />
                    </span>
                    {/* 趋势 + 预测 + 周均 */}
                    <span style={{ marginLeft: 'auto', display: 'flex', gap: 16, fontSize: 11 }}>
                      <span style={{ color: trend > 0 ? T.ok : trend < 0 ? T.err : T.ink4 }}>
                        趋势 {trend > 0 ? `↑+${trend}%` : trend < 0 ? `↓${trend}%` : '→0%'}
                      </span>
                      <span style={{ color: pred >= 100 ? T.ok : pred >= 70 ? T.warn : T.err }}>
                        预测 {Math.round(pred)}%
                      </span>
                      <span style={{ color: T.ink4 }}>周均 {avgV.toFixed(1)}%</span>
                    </span>
                  </div>

                  {/* W1-W4 进度面板 */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[1, 2, 3, 4].map(w => {
                      const wProg = Number((period as any)?.[`w${w}Progress`] || 0);
                      const wTarget = Number((period as any)?.[`w${w}Target`] || 0);
                      const done = wProg >= wTarget && wTarget > 0;
                      const curW = Math.ceil(new Date().getDate() / 7); // 粗略判断当前周
                      const isCurWeek = w === curW;
                      return (
                        <div key={w} style={{
                          flex: 1, minWidth: 0, textAlign: 'center',
                          padding: '8px 8px', borderRadius: 6,
                          border: `1px solid ${isCurWeek ? 'rgba(94,106,210,0.25)' : T.hl}`,
                          background: isCurWeek ? 'rgba(94,106,210,0.08)' : T.s2,
                        }}>
                          <div style={{ fontSize: 10, color: isCurWeek ? T.p : T.ink4, marginBottom: 4, fontWeight: isCurWeek ? 600 : 400 }}>
                            W{w}{isCurWeek ? ' 本周' : ''}
                          </div>
                          <input type="number" defaultValue={wProg || ''} placeholder="%"
                            data-field={`w${w}Progress`}
                            style={{
                              textAlign: 'center', width: '100%', fontSize: 12, fontWeight: 600,
                              padding: 4, border: `1px solid ${T.hl}`, borderRadius: 4,
                              background: T.s1, outline: 'none', fontFamily: 'inherit',
                              color: done ? T.ok : (wProg > 0 && wProg < wTarget ? T.warn : T.ink3),
                            }}
                            onBlur={() => quickSaveProg()}
                          />
                          <div style={{ fontSize: 9, color: T.ink4, marginTop: 4 }}>
                            目标 {wTarget || '-'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: 10, color: T.ink4, marginTop: 8 }}>
                    输入进度后自动保存 · 绿色=达标 · 黄=未达标
                  </div>
                </>
              );
            })()}
          </div>

          {/* ══════════════ ⑤ 两列 — 里程碑 + 进展与风险 ══════════════ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            {/* 里程碑 */}
            <Panel title={<span>里程碑<span style={{ fontWeight: 400, fontSize: 12, color: T.ink4 }}> {msList.filter((m: any) => m.status === '已完成' || m.status === 'done').length}/{msList.length} 完成</span></span>}>
              {msList.length === 0 && (
                <div style={{ color: T.ink4, fontSize: 12, padding: '12px 0', textAlign: 'center' }}>暂无里程碑</div>
              )}
              {msList.map((m: any, idx: number) => {
                const done = m.status === '已完成' || m.status === 'done';
                return (
                  <div key={idx} style={{
                    marginBottom: 6, padding: '8px 10px',
                    border: `1px solid ${T.hl}`, borderRadius: 6,
                    borderLeft: `3px solid ${done ? T.ok : T.warn}`,
                    background: done ? 'rgba(39,166,68,0.04)' : T.s1,
                  }}>
                    {/* 第一行：状态图标 + 名称 + 状态下拉 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: (m.plannedDate || m.actualDate || m.stage || m.reward) ? 4 : 0 }}>
                      <span style={{ fontSize: 11, color: done ? T.ok : T.warn }}>
                        {done ? '●' : '○'}
                      </span>
                      <input
                        defaultValue={m.milestone || m.name || '新里程碑'}
                        placeholder="里程碑名称"
                        onBlur={e => { if (e.target.value !== (m.milestone || m.name)) saveMilestoneField(idx, 'milestone', e.target.value); }}
                        style={{
                          fontSize: 12, fontWeight: 500, flex: 1,
                          background: T.s2, border: '1px solid transparent', borderRadius: 4,
                          padding: '3px 6px', color: T.ink, fontFamily: 'inherit', outline: 'none',
                        }}
                        onFocus={e => { e.target.style.borderColor = T.hls; e.target.style.background = T.s1; }}
                        onBlur={e => { e.target.style.borderColor = 'transparent'; e.target.style.background = T.s2; }}
                        onMouseEnter={e => { if (document.activeElement !== e.target) e.target.style.borderColor = T.hl; }}
                        onMouseLeave={e => { if (document.activeElement !== e.target) { e.target.style.borderColor = 'transparent'; e.target.style.background = T.s2; } }}
                      />
                      <select defaultValue={m.status || '未完成'}
                        onChange={e => saveMilestoneField(idx, 'status', e.target.value)}
                        style={{
                          background: T.s2, border: `1px solid ${T.hl}`, borderRadius: 4,
                          color: T.ink, fontSize: 10, padding: '2px 6px', cursor: 'pointer',
                          fontFamily: 'inherit', marginLeft: 'auto',
                        }}>
                        <option value="未完成">未完成</option>
                        <option value="已完成">已完成</option>
                      </select>
                    </div>
                    {/* 第二行：截止日期 + 奖励金额 */}
                    <div style={{ display: 'flex', gap: 6, paddingLeft: 19 }}>
                      <input
                        defaultValue={m.plannedDate || m.actualDate || ''}
                        placeholder="截止日"
                        type="date"
                        onBlur={e => { if (e.target.value !== (m.plannedDate || m.actualDate || '')) saveMilestoneField(idx, 'plannedDate', e.target.value); }}
                        style={{
                          flex: 1, background: T.s2, border: '1px solid transparent', borderRadius: 4,
                          padding: '2px 4px', fontSize: 10, color: T.ink, fontFamily: 'inherit', outline: 'none',
                        }}
                        onFocus={e => { e.target.style.borderColor = T.hls; e.target.style.background = T.s1; }}
                        onBlur={e => { e.target.style.borderColor = 'transparent'; e.target.style.background = T.s2; }}
                        onMouseEnter={e => { if (document.activeElement !== e.target) e.target.style.borderColor = T.hl; }}
                        onMouseLeave={e => { if (document.activeElement !== e.target) { e.target.style.borderColor = 'transparent'; e.target.style.background = T.s2; } }}
                      />
                      <input
                        defaultValue={m.stage || m.reward || ''}
                        placeholder="奖励"
                        onBlur={e => { if (e.target.value !== (m.stage || m.reward || '')) saveMilestoneField(idx, 'stage', e.target.value); }}
                        style={{
                          flex: 1, background: T.s2, border: '1px solid transparent', borderRadius: 4,
                          padding: '2px 4px', fontSize: 10, color: T.ink, fontFamily: 'inherit', outline: 'none',
                        }}
                        onFocus={e => { e.target.style.borderColor = T.hls; e.target.style.background = T.s1; }}
                        onBlur={e => { e.target.style.borderColor = 'transparent'; e.target.style.background = T.s2; }}
                        onMouseEnter={e => { if (document.activeElement !== e.target) e.target.style.borderColor = T.hl; }}
                        onMouseLeave={e => { if (document.activeElement !== e.target) { e.target.style.borderColor = 'transparent'; e.target.style.background = T.s2; } }}
                      />
                    </div>
                  </div>
                );
              })}
              {msList.length < 6 && (
                <div onClick={addMilestone}
                  style={{
                    padding: '6px 10px', textAlign: 'center', color: T.ink4, fontSize: 11,
                    cursor: 'pointer', border: `1px dashed ${T.hl}`, borderRadius: 6, marginTop: 4,
                  }}>
                  + 添加里程碑 ({msList.length}/6)
                </div>
              )}
            </Panel>

            {/* 进展与风险 */}
            <Panel title="进展与风险">
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: T.ink4, marginBottom: 4 }}>风险评估</div>
                <input
                  defaultValue={p.riskAssessment || ''}
                  onBlur={e => { if (e.target.value !== (p.riskAssessment || '')) sv('riskAssessment', e.target.value); }}
                  placeholder="输入风险评估..."
                  style={{
                    width: '100%', background: T.s2, border: `1px solid ${T.hl}`, borderRadius: 6,
                    padding: '6px 10px', fontSize: 12, color: T.ink, fontFamily: 'inherit', outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = T.hls}
                  onBlur={e => e.target.style.borderColor = T.hl}
                />
              </div>
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 11, color: T.ink4, marginBottom: 4 }}>进展解读</div>
                <textarea
                  defaultValue={p.description || ''}
                  onBlur={e => { if (e.target.value !== (p.description || '')) sv('description', e.target.value); }}
                  placeholder="描述项目进展..."
                  style={{
                    width: '100%', minHeight: 70, background: T.s2, border: `1px solid ${T.hl}`,
                    borderRadius: 6, padding: '6px 10px', fontSize: 12, color: T.ink,
                    fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = T.hls}
                  onBlur={e => e.target.style.borderColor = T.hl}
                />
              </div>
              <div style={{ fontSize: 10, color: T.ink4, marginTop: 6 }}>修改后自动保存</div>
            </Panel>
          </div>

          {/* ══════════════ ⑥ 操作日志 — 全宽 ══════════════ */}
          <div style={{ background: T.s1, border: `1px solid ${T.hl}`, borderRadius: 12, padding: '20px 24px' }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: T.ink }}>
              操作日志 <span style={{ fontWeight: 400, fontSize: 12, color: T.ink4 }}>{changes.length}条</span>
            </div>
            {changes.length === 0 && (
              <div style={{ textAlign: 'center', padding: 24, color: T.ink4, fontSize: 12 }}>
                暂无操作记录
              </div>
            )}
            {changes.slice(-6).reverse().map((l: any, i: number) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '7px 0', borderBottom: `1px solid ${T.hl}`, fontSize: 12,
              }}>
                <span style={{ color: T.ink4, width: 52, flexShrink: 0 }}>
                  {(() => {
                    const d = l.changeDate || l.createTime;
                    if (!d) return '-';
                    const dt = new Date(d);
                    return `${dt.getMonth() + 1}/${dt.getDate()} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
                  })()}
                </span>
                <span style={{ color: T.ink3 }}>
                  {l.changeSummary || l.actionSummary || l.action || l.description || '-'}
                </span>
              </div>
            ))}
          </div>

        </div>
      </div>
    );
  } catch (err: any) {
    return (
      <div style={pageStyle}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {/* Hero 错误状态 */}
          <div style={{ background: T.s1, border: `1px solid ${T.hl}`, borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <button onClick={() => { if (window.history.length > 1) nav(-1); else nav('/ltc/leads'); }}
                style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${T.hl}`, background: 'transparent', color: T.ink3, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', flexShrink: 0, marginTop: 2 }}>
                ← 返回
              </button>
              <div style={{ color: T.err, fontSize: 18, fontWeight: 600 }}>渲染错误</div>
            </div>
          </div>
          {/* 错误详情 */}
          <div style={{ background: T.s1, border: `1px solid ${T.hl}`, borderRadius: 12, padding: '20px 24px' }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: T.ink }}>错误</div>
            <div style={{ color: T.err, padding: 16, fontSize: 13, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
              {err?.message || '未知渲染错误'}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
