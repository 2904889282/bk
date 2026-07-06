import { useState, useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ProLayout } from '@ant-design/pro-components';
import { useAuth } from '../hooks/useAuth';
import { resolveMenuIcon } from '../utils/menuIcon';
import NotificationBell from '../components/notification/NotificationBell';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import {
  DashboardOutlined,
  LogoutOutlined,
  DesktopOutlined,
  SafetyOutlined,
  UserOutlined,
  SunOutlined,
  MoonOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { Dropdown, App, Typography, Space, Tooltip, Button } from 'antd';
import type { MenuDataItem } from '@ant-design/pro-components';
import { useTheme } from '../store/useTheme';
import { FALLBACK_MENUS, type MenuItem } from '../config/menus';

function toMenuItems(backend: MenuItem[], hasPermission: (code: string) => boolean): MenuDataItem[] {
  return backend
    .map(item => {
      if (!item.children || item.children.length === 0) {
        if (item.permCode && !hasPermission(item.permCode)) return null;
        return {
          path: item.path || '/',
          name: item.name,
          icon: resolveMenuIcon(item.icon),
        } as MenuDataItem;
      }
      const filteredChildren = toMenuItems(item.children, hasPermission);
      if (filteredChildren.length === 0) return null;
      return {
        name: item.name,
        key: item.path || item.name,
        icon: resolveMenuIcon(item.icon),
        children: filteredChildren,
      } as MenuDataItem;
    })
    .filter(Boolean) as MenuDataItem[];
}

export default function BasicLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasPermission, menus } = useAuth();
  const { message, modal } = App.useApp();
  const { isDark, toggleTheme } = useTheme();
  const [pathname, setPathname] = useState(location.pathname);

  const menuData = useMemo(() => {
    const source = (menus && menus.length > 0) ? menus as unknown as MenuItem[] : FALLBACK_MENUS;
    return toMenuItems(source, hasPermission);
  }, [menus, hasPermission]);

  const userMenuNode = (
    <Dropdown menu={{ items: [
      { key: 'info', icon: <UserOutlined />, label: `${user?.name} (${user?.roles?.includes('ROLE_ADMIN') ? '管理员' : '普通用户'})`, disabled: true },
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
      logo={<DashboardOutlined style={{ fontSize: 20, color: '#2563eb' }} />}
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
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    </ProLayout>
  );
}
