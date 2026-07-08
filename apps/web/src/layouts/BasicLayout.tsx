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

function toMenuItems(backend: MenuItem[], hasPermission: (code: string) => boolean): MenuDataItem[] {
  if (!backend || !Array.isArray(backend)) return [];
  return backend
    .map(item => {
      if (!item) return null;
      if (!item.children || item.children.length === 0) {
        if (item.permCode && !hasPermission(item.permCode)) return null;
        return {
          path: item.path || '/',
          name: item.name || '',
          icon: resolveMenuIcon(item.icon),
        } as MenuDataItem;
      }
      const filteredChildren = toMenuItems(item.children, hasPermission);
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
      message.info('后端服务仍未连接，请确认是否已启动（cd apps/api && mvn spring-boot:run）');
    } finally {
      setCheckingHealth(false);
    }
  };
  const menuData = useMemo(() => {
    try {
      const source = (menus && menus.length > 0) ? menus as unknown as MenuItem[] : FALLBACK_MENUS;
      return toMenuItems(source, hasPermission);
    } catch {
      return [] as MenuDataItem[];
    }
  }, [menus, hasPermission]);

  const userMenuNode = (
    <Dropdown menu={{ items: [
      { key: 'info', icon: <UserOutlined />, label: `${user?.name || '用户'} (${(user?.roles || []).includes('ROLE_ADMIN') ? '管理员' : '普通用户'})`, disabled: true },
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
        <Typography.Text style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>{user?.name}</Typography.Text>
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
          {/* 悬停弹出切换面板 */}
          <div style={{
            position: 'absolute',
            left: 8,
            top: '100%',
            marginTop: 12,
            padding: '16px 20px',
            borderRadius: 12,
            background: isDark ? 'rgba(15,23,42,0.98)' : 'rgba(255,255,255,0.98)',
            backdropFilter: 'blur(16px)',
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.06)',
            boxShadow: isDark
              ? '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
              : '0 8px 32px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.04)',
            opacity: logoHovered ? 1 : 0,
            transform: logoHovered ? 'translateY(0) scale(1)' : 'translateY(-4px) scale(0.96)',
            pointerEvents: logoHovered ? 'auto' : 'none',
            transition: 'opacity 0.25s cubic-bezier(0.16,1,0.3,1), transform 0.25s cubic-bezier(0.16,1,0.3,1)',
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
              width: 32, height: 32, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              color: isDark ? '#94a3b8' : '#64748b',
            }}>
              {switchIcon}
            </div>
            <div>
              <Typography.Text strong style={{ fontSize: 13, color: isDark ? '#e2e8f0' : '#1e293b', display: 'block' }}>
                切换到
              </Typography.Text>
              <Typography.Text style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>
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
          message="演示模式"
          description={
            <Space direction="vertical" size={4}>
              <span>后端服务未连接，页面数据无法加载。请启动后端服务（cd apps/api && mvn spring-boot:run）后使用真实账号重新登录。</span>
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
