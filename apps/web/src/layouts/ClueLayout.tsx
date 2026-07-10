import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Input } from 'antd';
import {
  SearchOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { useState } from 'react';

/* ============ 紫色品牌色系 ============ */
const BRAND = {
  50: '#EEEDFE',
  100: '#CECBF6',
  500: '#7F77DD',
  600: '#534AB7',
  700: '#3C3489',
};

const NAV_ITEMS = [
  { key: 'dashboard', route: '/ltc/dashboard', icon: '◆', label: '数据看板' },
  { key: 'board', route: '/ltc/kanban', icon: '▦', label: '线索看板' },
  { key: 'list', route: '/ltc/leads', icon: '☰', label: '线索列表' },
  { key: 'analytics', route: '/ltc/analysis', icon: '◫', label: '统计分析' },
  { key: 'review', route: '/ltc/alerts', icon: '✓', label: '评审管理' },
];

export default function ClueLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuth(s => s.user);
  const [searchValue, setSearchValue] = useState('');

  const activeKey = (() => {
    const p = location.pathname;
    if (p.startsWith('/ltc/dashboard')) return 'dashboard';
    if (p.startsWith('/ltc/kanban')) return 'board';
    if (p.startsWith('/ltc/leads')) return 'list';
    if (p.startsWith('/ltc/analysis')) return 'analytics';
    if (p.startsWith('/ltc/alerts')) return 'review';
    return 'dashboard';
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#F9FAFB' }}>
      {/* ===== 顶部导航栏 56px ===== */}
      <header style={{
        height: 56, flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '0 24px',
        background: '#fff',
        borderBottom: '1px solid #E5E7EB',
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/ltc/dashboard')}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: `linear-gradient(135deg, ${BRAND[600]}, ${BRAND[500]})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 16, fontWeight: 700,
          }}>
            贝
          </div>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#111827', letterSpacing: '-0.3px' }}>贝壳管理平台</span>
        </div>

        {/* 搜索框 */}
        <Input
          placeholder="搜索线索名称、客户公司...  (/)"
          prefix={<SearchOutlined style={{ color: '#9CA3AF' }} />}
          value={searchValue}
          onChange={e => setSearchValue(e.target.value)}
          onPressEnter={() => navigate(`/ltc/leads?search=${encodeURIComponent(searchValue)}`)}
          allowClear
          style={{ flex: 1, maxWidth: 420, borderRadius: 8 }}
        />

        <div style={{ flex: 1 }} />

        {/* 右侧图标 */}
        <span style={{
          width: 36, height: 36, borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#9CA3AF', fontSize: 18,
          transition: 'all 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = BRAND[50]; e.currentTarget.style.color = BRAND[500]; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}
        >
          <BellOutlined />
        </span>

        {/* 用户头像 */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '4px 12px 4px 4px', borderRadius: 8,
          cursor: 'pointer', transition: 'all 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = BRAND[50]; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: `linear-gradient(135deg, ${BRAND[600]}, ${BRAND[500]})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 12, fontWeight: 600, flexShrink: 0,
          }}>
            {user?.name?.[0] || '贝'}
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>
            {user?.name || '用户'}
          </div>
        </div>
      </header>

      {/* ===== 主体区域 ===== */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* ===== 左侧边栏 200px ===== */}
        <aside style={{
          width: 200, flexShrink: 0,
          background: '#fff',
          borderRight: '1px solid #E5E7EB',
          display: 'flex', flexDirection: 'column',
          padding: '8px', gap: 2,
          overflowY: 'auto',
        }}>
          {/* 线索管理导航 */}
          <div style={{
            fontSize: 10, fontWeight: 600,
            color: BRAND[500],
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            padding: '12px 12px 6px',
          }}>
            线索管理
          </div>

          {NAV_ITEMS.map(item => {
            const isActive = item.key === activeKey;
            return (
              <div
                key={item.key}
                onClick={() => navigate(item.route)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', borderRadius: 8,
                  color: isActive ? BRAND[600] : '#6B7280',
                  fontSize: 13, cursor: 'pointer',
                  background: isActive ? BRAND[50] : 'transparent',
                  fontWeight: isActive ? 500 : 400,
                  transition: 'all 0.12s',
                  position: 'relative',
                }}
                onMouseEnter={e => {
                  if (!isActive) e.currentTarget.style.background = BRAND[50];
                }}
                onMouseLeave={e => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                {/* 活跃指示条 */}
                <span style={{
                  width: 3, height: 16, borderRadius: 2,
                  background: isActive ? BRAND[500] : 'transparent',
                  position: 'absolute', left: 2,
                  transition: 'all 0.15s',
                }} />
                <span style={{ width: 16, textAlign: 'center', flexShrink: 0, fontSize: 13 }}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
            );
          })}

          <div style={{ height: 1, background: BRAND[100], margin: '8px 8px' }} />

          {/* 管理区导航 */}
          <div style={{
            fontSize: 10, fontWeight: 600,
            color: BRAND[500],
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            padding: '8px 12px 6px',
          }}>
            管理
          </div>
          {[
            { icon: '◉', label: '客户管理', route: '/ltc/leads' },
            { icon: '◒', label: '团队管理', route: '/admin/users' },
            { icon: '⚙', label: '系统设置', route: '/admin/depts' },
          ].map(item => (
            <div
              key={item.label}
              onClick={() => navigate(item.route)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', borderRadius: 8,
                color: '#6B7280', fontSize: 13,
                cursor: 'pointer', transition: 'all 0.12s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = BRAND[50];
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ width: 16, textAlign: 'center', flexShrink: 0, fontSize: 13 }}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </div>
          ))}

          {/* 底部用户卡片 */}
          <div style={{
            marginTop: 'auto',
            display: 'flex', alignItems: 'center', gap: 10,
            padding: 10, borderRadius: 8,
            background: '#F9FAFB',
            border: '1px solid #F3F4F6',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: `linear-gradient(135deg, ${BRAND[600]}, ${BRAND[500]})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 600, color: '#fff', flexShrink: 0,
            }}>
              {user?.name?.[0] || '贝'}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#111827' }}>
                {user?.name || '用户'}
              </div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                {(user?.roles || []).includes('ROLE_ADMIN') ? '管理员' : '销售经理'}
              </div>
            </div>
          </div>
        </aside>

        {/* ===== 右侧内容区 ===== */}
        <main style={{
          flex: 1, overflowY: 'auto', overflowX: 'hidden',
          background: '#F9FAFB',
        }}>
          <div style={{ padding: 24 }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
