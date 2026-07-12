import { useState, useMemo } from 'react';
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
  HomeOutlined,
} from '@ant-design/icons';
import { Dropdown, App, Typography, Space, Tooltip, Button, Alert } from 'antd';
import type { MenuDataItem } from '@ant-design/pro-components';
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
  const [pathname, setPathname] = useState(location.pathname);
  const [demoBannerVisible, setDemoBannerVisible] = useState(true);
  const [checkingHealth, setCheckingHealth] = useState(false);

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
      return toMenuItems(source, hasPermission);
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
      logo={<Logo size={28} showText={false} />}
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
