/**
 * 项目管理板块布局 — Linear 暗色设计系统
 * 设计参考: 项目管理系统_完整规范文档.md v2
 */
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Input } from 'antd';
import { SearchOutlined, BellOutlined } from '@ant-design/icons';
import { useState } from 'react';

/* Linear 风格暗色设计令牌 */
const TOKENS = {
  bg:    '#010102',
  s1:    '#0f1011',
  s2:    '#141516',
  hl:    '#23252a',
  hls:   '#34343a',
  ink:   '#f7f8f8',
  ink2:  '#d0d6e0',
  ink3:  '#8a8f98',
  ink4:  '#757880',
  p:     '#5e6ad2',
  ok:    '#27a644',
  warn:  '#d4a030',
  err:   '#e05050',
};

const NAV_ITEMS = [
  { key: 'dashboard', route: '/pm/dashboard', icon: '◆', label: '数据看板' },
  { key: 'board',     route: '/pm/board',     icon: '▦', label: '项目看板' },
  { key: 'list',      route: '/pm/projects',  icon: '☰', label: '项目列表' },
  { key: 'goals',     route: '/pm/goals',     icon: '◎', label: '关键目标' },
  { key: 'revenue',   route: '/pm/revenue',   icon: '¥', label: '营收分析' },
  { key: 'team',      route: '/pm/team',      icon: '◒', label: '团队管理' },
  { key: 'staff',     route: '/pm/staff',     icon: '▣', label: '人员分配' },
  { key: 'gantt',     route: '/pm/gantt',     icon: '▬', label: '甘特图' },
];

export default function PMLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuth(s => s.user);
  const [searchValue, setSearchValue] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  const activeKey = NAV_ITEMS.find(item => location.pathname.startsWith(item.route))?.key || 'dashboard';

  const navStyle = (key: string): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 10,
    padding: collapsed ? '8px 4px' : '7px 10px',
    borderRadius: 6, cursor: 'pointer', fontSize: 13,
    color: key === activeKey ? TOKENS.ink : TOKENS.ink3,
    background: key === activeKey ? TOKENS.s2 : 'transparent',
    fontWeight: key === activeKey ? 500 : 400,
    transition: 'all 0.12s',
    justifyContent: collapsed ? 'center' : 'flex-start',
    position: 'relative' as const,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: TOKENS.bg, color: TOKENS.ink }}>
      {/* 顶部导航栏 56px */}
      <header style={{
        height: 56, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 16,
        padding: '0 20px', background: 'rgba(1,1,2,0.85)', backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${TOKENS.hl}`, zIndex: 200,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => navigate('/pm/dashboard')}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: TOKENS.p }} />
          <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.3px' }}>贝壳项目管理</span>
        </div>
        <Input
          placeholder="搜索项目...  (Ctrl+K)"
          prefix={<SearchOutlined style={{ color: TOKENS.ink4 }} />}
          value={searchValue}
          onChange={e => setSearchValue(e.target.value)}
          onPressEnter={() => { if (searchValue.trim()) navigate(`/pm/projects?search=${encodeURIComponent(searchValue)}`); }}
          style={{ flex: 1, maxWidth: 380, background: TOKENS.s1, border: `1px solid ${TOKENS.hl}`, borderRadius: 8, color: TOKENS.ink }}
        />
        <div style={{ flex: 1 }} />
        <span style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: TOKENS.ink4 }}>
          <BellOutlined />
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px 4px 4px', borderRadius: 8, cursor: 'pointer' }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: TOKENS.p, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 600 }}>
            {user?.name?.[0] || '贝'}
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: TOKENS.ink2 }}>{user?.name || '用户'}</span>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* 侧边栏 */}
        <aside style={{
          width: collapsed ? 52 : 220, flexShrink: 0,
          background: TOKENS.bg, borderRight: `1px solid ${TOKENS.hl}`,
          display: 'flex', flexDirection: 'column', padding: collapsed ? 4 : 8, gap: 2,
          transition: 'width 0.2s ease', overflow: 'hidden',
        }}>
          <div style={{ padding: collapsed ? '4px' : '16px 12px 6px', fontSize: 10, fontWeight: 600, color: TOKENS.ink4, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            {collapsed ? '' : '项目管理'}
          </div>
          {NAV_ITEMS.map(item => (
            <div key={item.key} onClick={() => navigate(item.route)} style={navStyle(item.key)}
              onMouseEnter={e => { if (item.key !== activeKey) { e.currentTarget.style.background = TOKENS.s1; e.currentTarget.style.color = TOKENS.ink; }}}
              onMouseLeave={e => { if (item.key !== activeKey) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = TOKENS.ink3; }}}
            >
              <span style={{ width: 16, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </div>
          ))}
          <div style={{ height: 1, background: TOKENS.hl, margin: '6px 8px' }} />
          <div onClick={() => setCollapsed(!collapsed)} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
            borderRadius: 6, cursor: 'pointer', color: TOKENS.ink4, fontSize: 13,
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}>
            <span>{collapsed ? '▶' : '◀'}</span>
            {!collapsed && <span>收起</span>}
          </div>
          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 8, background: TOKENS.s1 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: TOKENS.p, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
              {user?.name?.[0] || '贝'}
            </div>
            {!collapsed && <div><div style={{ fontSize: 12, fontWeight: 500 }}>{user?.name || '用户'}</div><div style={{ fontSize: 11, color: TOKENS.ink4 }}>{user?.roles?.includes('ROLE_ADMIN') ? '管理员' : '成员'}</div></div>}
          </div>
        </aside>

        {/* 主内容区 */}
        <main style={{ flex: 1, overflowY: 'auto', padding: 24, background: TOKENS.bg }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
