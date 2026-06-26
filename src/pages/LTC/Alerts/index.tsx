import { Table, Tag, Button, message, Space, Card } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { useDataStore } from '../../../store/useDataStore';

export default function LtcAlerts() {
  const { alerts, resolveAlert, pipelines } = useDataStore();

  const columns = [
    { title: '预警类型', dataIndex: 'type', key: 'type', width: 100, render: (v: string) => <Tag color="red">{v}</Tag> },
    { title: '关联管线', dataIndex: 'pipelineId', key: 'pipelineId', width: 180, render: (id: string) => pipelines.find(p => p.id === id)?.name || id },
    { title: '问题描述', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: '严重程度', dataIndex: 'level', key: 'level', width: 100, render: (v: string) => <Tag color={v === 'high' ? 'red' : 'orange'}>{v === 'high' ? '高' : '中'}</Tag> },
    { title: '负责人', dataIndex: 'manager', key: 'manager', width: 80 },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 120 },
    {
      title: '操作', key: 'action', width: 140, render: (_: unknown, r: { id: string; status: string }) =>
        r.status === 'open' ? (
          <Button size="small" type="primary" ghost icon={<CheckOutlined />} onClick={() => { resolveAlert(r.id); message.success('已标记完成处理'); }}>
            标记已处理
          </Button>
        ) : <Tag color="green">已处理</Tag>,
    },
  ];

  return (
    <Card>
      <Table columns={columns} dataSource={alerts} rowKey="id" size="middle"
        pagination={{ pageSize: 15, showTotal: t => `共 ${t} 条` }} />
    </Card>
  );
}
