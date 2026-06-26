import { useEffect, useState } from 'react';
import { Table, Button, Tag, Input, Select, Space, Card, message, Popconfirm, Modal } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLeadStore, LEAD_FIELDS, LEAD_STATUS_COLORS, type Lead } from '../../../../store/useLeadStore';
import Permission from '../../../../components/auth/Permission';

export default function LeadsList() {
  const { leads, load, batchDelete, batchModify } = useLeadStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [evalFilter, setEvalFilter] = useState('all');
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchField, setBatchField] = useState<string>('status');
  const [batchValue, setBatchValue] = useState('');

  useEffect(() => { load(); }, [load]);

  let data = leads;
  if (search) { const s = search.toLowerCase(); data = data.filter(l => l.name.toLowerCase().includes(s) || l.company.toLowerCase().includes(s) || l.owner.toLowerCase().includes(s)); }
  if (statusFilter !== 'all') data = data.filter(l => l.status === statusFilter);
  if (evalFilter !== 'all') data = data.filter(l => l.evaluation === evalFilter);

  const batchFields = ['status', 'projectLevel', 'confirmedBiz', 'owner', 'dept', 'reviewStatus'];
  const batchFieldOptions: Record<string, string[]> = {
    status: ['待跟进','跟进中','已提案','已签约','已关闭'],
    projectLevel: ['S','A','B','C'],
    confirmedBiz: ['是','否'],
    reviewStatus: ['待评审','评审中','已通过','未通过'],
  };

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) return;
    batchDelete(selectedRowKeys, 'admin');
    message.success(`已删除 ${selectedRowKeys.length} 条，数据移入回收站`);
    setSelectedRowKeys([]);
    load();
  };

  const handleBatchModify = () => {
    if (!batchValue) { message.warning('请选择目标值'); return; }
    batchModify(selectedRowKeys, batchField as keyof Lead, batchValue);
    message.success(`已批量修改 ${selectedRowKeys.length} 条`);
    setBatchModalOpen(false);
    setSelectedRowKeys([]);
    setBatchValue('');
    load();
  };

  const exportCSV = () => {
    const headers = LEAD_FIELDS.map(f => f.label).join(',');
    const rows = (selectedRowKeys.length ? leads.filter(l => selectedRowKeys.includes(l.id)) : data)
      .map(l => LEAD_FIELDS.map(f => `"${(l[f.key] || '').toString().replace(/"/g,'""')}"`).join(','));
    const blob = new Blob(['\uFEFF' + headers + '\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = '线索导出.csv'; a.click();
    message.success('导出成功');
  };

  const columns = [
    { title: '线索名称', dataIndex: 'name', width: 180, render: (v: string, r: Lead) => <a onClick={() => navigate(`/ltc/leads/${r.id}`)}>{v}</a> },
    { title: '甲方公司', dataIndex: 'company', width: 120 },
    { title: '甲方对接人', dataIndex: 'contact', width: 100 },
    { title: '承接人', dataIndex: 'owner', width: 80 },
    { title: '预算量级', dataIndex: 'budget', width: 100 },
    { title: '线索状态', dataIndex: 'status', width: 90, render: (v: string) => <Tag color={LEAD_STATUS_COLORS[v]}>{v}</Tag> },
    { title: '评价', dataIndex: 'evaluation', width: 80, render: (v: string) => <Tag color={v==='高价值'?'red':v==='中等价值'?'orange':'default'}>{v}</Tag> },
    { title: '项目等级', dataIndex: 'projectLevel', width: 80, render: (v: string) => v ? <Tag color={v==='S'?'red':v==='A'?'orange':'blue'}>{v}</Tag> : '-' },
    { title: '创建日期', dataIndex: 'createdAt', width: 110 },
    {
      title: '操作', key: 'action', width: 160, fixed: 'right' as const,
      render: (_: unknown, r: Lead) => (
        <Space>
          <a onClick={() => navigate(`/ltc/leads/${r.id}`)}>详情</a>
          <Permission code="pipeline:edit"><a onClick={() => navigate(`/ltc/leads/${r.id}?edit=1`)}>编辑</a></Permission>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input prefix={<SearchOutlined />} placeholder="搜索" value={search} onChange={e => setSearch(e.target.value)} style={{ width: 180 }} allowClear />
        <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 110 }} options={[{ value: 'all', label: '全部状态' }, ...['待跟进','跟进中','已提案','已签约','已关闭'].map(v => ({ value: v, label: v }))]} />
        <Select value={evalFilter} onChange={setEvalFilter} style={{ width: 110 }} options={[{ value: 'all', label: '全部评价' }, ...['高价值','中等价值','低价值'].map(v => ({ value: v, label: v }))]} />
        <Permission code="pipeline:batch-delete">
          <Button danger disabled={!selectedRowKeys.length} onClick={handleBatchDelete}>
            🗑 批量删除({selectedRowKeys.length || 0})
          </Button>
        </Permission>
        <Permission code="pipeline:batch-modify">
          <Button disabled={!selectedRowKeys.length} onClick={() => setBatchModalOpen(true)}>
            ✏️ 批量修改({selectedRowKeys.length || 0})
          </Button>
        </Permission>
        <Button icon={<DownloadOutlined />} onClick={exportCSV}>导出</Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/ltc/leads/new')}>新建线索</Button>
      </Space>
      <Table columns={columns} dataSource={data} rowKey="id" size="middle"
        rowSelection={{ selectedRowKeys, onChange: (keys) => setSelectedRowKeys(keys as string[]) }}
        pagination={{ pageSize: 20, showSizeChanger: true, showTotal: t => `共 ${t} 条` }}
        scroll={{ x: 1100 }}
      />

      {/* 批量修改弹窗 */}
      <Modal title="批量修改" open={batchModalOpen} onCancel={() => setBatchModalOpen(false)}
        onOk={handleBatchModify} width={400}>
        <p style={{ marginBottom: 16, color: '#666' }}>已选择 {selectedRowKeys.length} 条线索</p>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>修改字段</div>
          <Select value={batchField} onChange={setBatchField} style={{ width: '100%' }}
            options={batchFields.map(f => ({ value: f, label: LEAD_FIELDS.find(lf => lf.key === f)?.label || f }))} />
        </div>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>目标值</div>
          {batchFieldOptions[batchField] ? (
            <Select value={batchValue} onChange={setBatchValue} style={{ width: '100%' }}
              options={batchFieldOptions[batchField].map(v => ({ value: v, label: v }))} />
          ) : (
            <Input value={batchValue} onChange={e => setBatchValue(e.target.value)} placeholder="输入目标值" />
          )}
        </div>
      </Modal>
    </Card>
  );
}
