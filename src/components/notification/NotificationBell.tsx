import { useEffect } from 'react';
import { Badge, Popover, List, Empty, Typography, Button } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { useWebSocket } from '../../hooks/useWebSocket';

const { Text } = Typography;

export default function NotificationBell() {
  const { connected, notifications, unreadCount, connect, markAllRead } = useWebSocket();

  useEffect(() => { connect(); }, [connect]);

  const content = (
    <div style={{ width: 320, maxHeight: 400, overflow: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
        <Text strong>消息通知</Text>
        <Text type="secondary" style={{ fontSize: 11 }}>{connected ? '🟢 在线' : '🔴 离线'}</Text>
      </div>
      {notifications.length === 0 ? (
        <Empty description="暂无通知" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <List dataSource={notifications} renderItem={(item) => (
          <List.Item style={{ padding: '8px 0' }}>
            <div>
              <Text strong style={{ fontSize: 13 }}>{item.title}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>{item.content}</Text>
              <br />
              <Text style={{ fontSize: 10, color: '#bbb' }}>{item.timestamp?.slice(0, 19)}</Text>
            </div>
          </List.Item>
        )} />
      )}
      {unreadCount > 0 && (
        <Button type="link" size="small" onClick={markAllRead} style={{ padding: 0 }}>
          全部标为已读
        </Button>
      )}
    </div>
  );

  return (
    <Popover content={content} trigger="click" placement="bottomRight" arrow={false}>
      <Badge count={unreadCount} size="small" offset={[-2, 2]}>
        <BellOutlined style={{ fontSize: 18, cursor: 'pointer', color: '#666' }} />
      </Badge>
    </Popover>
  );
}
