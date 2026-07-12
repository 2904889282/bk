/**
 * 数据看板 — KPI卡片 + 部门分布 + 月度营收 + 最近项目 + 待填提醒
 * 参考: 项目管理系统_完整规范文档.md §3.1
 */
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProjectPage, type ProjectVO } from '../../../api/project';
import { T, RATING as RATING_COLORS, fmtMoney } from '../tokens';

/* 条形图子组件 */
function BarChartRow({ label, value, max, fill, showVal }: {
  label: string; value: number; max: number; fill: string; showVal?: string;
}) {
  const pct = max > 0 ? Math.max((value / max) * 100, 3) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <span style={{ width: 70, fontSize: 12, color: T.ink3, textAlign: 'right', flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 24, background: T.s2, borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 6, width: `${pct}%`, background: fill, transition: 'width 0.6s ease', display: 'flex', alignItems: 'center', paddingLeft: 8, minWidth: value > 0 ? 40 : 0 }}>
          <span style={{ fontSize: 11, fontWeight: 500, color: pct > 35 ? '#fff' : fill }}>{showVal ?? `${value}`}</span>
        </div>
      </div>
      <span style={{ width: 36, fontSize: 12, color: T.ink2, textAlign: 'right', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

export default function PMDashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectVO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjectPage({ pageNum: 1, pageSize: 500 })
      .then(res => setProjects(res.records || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const total = projects.length;
    const totalRevenue = projects.reduce((s, p) => s + Number(p.projectAmount ?? 0), 0);
    const withGoals = projects.filter(p => p.description && p.description.length > 0).length;
    const active = projects.filter(p => p.projectStatus === '进行中' || p.projectStatus === '正式执行').length;
    return { total, totalRevenue, withGoals, active };
  }, [projects]);

  /* 部门分布 */
  const deptStats = useMemo(() => {
    const m: Record<string, number> = {};
    projects.forEach(p => { const d = p.deptBelong || '未分配'; m[d] = (m[d] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [projects]);

  /* 月度营收 (按月份聚合) */
  const monthRevenue = useMemo(() => {
    const m: Record<string, number> = {};
    projects.forEach(p => {
      const month = p.createTime?.slice(0, 7) || '未知';
      m[month] = (m[month] || 0) + Number(p.projectAmount ?? 0);
    });
    return Object.entries(m).sort();
  }, [projects]);

  const maxDept = Math.max(...deptStats.map(d => d[1]), 1);
  const maxMonthRev = Math.max(...monthRevenue.map(d => d[1]), 1);
  const recentProjects = projects.slice(0, 8);

  if (loading) return <div style={{ textAlign: 'center', padding: 80, color: T.ink4 }}>加载中...</div>;

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 16px', letterSpacing: '-0.3px', color: T.ink }}>数据看板</h2>

      {/* KPI 网格 4 列 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: '项目总数', value: stats.total, sub: `${stats.active} 个进行中`, color: T.p },
          { label: '预计总营收', value: fmtMoney(stats.totalRevenue), sub: `${projects.length} 个项目`, color: T.ok },
          { label: '设有关键目标', value: stats.withGoals, sub: `${projects.length ? Math.round(stats.withGoals / Math.max(stats.total, 1) * 100) : 0}% 覆盖率`, color: T.warn },
          {
            label: '本周待填写', value: stats.active, sub: stats.active > 0 ? '点击前往关键目标页' : '全部已更新',
            color: stats.active > 0 ? T.err : T.ok,
            onClick: () => navigate('/pm/goals'),
          },
        ].map((item, i) => (
          <div key={i} onClick={item.onClick} style={{
            background: T.s1, border: `1px solid ${T.hl}`, borderRadius: 12, padding: '18px 20px',
            transition: 'all 0.15s', cursor: item.onClick ? 'pointer' : 'default',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = T.s2; e.currentTarget.style.borderColor = T.hls; }}
            onMouseLeave={e => { e.currentTarget.style.background = T.s1; e.currentTarget.style.borderColor = T.hl; }}
          >
            <div style={{ fontSize: 12, color: T.ink4, marginBottom: 2 }}>{item.label}</div>
            <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.8px', lineHeight: 1.15, color: item.color }}>
              {item.value}
            </div>
            <div style={{ fontSize: 11, color: T.ink4, marginTop: 4 }}>{item.sub}</div>
          </div>
        ))}
      </div>

      {/* Banner — 跳转关键目标页 */}
      {stats.active > 0 && (
        <div onClick={() => navigate('/pm/goals')} style={{
          background: 'rgba(94,106,210,0.06)', border: '1px solid rgba(94,106,210,0.2)',
          borderRadius: 8, padding: '10px 14px', marginBottom: 24, cursor: 'pointer',
          fontSize: 12, color: T.p, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>📋</span> 当前 <strong>{stats.active}</strong> 个项目进行中，点击前往关键目标页跟踪进度
        </div>
      )}

      {/* 图表区域 2x2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* 部门分布 */}
        <div style={{ background: T.s1, border: `1px solid ${T.hl}`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: T.ink, display: 'flex', alignItems: 'center', gap: 8 }}>
            部门分布 <span style={{ fontSize: 12, color: T.ink4, fontWeight: 400 }}>{deptStats.length} 个部门</span>
          </div>
          {deptStats.slice(0, 6).map(([d, c]) => (
            <BarChartRow key={d} label={d} value={c} max={maxDept} fill={T.p} />
          ))}
        </div>

        {/* 月度营收 */}
        <div style={{ background: T.s1, border: `1px solid ${T.hl}`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: T.ink, display: 'flex', alignItems: 'center', gap: 8 }}>
            月度营收 <span style={{ fontSize: 12, color: T.ink4, fontWeight: 400 }}>{monthRevenue.length} 个月</span>
          </div>
          {monthRevenue.slice(-6).map(([m, v]) => (
            <BarChartRow key={m} label={m.slice(5) + '月'} value={v} max={maxMonthRev}
              fill="#e5484d" showVal={fmtMoney(v)} />
          ))}
          {monthRevenue.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: T.ink4, fontSize: 12 }}>暂无数据</div>
          )}
        </div>
      </div>

      {/* 最近项目 */}
      <div style={{ background: T.s1, border: `1px solid ${T.hl}`, borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>最近项目</span>
          <span style={{ fontSize: 12, color: T.ink4, fontWeight: 400, cursor: 'pointer' }} onClick={() => navigate('/pm/projects')}>
            查看全部 →
          </span>
        </div>
        {recentProjects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: T.ink4, fontSize: 13 }}>暂无项目</div>
        ) : (
          recentProjects.map(p => (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
              borderBottom: `1px solid ${T.hl}`, cursor: 'pointer', transition: 'background 0.1s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = T.s2; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              {/* 评级色标 */}
              <span style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: RATING_COLORS[p.projectLevel] || T.ink4,
              }} />
              {/* 名称 */}
              <span style={{ fontWeight: 500, fontSize: 13, color: T.ink, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.projectName}
              </span>
              {/* 经理 */}
              <span style={{ fontSize: 11, color: T.ink4, minWidth: 60 }}>{p.projectManager || '-'}</span>
              {/* 营收 */}
              <span style={{ fontSize: 12, color: T.ink2, minWidth: 70, textAlign: 'right' }}>{fmtMoney(p.projectAmount)}</span>
              {/* 状态 */}
              <span style={{
                fontSize: 10, padding: '3px 9px', borderRadius: 999, fontWeight: 500, whiteSpace: 'nowrap',
                background: p.projectStatus === '进行中' ? 'rgba(94,106,210,0.15)' : p.projectStatus === '已完成' ? 'rgba(39,166,68,0.15)' : 'rgba(138,143,152,0.1)',
                color: p.projectStatus === '进行中' ? T.p : p.projectStatus === '已完成' ? '#5ad478' : T.ink3,
              }}>
                {p.projectStatus || '-'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
