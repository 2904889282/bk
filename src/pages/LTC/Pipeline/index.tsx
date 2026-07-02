import { useEffect, useState } from 'react';
import { Table, Button, Tag, Input, Select, Space, Card, message, Modal, Progress } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons';
import { STAGE_MAP, STAGE_COLORS, STAGE_ORDER, PRODUCT_MAP, INDUSTRY_MAP } from '../../../types';
import Permission from '../../../components/auth/Permission';
import PipelineForm from './Form';
import ImportModal from './ImportModal';
import {
  fetchPipelineList,
  deletePipeline,
  type Pipeline,
} from '../../../api/pipeline';

export default function LtcPipeline() {
  const [list, setList] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Pipeline | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchPipelineList();
      setList(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 客户端筛选（后端无分页/筛选接口）
  let data = list;
  if (stageFilter !== 'all') {
    data = data.filter((p) => p.stage === stageFilter);
  }
  if (productFilter !== 'all') {
    data = data.filter((p) => p.product === productFilter);
  }
  if (search) {
    const s = search.toLowerCase();
    data = data.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        p.client.toLowerCase().includes(s) ||
        p.manager.toLowerCase().includes(s),
    );
  }

  const handleDelete = async (p: Pipeline) => {
    await deletePipeline(p.id);
    message.success('已删除');
    loadData();
  };

  const openCreate = () => {
    setEditItem(null);
    setFormOpen(true);
  };

  const openEdit = (p: Pipeline) => {
    setEditItem(p);
    setFormOpen(true);
  };

  const columns = [
    {
      title: '管线名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (v: string) => <strong>{v}</strong>,
    },
    {
      title: '阶段',
      dataIndex: 'stage',
      key: 'stage',
      width: 100,
      render: (v: string) => (
        <Tag color={STAGE_COLORS[v as keyof typeof STAGE_COLORS]}>
          {STAGE_MAP[v as keyof typeof STAGE_MAP]}
        </Tag>
      ),
    },
    { title: '客户', dataIndex: 'client', key: 'client', width: 120 },
    { title: '负责人', dataIndex: 'manager', key: 'manager', width: 80 },
    {
      title: '金额(万)',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (v: number) => <strong>¥{v?.toLocaleString() ?? 0}</strong>,
    },
    {
      title: '胜率',
      dataIndex: 'winRate',
      key: 'winRate',
      width: 100,
      render: (v: number) => (
        <Space>
          <Progress percent={v ?? 0} size="small" style={{ width: 60 }} />
          {v ?? 0}%
        </Space>
      ),
    },
    {
      title: '产品线',
      dataIndex: 'product',
      key: 'product',
      width: 120,
      render: (v: string) => (
        <Tag>{PRODUCT_MAP[v as keyof typeof PRODUCT_MAP] || v}</Tag>
      ),
    },
    {
      title: '行业',
      dataIndex: 'industry',
      key: 'industry',
      width: 80,
      render: (v: string) => (
        <Tag>{INDUSTRY_MAP[v as keyof typeof INDUSTRY_MAP] || v}</Tag>
      ),
    },
    {
      title: '下一步行动',
      dataIndex: 'nextAction',
      key: 'nextAction',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, r: Pipeline) => (
        <Space>
          <Permission code="pipeline:edit">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEdit(r)}
            />
          </Permission>
          <Permission code="pipeline:delete">
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                Modal.confirm({
                  title: '确认删除',
                  content: `确定删除管线「${r.name}」？此操作不可撤销。`,
                  okText: '确认删除',
                  cancelText: '取消',
                  okButtonProps: { danger: true },
                  onOk: () => handleDelete(r),
                });
              }}
            />
          </Permission>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          prefix={<SearchOutlined />}
          placeholder="搜索管线名称/客户/负责人"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 220 }}
          allowClear
        />
        <Select
          value={stageFilter}
          onChange={setStageFilter}
          style={{ width: 120 }}
          options={[
            { value: 'all', label: '全部阶段' },
            ...STAGE_ORDER.map((s) => ({
              value: s,
              label: STAGE_MAP[s as keyof typeof STAGE_MAP],
            })),
          ]}
        />
        <Select
          value={productFilter}
          onChange={setProductFilter}
          style={{ width: 140 }}
          options={[
            { value: 'all', label: '全部产品线' },
            ...Object.entries(PRODUCT_MAP).map(([k, v]) => ({
              value: k,
              label: v,
            })),
          ]}
        />

        <Permission code="pipeline:create">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreate}
          >
            新建管线
          </Button>
        </Permission>

        <Permission code="pipeline:import">
          <Button icon={<UploadOutlined />} onClick={() => setImportOpen(true)}>
            导入
          </Button>
        </Permission>
      </Space>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        size="middle"
        loading={loading}
        pagination={{
          pageSize: 15,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
        }}
        scroll={{ x: 1200 }}
        locale={{ emptyText: '暂无管线数据' }}
      />

      <PipelineForm
        open={formOpen}
        editItem={editItem}
        onClose={() => setFormOpen(false)}
        onSuccess={() => {
          setFormOpen(false);
          loadData();
        }}
      />

      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={loadData}
      />
    </Card>
  );
}
