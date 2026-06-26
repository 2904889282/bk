import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ProLayout, PageContainer } from '@ant-design/pro-components';
import { useAuth } from '../hooks/useAuth';
import NotificationBell from '../components/notification/NotificationBell';
import { DashboardOutlined, FundOutlined, AlertOutlined, PieChartOutlined, ProjectOutlined, SafetyOutlined, TeamOutlined, SettingOutlined, UserOutlined, DeleteOutlined } from '@ant-design/icons';
import { Dropdown, message } from 'antd';
import type { MenuDataItem } from '@ant-design/pro-components';

export default function BasicLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, menus } = useAuth();
  const [pathname, setPathname] = useState(location.pathname);

  const menuData: MenuDataItem[] = [
    { path: '/', name: '🏠 工作台', icon: <DashboardOutlined /> },
    {
      name: '📊 LTC 管线管理', key: 'ltc', icon: <FundOutlined />,
      children: [
        { path: '/ltc/kanban', name: '管线看板', icon: <FundOutlined /> },
        { path: '/ltc/pipeline', name: '管线列表', icon: <DashboardOutlined /> },
        { path: '/ltc/alerts', name: '预警中心', icon: <AlertOutlined /> },
        { path: '/ltc/analysis', name: '数据分析', icon: <PieChartOutlined /> },
        { path: '/ltc/leads', name: '线索管理', icon: <AlertOutlined /> },
      ],
    },
    {
      name: '🎯 项目管理', key: 'pm', icon: <ProjectOutlined />,
      children: [
        { path: '/pm/kanban', name: '项目看板', icon: <ProjectOutlined /> },
        { path: '/pm/projects', name: '项目列表', icon: <DashboardOutlined /> },
        { path: '/pm/risks', name: '风险管理', icon: <SafetyOutlined /> },
        { path: '/pm/talent', name: '人才池', icon: <TeamOutlined /> },
      ],
    },
    // 系统管理（仅管理员可见）
    ...(user?.roles?.includes('ROLE_ADMIN') ? [{
      name: '⚙️ 系统管理', key: 'admin', icon: <SettingOutlined />,
      children: [
        { path: '/admin/users', name: '用户管理', icon: <UserOutlined /> },
        { path: '/admin/recycle', name: '数据回收站', icon: <DeleteOutlined /> },
      ],
    }] : []),
  ];

  return (
    <ProLayout
      title="贝壳管理平台"
      logo="🐚"
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
        <Outlet />
      </PageContainer>
    </ProLayout>
  );
}
