import { useState, useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ProLayout, PageContainer } from '@ant-design/pro-components';
import { useAuth } from '../hooks/useAuth';
import NotificationBell from '../components/notification/NotificationBell';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import { DashboardOutlined, FundOutlined, AlertOutlined, PieChartOutlined, ProjectOutlined, SafetyOutlined, TeamOutlined, SettingOutlined, UserOutlined, DeleteOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { Dropdown, message } from 'antd';
import type { MenuDataItem } from '@ant-design/pro-components';

/** 递归过滤无权限的菜单项 */
function filterByPermission(items: MenuDataItem[], hasPermission: (code: string) => boolean): MenuDataItem[] {
  return items
    .map(item => {
      // 没有子菜单 → 需要权限码
      if (!item.children || item.children.length === 0) {
        const permCode = (item as Record<string, unknown>).permCode as string | undefined;
        if (permCode && !hasPermission(permCode)) return null;
        return item;
      }
      // 有子菜单 → 递归过滤子项，子项全空则隐藏父级
      const filteredChildren = filterByPermission(item.children, hasPermission);
      if (filteredChildren.length === 0) return null;
      return { ...item, children: filteredChildren };
    })
    .filter(Boolean) as MenuDataItem[];
}

/** 给菜单项绑定权限码 */
function withPerm(path: string, name: string, icon: React.ReactNode, permCode?: string): MenuDataItem {
  return { path, name, icon, permCode } as MenuDataItem;
}

export default function BasicLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasPermission } = useAuth();
  const [pathname, setPathname] = useState(location.pathname);

  const allMenus: MenuDataItem[] = [
    { path: '/', name: '🏠 工作台', icon: <DashboardOutlined /> },
    {
      name: '📊 LTC 管线管理', key: 'ltc', icon: <FundOutlined />,
      children: [
        withPerm('/ltc/kanban', '管线看板', <FundOutlined />, 'pipeline:create'),
        withPerm('/ltc/pipeline', '管线列表', <UnorderedListOutlined />, 'pipeline:create'),
        withPerm('/ltc/alerts', '预警中心', <AlertOutlined />, 'alert:list'),
        withPerm('/ltc/analysis', '数据分析', <PieChartOutlined />, 'pipeline:create'),
        withPerm('/ltc/leads', '线索管理', <AlertOutlined />, 'clue:list'),
      ],
    },
    {
      name: '🎯 项目管理', key: 'pm', icon: <ProjectOutlined />,
      children: [
        withPerm('/pm/kanban', '项目看板', <ProjectOutlined />, 'project:list'),
        withPerm('/pm/projects', '项目列表', <UnorderedListOutlined />, 'project:list'),
        withPerm('/pm/risks', '风险管理', <SafetyOutlined />, 'risk:list'),
        withPerm('/pm/talent', '人才池', <TeamOutlined />, 'talent:list'),
      ],
    },
    // 系统管理（仅管理员可见）
    ...(user?.roles?.includes('ROLE_ADMIN') ? [{
      name: '⚙️ 系统管理', key: 'admin', icon: <SettingOutlined />,
      children: [
        withPerm('/admin/users', '用户管理', <UserOutlined />, 'system:user:list'),
        withPerm('/admin/recycle', '数据回收站', <DeleteOutlined />, 'clue:list'),
      ],
    }] : []),
  ];

  const menuData = useMemo(() => filterByPermission(allMenus, hasPermission), [user, hasPermission]);

  return (
    <ProLayout
      title="贝壳管理平台"
      logo={<span style={{ fontSize: 22 }}>🐚</span>}
      menuDataRender={() => menuData}
      menuItemRender={(item, dom) => (
        <a onClick={() => { setPathname(item.path || '/'); navigate(item.path || '/'); }}>{dom}</a>
      )}
      location={{ pathname }}
      avatarProps={{
        src: undefined,
        title: user?.name,
        render: () => (
          <Dropdown menu={{ items: [
            { key: 'info', label: `👤 ${user?.name} (${user?.roles?.includes('ROLE_ADMIN') ? '管理员' : user?.roles?.[0] || '用户'})`, disabled: true },
            { type: 'divider' },
            { key: 'pwd', label: '🔒 修改密码', onClick: () => message.info('请联系管理员修改密码') },
            { type: 'divider' },
            { key: 'logout', label: '🚪 退出登录', onClick: () => { logout(); navigate('/login'); } },
          ]}} trigger={['click']}>
            <span style={{ cursor: 'pointer', userSelect: 'none', marginRight: 8 }}>
              {user?.avatar} {user?.name}
            </span>
          </Dropdown>
        ),
      }}
      actionsRender={() => [<NotificationBell key="bell" />]}
      menuFooterRender={(props) => props?.collapsed ? undefined : <div style={{ textAlign: 'center', padding: 12, color: '#999', fontSize: 12 }}>v4.0 · React</div>}
    >
      <PageContainer header={{ title: false, breadcrumb: {} }}>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </PageContainer>
    </ProLayout>
  );
}
