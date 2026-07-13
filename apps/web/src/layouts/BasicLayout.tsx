import { useState, useMemo, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ProLayout } from '@ant-design/pro-components';
import { useAuth } from '../hooks/useAuth';
import { resolveMenuIcon } from '../utils/menuIcon';
import NotificationBell from '../components/notification/NotificationBell';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import Logo from '../components/ui/Logo';
import {
  LogoutOutlined,
  DesktopOutlined,
  SafetyOutlined,
  UserOutlined,
  SunOutlined,
  MoonOutlined,
  HomeOutlined,
  ThunderboltOutlined,
  ProjectOutlined,
} from '@ant-design/icons';
import { Dropdown, App, Typography, Space, Tooltip, Button, Alert } from 'antd';
import type { MenuDataItem } from '@ant-design/pro-components';
import { useTheme } from '../store/useTheme';
import { FALLBACK_MENUS, type MenuItem } from '../config/menus';

function toMenuItems(backend: MenuItem[]): MenuDataItem[] {
  if (!backend || !Array.isArray(backend)) return [];
  return backend
    .map(item => {
      if (!item) return null;
      if (!item.children || item.children.length === 0) {
        return {
          path: item.path || '/',
          name: item.name || '',
          icon: resolveMenuIcon(item.icon),
        } as MenuDataItem;
      }
      const filteredChildren = toMenuItems(item.children);
      if (filteredChildren.length === 0) return null;
      return {
        name: item.name || '',
        key: item.path || item.name || '/',
        icon: resolveMenuIcon(item.icon),
        children: filteredChildren,
      } as MenuDataItem;
    })
    .filter(Boolean) as MenuDataItem[];
}

export default function BasicLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasPermission, menus, isMockMode } = useAuth();
  const { message, modal } = App.useApp();
  const { isDark, toggleTheme } = useTheme();
  const [pathname, setPathname] = useState(location.pathname);
  const [demoBannerVisible, setDemoBannerVisible] = useState(true);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [logoHovered, setLogoHovered] = useState(false);
  const logoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const demoMode = isMockMode();
  const inLTC = pathname.startsWith('/ltc');
  const switchTarget = inLTC ? '/pm/kanban' : '/ltc/kanban';
  const switchLabel = inLTC ? '项目板块' : '线索板块';
  const switchIcon = inLTC ? <ProjectOutlined /> : <ThunderboltOutlined />;

  const handleLogoEnter = () => {
    if (logoTimer.current) clearTimeout(logoTimer.current);
    setLogoHovered(true);
  };
  const handleLogoLeave = () => {
    logoTimer.current = setTimeout(() => setLogoHovered(false), 200);
  };

  /** 检测后端是否在线，在线则切换到真实模式 */
  const handleCheckConnection = async () => {
    setCheckingHealth(true);
    try {
      const resp = await fetch('/api/health');
      if (resp.ok) {
        message.success('后端服务已就绪，正在切换到真实模式...');
        setTimeout(() => { logout(); navigate('/login', { replace: true }); }, 800);
      } else {
        message.warning('后端服务返回异常状态，请检查后端日志');
      }
    } catch {
      message.info('后端服务仍未连接，请确认是否已启动（cd apps/api-py && python main.py）');
    } finally {
      setCheckingHealth(false);
    }
  };
  const menuData = useMemo(() => {
    try {
      const source = (menus && menus.length > 0) ? menus as unknown as MenuItem[] : FALLBACK_MENUS;
      return toMenuItems(source);
    } catch {
      return [] as MenuDataItem[];
    }
  }, [menus, hasPermission]);

  const userMenuNode = (
    <Dropdown menu={{ items: [
      { key: 'info', icon: <UserOutlined />, label: `${user?.name || '用户'}`, disabled: true },
      { type: 'divider' },
      { key: 'devices', icon: <DesktopOutlined />, label: '设备管理', onClick: () => navigate('/account/devices') },
      { key: 'pwd', icon: <SafetyOutlined />, label: '修改密码', onClick: () => message.info('请联系管理员修改密码') },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true, onClick: () => {
        modal.confirm({
          title: '确认退出', content: '退出后需要重新登录，确定要退出当前账户吗？',
          okText: '确定退出', cancelText: '取消', okButtonProps: { danger: true },
          onOk: () => { logout(); navigate('/login'); },
        });
      } },
    ]}} trigger={['click']} placement="bottomRight">
      <Space style={{ cursor: 'pointer', userSelect: 'none' }}>
        <Typography.Text style={{ color: 'var(--veer-body)', fontSize: 13 }}>{user?.name}</Typography.Text>
      </Space>
    </Dropdown>
  );

  return (
    <ProLayout
      title="贝壳管理平台"
      logo={
        <div
          onMouseEnter={handleLogoEnter}
          onMouseLeave={handleLogoLeave}
          style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
        >
          <Logo size={28} showText={false} />
          {/* 悬停弹出切换面板 — Vercel 层叠阴影风格 */}
          <div style={{
            position: 'absolute',
            left: 8,
            top: '100%',
            marginTop: 12,
            padding: '16px 20px',
            borderRadius: 12,
            background: isDark ? '#0a0a0a' : '#ffffff',
            border: isDark ? '1px solid #2a2a2a' : '1px solid #ebebeb',
            boxShadow: isDark
              ? '0px 2px 4px rgba(0,0,0,0.35), 0px 8px 16px -4px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.06) inset'
              : '0px 2px 2px rgba(0,0,0,0.04), 0px 8px 16px -4px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.08) inset',
            opacity: logoHovered ? 1 : 0,
            transform: logoHovered ? 'translateY(0) scale(1)' : 'translateY(-4px) scale(0.96)',
            pointerEvents: logoHovered ? 'auto' : 'none',
            transition: 'opacity 0.2s cubic-bezier(0.4,0,0.2,1), transform 0.2s cubic-bezier(0.4,0,0.2,1)',
            whiteSpace: 'nowrap',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            cursor: 'pointer',
          }}
            onClick={() => { setLogoHovered(false); navigate(switchTarget); }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isDark ? '#141414' : '#f5f5f5',
              color: isDark ? '#a1a1a1' : '#4d4d4d',
            }}>
              {switchIcon}
            </div>
            <div>
              <Typography.Text strong style={{ fontSize: 13, color: isDark ? '#fafafa' : '#171717', display: 'block' }}>
                切换到
              </Typography.Text>
              <Typography.Text style={{ fontSize: 12, color: isDark ? '#a1a1a1' : '#4d4d4d' }}>
                {switchLabel}
              </Typography.Text>
            </div>
          </div>
        </div>
      }
      menuDataRender={() => menuData}
      menuItemRender={(item, dom) => (
        <a onClick={() => { setPathname(item.path || '/'); navigate(item.path || '/'); }}>{dom}</a>
      )}
      location={{ pathname }}
      layout="top"
      contentWidth="Fixed"
      fixedHeader
      actionsRender={() => [
        <Tooltip key="home" title="工作台">
          <Button type="text" icon={<HomeOutlined />} onClick={() => { setPathname('/'); navigate('/'); }} />
        </Tooltip>,
        <Tooltip key="theme" title={isDark ? '切换到亮色模式' : '切换到暗色模式'}>
          <Button type="text" icon={isDark ? <SunOutlined /> : <MoonOutlined />} onClick={toggleTheme} />
        </Tooltip>,
        <NotificationBell key="bell" />,
        userMenuNode,
      ]}
    >
      {demoMode && demoBannerVisible && (
        <Alert
          type="warning"
          showIcon
          closable
          title="演示模式"
          description={
            <Space orientation="vertical" size={4}>
              <span>后端服务未连接，页面数据无法加载。请启动后端服务（cd apps/api-py && python main.py）后使用真实账号重新登录。</span>
              <Button size="small" loading={checkingHealth} onClick={handleCheckConnection}>
                检查连接
              </Button>
            </Space>
          }
          style={{ marginBottom: 16 }}
          afterClose={() => setDemoBannerVisible(false)}
        />
      )}
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    </ProLayout>
  );
}
