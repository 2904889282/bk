import { Table, Button, Tag, Input, Select, Space, Card, message, Popconfirm, Progress } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { useDataStore } from '../../../store/useDataStore';
import { PM_STAGE_MAP, type ProjectStage } from '../../../types';
import { useState } from 'react';
import ProjectForm from './Form';

export default function PmProjects() {
  const { projects, deleteProject } = useDataStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  let data = projects;
  if (search) {
    const s = search.toLowerCase();
    data = data.filter(p => p.name.toLowerCase().includes(s) || p.client.toLowerCase().includes(s) || p.manager.toLowerCase().includes(s));
  }

  const columns = [
    { title: '项目名称', dataIndex: 'name', key: 'name', width: 180, render: (v: string) => <strong>{v}</strong> },
    { title: '项目经理', dataIndex: 'manager', key: 'manager', width: 80 },
    { title: '客户', dataIndex: 'client', key: 'client', width: 120 },
    { title: '金额(万)', dataIndex: 'amount', key: 'amount', width: 100, render: (v: number) => <strong>¥{v.toLocaleString()}</strong> },
    { title: '进度', dataIndex: 'progress', key: 'progress', width: 150, render: (v: number) => <Space><Progress percent={v} size="small" style={{ width: 80 }} />{v}%</Space> },
    { title: '阶段', dataIndex: 'stage', key: 'stage', width: 100, render: (v: ProjectStage) => <Tag>{PM_STAGE_MAP[v]}</Tag> },
    { title: '开始日期', dataIndex: 'startDate', key: 'startDate', width: 110 },
    { title: '预计完成', dataIndex: 'expectedEnd', key: 'expectedEnd', width: 110 },
    {
      title: '操作', key: 'action', width: 120, render: (_: unknown, r: { id: string }) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => { setEditId(r.id); setFormOpen(true); }} />
          <Popconfirm title="确定删除？" onConfirm={() => { deleteProject(r.id); message.success('已删除'); }}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input prefix={<SearchOutlined />} placeholder="搜索项目" value={search} onChange={e => setSearch(e.target.value)} style={{ width: 220 }} allowClear />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditId(null); setFormOpen(true); }}>新建项目</Button>
      </Space>
      <Table columns={columns} dataSource={data} rowKey="id" size="middle" pagination={{ pageSize: 15, showSizeChanger: true, showTotal: t => `共 ${t} 条` }} scroll={{ x: 1100 }} />
      <ProjectForm open={formOpen} editId={editId} onClose={() => setFormOpen(false)} />
    </Card>
  );
}
