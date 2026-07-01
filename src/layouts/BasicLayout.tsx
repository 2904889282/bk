import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import NotificationBell from '../components/notification/NotificationBell';
import { Dropdown, Avatar, Space, message } from 'antd';
import type { MenuProps } from 'antd';
import {
  UserOutlined,
  KeyOutlined,
  LogoutOutlined,
  DownOutlined,
} from '@ant-design/icons';

export default function BasicLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => message.info('个人中心（待建设）'),
    },
    {
      key: 'password',
      icon: <KeyOutlined />,
      label: '修改密码',
      onClick: () => message.info('请联系管理员修改密码'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}>
      {/* ===== 顶部通栏 ===== */}
      <header
        style={{
          height: 64,
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}
      >
        {/* 左侧：Logo + 名称 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, userSelect: 'none' }}>
          <span style={{ fontSize: 24, lineHeight: 1 }}>🐚</span>
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#1a1a1a',
              letterSpacing: 1,
            }}
          >
            贝壳管理平台
          </span>
        </div>

        {/* 右侧：通知铃铛 + 用户下拉 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <NotificationBell />
          <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
            <Space
              style={{
                cursor: 'pointer',
                padding: '6px 10px',
                borderRadius: 6,
                transition: 'background 0.2s',
              }}
              className="user-dropdown-trigger"
            >
              <Avatar
                style={{ backgroundColor: '#6366f1', verticalAlign: 'middle', flexShrink: 0 }}
                size="small"
              >
                {user?.name?.[0] || 'U'}
              </Avatar>
              <span style={{ fontSize: 14, color: '#333', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || '用户'}
              </span>
              <DownOutlined style={{ fontSize: 10, color: '#999' }} />
            </Space>
          </Dropdown>
        </div>
      </header>

      {/* ===== 主体内容区 ===== */}
      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 1200,
          margin: '0 auto',
          padding: '24px',
          boxSizing: 'border-box',
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
