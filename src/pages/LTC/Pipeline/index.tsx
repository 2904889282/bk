import { useState } from 'react';
import { Table, Button, Tag, Input, Select, Space, Card, message, Popconfirm, Progress } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons';
import { useDataStore } from '../../../store/useDataStore';
import { STAGE_MAP, STAGE_COLORS, STAGE_ORDER, PRODUCT_MAP, INDUSTRY_MAP, type PipelineStage } from '../../../types';
import PipelineForm from './Form';
import ImportModal from './ImportModal';
import Permission from '../../../components/auth/Permission';

export default function LtcPipeline() {
  const { pipelines, deletePipeline, recomputeStats } = useDataStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');

  let data = pipelines;
  if (stageFilter !== 'all') data = data.filter(p => p.stage === stageFilter);
  if (productFilter !== 'all') data = data.filter(p => p.product === productFilter);
  if (search) {
    const s = search.toLowerCase();
    data = data.filter(p => p.name.toLowerCase().includes(s) || p.client.toLowerCase().includes(s) || p.manager.toLowerCase().includes(s));
  }

  const columns = [
    { title: '管线名称', dataIndex: 'name', key: 'name', width: 180, render: (v: string) => <strong>{v}</strong> },
    { title: '阶段', dataIndex: 'stage', key: 'stage', width: 100, render: (v: PipelineStage) => <Tag color={STAGE_COLORS[v]}>{STAGE_MAP[v]}</Tag> },
    { title: '客户', dataIndex: 'client', key: 'client', width: 120 },
    { title: '负责人', dataIndex: 'manager', key: 'manager', width: 80 },
    { title: '金额(万)', dataIndex: 'amount', key: 'amount', width: 100, render: (v: number) => <strong>¥{v.toLocaleString()}</strong> },
    { title: '胜率', dataIndex: 'winRate', key: 'winRate', width: 100, render: (v: number) => (
      <Space><Progress percent={v} size="small" style={{ width: 60 }} />{v}%</Space>
    )},
    { title: '产品线', dataIndex: 'product', key: 'product', width: 120, render: (v: string) => <Tag>{PRODUCT_MAP[v as keyof typeof PRODUCT_MAP] || v}</Tag> },
    { title: '行业', dataIndex: 'industry', key: 'industry', width: 80, render: (v: string) => <Tag>{INDUSTRY_MAP[v as keyof typeof INDUSTRY_MAP] || v}</Tag> },
    { title: '下一步行动', dataIndex: 'nextAction', key: 'nextAction', ellipsis: true },
    {
      title: '操作', key: 'action', width: 120, render: (_: unknown, r: { id: string }) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => { setEditId(r.id); setFormOpen(true); }} />
          <Popconfirm title="确定删除？" onConfirm={() => { deletePipeline(r.id); message.success('已删除'); }}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input prefix={<SearchOutlined />} placeholder="搜索管线" value={search} onChange={e => setSearch(e.target.value)} style={{ width: 200 }} allowClear />
        <Select value={stageFilter} onChange={setStageFilter} style={{ width: 120 }} options={[{ value: 'all', label: '全部阶段' }, ...STAGE_ORDER.map(s => ({ value: s, label: STAGE_MAP[s] }))]} />
        <Select value={productFilter} onChange={setProductFilter} style={{ width: 140 }} options={[{ value: 'all', label: '全部产品线' }, ...Object.entries(PRODUCT_MAP).map(([k, v]) => ({ value: k, label: v }))]} />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditId(null); setFormOpen(true); }}>新建管线</Button>
        <Permission code="pipeline:import">
          <Button icon={<UploadOutlined />} onClick={() => setImportOpen(true)}>导入</Button>
        </Permission>
      </Space>
      <Table columns={columns} dataSource={data} rowKey="id" size="middle" pagination={{ pageSize: 15, showSizeChanger: true, showTotal: t => `共 ${t} 条` }}
        scroll={{ x: 1200 }} />
      <PipelineForm open={formOpen} editId={editId} onClose={() => setFormOpen(false)} onImportClick={() => setImportOpen(true)} />
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)}
        onImported={() => { recomputeStats(); }} />
    </Card>
  );
}
