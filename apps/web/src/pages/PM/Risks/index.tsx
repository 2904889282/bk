import { Table, Tag, Button, Space, Card, Modal, Form, Input, Select, message } from 'antd';
import { PlusOutlined, CheckOutlined } from '@ant-design/icons';
import Permission from '../../../components/auth/Permission';
import SkeletonTable from '../../../components/ui/SkeletonTable';
import EmptyState from '../../../components/ui/EmptyState';
import BatchActionBar from '../../../components/ui/BatchActionBar';
import { useTable } from '../../../hooks/useTable';
import { useFormDialog } from '../../../hooks/useFormDialog';
import {
  fetchRiskPage, createRisk, updateRisk, deleteRisk, batchDeleteRisk, resolveRisk,
  type RiskVO, type RiskSaveDTO,
} from '../../../api/risk';
import { fetchProjectPage, type ProjectVO } from '../../../api/project';
import { useState, useEffect, useRef } from 'react';

const LEVEL_TAGS: Record<string, { color: string; label: string }> = {
  high: { color: 'red', label: '高' }, medium: { color: 'orange', label: '中' }, low: { color: 'blue', label: '低' },
};

export default function PmRisks() {
  const [keyword, setKeyword] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [projects, setProjects] = useState<ProjectVO[]>([]);
  const keywordTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { list, total, pageNum, pageSize, loading, selectedRowKeys,
    refresh, setPage, setSelected, getRowKey,
  } = useTable<RiskVO, { keyword?: string; level?: string; status?: string }>({
    fetchApi: fetchRiskPage,
    defaultPageSize: 15,
    filters: { keyword: keyword || undefined, level: levelFilter || undefined, status: statusFilter || undefined },
  });

  const onSearchChange = (val: string) => {
    if (keywordTimer.current) clearTimeout(keywordTimer.current);
    keywordTimer.current = setTimeout(() => setKeyword(val), 400);
  };

  useEffect(() => { fetchProjectPage({ pageNum: 1, pageSize: 9999 }).then(r => setProjects(r.list || [])).catch(() => {}); }, []);

  const { open, editingId, submitting, formRef, openCreate, openEdit, close, submit } =
    useFormDialog<RiskSaveDTO & { id?: number }>({
      defaultValues: { level: 'medium' },
      onSubmit: async (values, id) => {
        if (id) await updateRisk(id, values);
        else await createRisk(values);
      },
      onSuccess: refresh,
    });

  const handleResolve = async (id: number) => { await resolveRisk(id); message.success('已标记已解决'); refresh(); };
  const handleDelete = async (r: RiskVO) => { await deleteRisk(r.id); message.success('已删除'); refresh(); };

  const columns = [
    { title: '风险项', dataIndex: 'type', width: 100, render: (v: string) => <strong>{v}</strong> },
    { title: '关联项目', dataIndex: 'projectName', width: 140, render: (v: string) => v || '-' },
    { title: '风险描述', dataIndex: 'description', ellipsis: true },
    { title: '影响等级', dataIndex: 'level', width: 90, render: (v: string) => {
      const t = LEVEL_TAGS[v]; return t ? <Tag color={t.color}>{t.label}</Tag> : v;
    }},
    { title: '应对措施', dataIndex: 'solution', width: 180, ellipsis: true },
    { title: '负责人', dataIndex: 'owner', width: 80 },
    { title: '状态', dataIndex: 'status', width: 80, render: (v: string) =>
      v === 'open' ? <Tag color="red">未解决</Tag> : <Tag color="green">已解决</Tag> },
    {
      title: '操作', key: 'action', width: 200, fixed: 'right' as const,
      render: (_: unknown, r: RiskVO) => (
        <Space size={0}>
          {r.status === 'open' && (
            <Permission code="risk:edit"><Button size="small" type="link" icon={<CheckOutlined />} onClick={() => handleResolve(r.id)}>标记已解决</Button></Permission>
          )}
          <Permission code="risk:edit"><Button size="small" type="link" onClick={() => openEdit(r as unknown as RiskVO & { id: number })}>编辑</Button></Permission>
          <Permission code="risk:delete"><Button size="small" type="link" danger onClick={() => Modal.confirm({
            title: '确认删除', content: `确定删除风险「${r.type}」？`, okText: '确认删除', cancelText: '取消', okButtonProps: { danger: true }, onOk: () => handleDelete(r),
          })}>删除</Button></Permission>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Space style={{ marginBottom: 12 }} wrap>
        <Input.Search placeholder="搜索风险项/描述" onChange={e => onSearchChange(e.target.value)} style={{ width: 220 }} allowClear />
        <Select placeholder="全部等级" value={levelFilter} onChange={v => setLevelFilter(v)} allowClear style={{ width: 100 }}
          options={Object.entries(LEVEL_TAGS).map(([k, v]) => ({ value: k, label: v.label }))} />
        <Select placeholder="全部状态" value={statusFilter} onChange={v => setStatusFilter(v)} allowClear style={{ width: 100 }}
          options={[{ value: 'open', label: '未解决' }, { value: 'resolved', label: '已解决' }]} />
        <Permission code="risk:create"><Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增风险</Button></Permission>
      </Space>

      <BatchActionBar selectedCount={selectedRowKeys.length}
        defaultDelete={{ label: '风险', onDelete: async () => { await batchDeleteRisk(selectedRowKeys.map(Number)); refresh(); } }}
        onClear={() => setSelected([], [])} />

      {loading && list.length === 0 ? <SkeletonTable columns={7} /> : (
        <Table columns={columns} dataSource={list} rowKey={getRowKey} size="middle" loading={loading && list.length > 0}
          rowSelection={{ selectedRowKeys, onChange: (keys, rows) => setSelected(keys, rows as RiskVO[]) }}
          pagination={{ current: pageNum, pageSize, total, showSizeChanger: true, showTotal: t => `共 ${t} 条`, onChange: setPage }}
          scroll={{ x: 1050 }}
          locale={{ emptyText: <EmptyState description="暂无风险数据" showCreate onCreate={openCreate} createText="新增风险" /> }} />
      )}

      <Modal title={editingId ? '编辑风险' : '新增风险'} open={open} onCancel={close} onOk={submit} confirmLoading={submitting} width={600} destroyOnHidden>
        <Form ref={formRef} layout="vertical">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item name="type" label="风险项" rules={[{ required: true, message: '请输入' }]}><Input placeholder="如：工期延误" /></Form.Item>
            <Form.Item name="projectId" label="关联项目" rules={[{ required: true, message: '请选择' }]}>
              <Select placeholder="选择项目" showSearch optionFilterProp="label"
                options={projects.map(p => ({ value: p.id, label: p.projectName }))} />
            </Form.Item>
            <Form.Item name="level" label="影响等级" initialValue="medium">
              <Select options={Object.entries(LEVEL_TAGS).map(([k, v]) => ({ value: k, label: v.label }))} />
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
