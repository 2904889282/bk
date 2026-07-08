import { useEffect, useState } from 'react';
import { Table, Button, Popconfirm, Typography, message, Tag, Card, Space } from 'antd';
import { DesktopOutlined, MobileOutlined, GlobalOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth';
import { fetchDevices, kickDevice, kickAllDevices } from '../../api/account';
import type { LoginDevice } from '../../api/account';

const parseUA = (ua?: string): string => {
  if (!ua) return '未知';
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'Mac';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('Linux')) return 'Linux';
  return '未知';
};

const getDeviceIcon = (ua?: string) => {
  if (ua && (ua.includes('iPhone') || ua.includes('Android') || ua.includes('iPad'))) {
    return <MobileOutlined />;
  }
  return <DesktopOutlined />;
};

const timeAgo = (t: string): string => {
  if (!t) return '';
  const diff = Date.now() - new Date(t).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  return `${days} 天前`;
};

export default function DevicesPage() {
  const { isMockMode } = useAuth();
  const demoMode = isMockMode();

  const [devices, setDevices] = useState<LoginDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [kickingAll, setKickingAll] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchDevices();
      setDevices(data);
    } catch (err: unknown) {
      if (!(err as { __mockToken?: boolean }).__mockToken) {
        message.error('加载设备列表失败');
      }
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleKick = async (id: number) => {
    try {
      await kickDevice(id);
      message.success('已强制下线');
      load();
    } catch {
      message.error('操作失败');
    }
  };

  const handleKickAll = async () => {
    setKickingAll(true);
    try {
      await kickAllDevices();
      message.success('已踢出所有其他设备');
      load();
    } catch {
      message.error('操作失败');
    }
    setKickingAll(false);
  };

  const columns = [
    {
      title: '设备',
      dataIndex: 'userAgent',
      key: 'device',
      render: (ua: string, record: LoginDevice) => (
        <span>
          {getDeviceIcon(ua)} <span style={{ marginLeft: 8 }}>{parseUA(ua)}</span>
          {record.isCurrent && <Tag color="blue" style={{ marginLeft: 8 }}>当前设备</Tag>}
        </span>
      ),
    },
    {
      title: 'IP',
      dataIndex: 'ip',
      key: 'ip',
      render: (ip: string) => (
        <span><GlobalOutlined style={{ marginRight: 4 }} />{ip || '未知'}</span>
      ),
    },
    {
      title: '登录时间',
      dataIndex: 'loginTime',
      key: 'loginTime',
      width: 160,
    },
    {
      title: '最近活跃',
      dataIndex: 'lastActive',
      key: 'lastActive',
      render: (t: string) => timeAgo(t),
      width: 120,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: LoginDevice) => (
        record.isCurrent ? (
          <span style={{ color: '#999' }}>当前</span>
        ) : (
          <Popconfirm
            title="确认踢下线？"
            description="该设备将无法继续访问系统"
            onConfirm={() => handleKick(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" danger size="small">踢下线</Button>
          </Popconfirm>
        )
      ),
    },
  ];

  return (
    <Card
      title={<span><DesktopOutlined style={{ marginRight: 8 }} />登录设备管理</span>}
      extra={
        <Popconfirm
          title="确认踢出所有其他设备？"
          description="除当前设备外，所有其他登录将被强制下线"
          icon={<ExclamationCircleOutlined style={{ color: '#faad14' }} />}
          onConfirm={handleKickAll}
          okText="确认"
          cancelText="取消"
        >
          <Button danger loading={kickingAll}>踢出所有其他设备</Button>
        </Popconfirm>
      }
    >
      <Table
        dataSource={devices}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
        locale={{
          emptyText: demoMode && !loading ? (
            <Space direction="vertical" size={8} style={{ padding: 24 }}>
              <Typography.Text type="secondary">演示模式下无法加载设备数据</Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>请启动后端服务后使用真实账号重新登录</Typography.Text>
            </Space>
          ) : '暂无登录设备记录',
        }}
      />
    </Card>
  );
}
