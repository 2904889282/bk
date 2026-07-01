import { Table, Tag, Button, message, Space, Card, Modal, Form, Input, Select } from 'antd';
import { PlusOutlined, CheckOutlined } from '@ant-design/icons';
import { useDataStore } from '../../../store/useDataStore';
import { type Risk } from '../../../types';
import { useState } from 'react';

export default function PmRisks() {
  const { risks, projects, addRisk, resolveRisk } = useDataStore();
  const [formOpen, setFormOpen] = useState(false);
  const [form] = Form.useForm();

  const onFinish = (values: Record<string, unknown>) => {
    addRisk(values as unknown as Omit<Risk, 'id' | 'createdAt' | 'status'>);
    message.success('风险已添加');
    form.resetFields();
    setFormOpen(false);
  };

  const columns = [
    { title: '风险项', dataIndex: 'type', key: 'type', width: 100, render: (v: string) => <strong>{v}</strong> },
    { title: '所属项目', dataIndex: 'projectId', key: 'projectId', width: 150, render: (id: string) => projects.find(p => p.id === id)?.name || id },
    { title: '风险描述', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: '影响等级', dataIndex: 'level', key: 'level', width: 90, render: (v: string) => <Tag color={v === 'high' ? 'red' : v === 'medium' ? 'orange' : 'blue'}>{v === 'high' ? '高' : v === 'medium' ? '中' : '低'}</Tag> },
    { title: '应对措施', dataIndex: 'solution', key: 'solution', width: 200, ellipsis: true },
    { title: '负责人', dataIndex: 'owner', key: 'owner', width: 80 },
    {
      title: '操作', key: 'action', width: 140, render: (_: unknown, r: { id: string; status: string }) =>
        r.status === 'open' ? (
          <Button size="small" type="primary" ghost icon={<CheckOutlined />} onClick={() => { resolveRisk(r.id); message.success('已标记已解决'); }}>
            标记已解决
          </Button>
        ) : <Tag color="green">已解决</Tag>,
    },
  ];

  return (
    <Card>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setFormOpen(true)}>新增风险</Button>
      </Space>
      <Table columns={columns} dataSource={risks} rowKey="id" size="middle" pagination={{ pageSize: 15, showTotal: t => `共 ${t} 条` }} />

      <Modal title="新增风险" open={formOpen} onCancel={() => setFormOpen(false)}
        onOk={async () => {
          try { const values = await form.validateFields(); onFinish(values); } catch {}
        }} width={600} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item name="type" label="风险项" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="projectId" label="关联项目" rules={[{ required: true }]}>
              <Select options={projects.map(p => ({ value: p.id, label: p.name }))} />
            </Form.Item>
            <Form.Item name="level" label="影响等级" initialValue="medium">
              <Select options={[{ value: 'high', label: '高' }, { value: 'medium', label: '中' }, { value: 'low', label: '低' }]} />
            </Form.Item>
            <Form.Item name="owner" label="负责人"><Input /></Form.Item>
          </div>
          <Form.Item name="description" label="风险描述"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="solution" label="应对措施"><Input /></Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
