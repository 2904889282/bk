import { Table, Tag, Progress, Space, Card, Button, Modal, Form, Input, InputNumber, Select, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useDataStore } from '../../../store/useDataStore';
import { type Talent } from '../../../types';
import { useState } from 'react';

export default function PmTalent() {
  const { talent, addTalent } = useDataStore();
  const [formOpen, setFormOpen] = useState(false);
  const [form] = Form.useForm();

  const onFinish = (values: Record<string, unknown>) => {
    addTalent(values as unknown as Omit<Talent, 'id'>);
    message.success('人才已添加');
    form.resetFields();
    setFormOpen(false);
  };

  const columns = [
    { title: '姓名', dataIndex: 'name', key: 'name', width: 80, render: (v: string) => <strong>{v}</strong> },
    { title: '角色', dataIndex: 'role', key: 'role', width: 100 },
    { title: '技能标签', dataIndex: 'skills', key: 'skills', width: 200, render: (v: string) => <Space size={4}>{v.split(',').map((s: string) => <Tag key={s} color="blue">{s.trim()}</Tag>)}</Space> },
    { title: '当前项目', dataIndex: 'currentProject', key: 'currentProject', width: 160, ellipsis: true },
    { title: '利用率', dataIndex: 'utilization', key: 'utilization', width: 150, render: (v: number) => (
      <Space><Progress percent={v} size="small" style={{ width: 80 }} strokeColor={v > 85 ? '#f59e0b' : v > 60 ? '#10b981' : '#6366f1'} />{v}%</Space>
    )},
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (v: string) => {
      const map: Record<string, { color: string; label: string }> = { normal: { color: 'green', label: '正常' }, high: { color: 'orange', label: '高负荷' }, overload: { color: 'red', label: '超负荷' }, idle: { color: 'blue', label: '空闲' } };
      return <Tag color={map[v]?.color}>{map[v]?.label || v}</Tag>;
    }},
  ];

  return (
    <Card>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setFormOpen(true)}>新增人才</Button>
      </Space>
      <Table columns={columns} dataSource={talent} rowKey="id" size="middle" pagination={{ pageSize: 15, showTotal: t => `共 ${t} 人` }} scroll={{ x: 900 }} />

      <Modal title="新增人才" open={formOpen} onCancel={() => setFormOpen(false)}
        onOk={async () => {
          try { const values = await form.validateFields(); onFinish(values); } catch {}
        }} width={600} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item name="name" label="姓名" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="role" label="角色"><Input placeholder="如: 项目经理" /></Form.Item>
            <Form.Item name="skills" label="技能标签"><Input placeholder="逗号分隔" /></Form.Item>
            <Form.Item name="currentProject" label="当前项目"><Input /></Form.Item>
            <Form.Item name="utilization" label="利用率(%)" initialValue={50}><InputNumber min={0} max={100} style={{ width: '100%' }} /></Form.Item>
            <Form.Item name="status" label="状态" initialValue="normal">
              <Select options={[{ value: 'normal', label: '正常' }, { value: 'high', label: '高负荷' }, { value: 'overload', label: '超负荷' }, { value: 'idle', label: '空闲' }]} />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </Card>
  );
}
