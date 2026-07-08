import { Table, Tag, Button, Space, Card, Modal, Form, Input, Select, message } from 'antd';
import { PlusOutlined, CheckOutlined } from '@ant-design/icons';
import Permission from '../../../components/auth/Permission';
import SkeletonTable from '../../../components/ui/SkeletonTable';
import EmptyState from '../../../components/ui/EmptyState';
import BatchActionBar from '../../../components/ui/BatchActionBar';
import { useTable } from '../../../hooks/useTable';
import { useFormDialog } from '../../../hooks/useFormDialog';
import {
  fetchAlertPage, createAlert, updateAlert, deleteAlert, batchDeleteAlert, resolveAlert,
  type AlertVO, type AlertSaveDTO,
} from '../../../api/alert';
import { fetchProjectPage, type ProjectVO } from '../../../api/project';
import { useState, useEffect, useRef } from 'react';

const LEVEL_TAGS: Record<string, { color: string; label: string }> = {
  high: { color: 'red', label: '高' }, medium: { color: 'orange', label: '中' },
};

export default function LtcAlerts() {
  const [keyword, setKeyword] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [projects, setProjects] = useState<ProjectVO[]>([]);
  const keywordTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { list, total, pageNum, pageSize, loading, selectedRowKeys,
    refresh, setPage, setSelected, getRowKey,
  } = useTable<AlertVO, { keyword?: string; level?: string; status?: string }>({
    fetchApi: fetchAlertPage,
    defaultPageSize: 15,
    filters: { keyword: keyword || undefined, level: levelFilter || undefined, status: statusFilter || undefined },
  });

  const onSearchChange = (val: string) => {
    if (keywordTimer.current) clearTimeout(keywordTimer.current);
    keywordTimer.current = setTimeout(() => setKeyword(val), 400);
  };

  useEffect(() => { fetchProjectPage({ pageNum: 1, pageSize: 9999 }).then(r => setProjects(r.records || [])).catch(() => {}); }, []);

  const { open, editingId, submitting, formRef, openCreate, openEdit, close, submit } =
    useFormDialog<AlertSaveDTO & { id?: number }>({
      defaultValues: { level: 'medium' },
      onSubmit: async (values, id) => {
        if (id) await updateAlert(id, values);
        else await createAlert(values);
      },
      onSuccess: refresh,
    });

  const handleResolve = async (id: number) => { await resolveAlert(id); message.success('已标记已处理'); refresh(); };
  const handleDelete = async (r: AlertVO) => { await deleteAlert(r.id); message.success('已删除'); refresh(); };

  const columns = [
    { title: '预警类型', dataIndex: 'type', width: 100, render: (v: string) => <Tag color="red">{v}</Tag> },
    { title: '关联项目', dataIndex: 'projectName', width: 160, render: (v: string) => v || '-' },
    { title: '问题描述', dataIndex: 'description', ellipsis: true },
    { title: '严重程度', dataIndex: 'level', width: 100, render: (v: string) => {
      const t = LEVEL_TAGS[v]; return t ? <Tag color={t.color}>{t.label}</Tag> : v;
    }},
    { title: '负责人', dataIndex: 'manager', width: 80 },
    { title: '状态', dataIndex: 'status', width: 80, render: (v: string) =>
      v === 'open' ? <Tag color="red">未处理</Tag> : <Tag color="green">已处理</Tag> },
    { title: '创建时间', dataIndex: 'createTime', width: 160, render: (v: string) => v ? v.slice(0, 16).replace('T', ' ') : '-' },
    {
      title: '操作', key: 'action', width: 200, fixed: 'right' as const,
      render: (_: unknown, r: AlertVO) => (
        <Space size={0}>
          {r.status === 'open' && (
            <Permission code="alert:edit"><Button size="small" type="link" icon={<CheckOutlined />} onClick={() => handleResolve(r.id)}>标记已处理</Button></Permission>
          )}
          <Permission code="alert:edit"><Button size="small" type="link" onClick={() => openEdit(r as unknown as AlertVO & { id: number })}>编辑</Button></Permission>
          <Permission code="alert:delete"><Button size="small" type="link" danger onClick={() => Modal.confirm({
            title: '确认删除', content: `确定删除预警「${r.type}」？`, okText: '确认删除', cancelText: '取消', okButtonProps: { danger: true }, onOk: () => handleDelete(r),
          })}>删除</Button></Permission>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Space style={{ marginBottom: 12 }} wrap>
        <Input.Search placeholder="搜索预警类型/描述" onChange={e => onSearchChange(e.target.value)} style={{ width: 220 }} allowClear />
        <Select placeholder="全部程度" value={levelFilter} onChange={v => setLevelFilter(v)} allowClear style={{ width: 100 }}
          options={Object.entries(LEVEL_TAGS).map(([k, v]) => ({ value: k, label: v.label }))} />
        <Select placeholder="全部状态" value={statusFilter} onChange={v => setStatusFilter(v)} allowClear style={{ width: 100 }}
          options={[{ value: 'open', label: '未处理' }, { value: 'resolved', label: '已处理' }]} />
        <Permission code="alert:create"><Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增预警</Button></Permission>
      </Space>

      <BatchActionBar selectedCount={selectedRowKeys.length}
        defaultDelete={{ label: '预警', onDelete: async () => { await batchDeleteAlert(selectedRowKeys.map(Number)); refresh(); } }}
        onClear={() => setSelected([], [])} />

      {loading && list.length === 0 ? <SkeletonTable columns={7} /> : (
        <Table columns={columns} dataSource={list} rowKey={getRowKey} size="middle" loading={loading && list.length > 0}
          rowSelection={{ selectedRowKeys, onChange: (keys, rows) => setSelected(keys, rows as AlertVO[]) }}
          pagination={{ current: pageNum, pageSize, total, showSizeChanger: true, showTotal: t => `共 ${t} 条`, onChange: setPage }}
          scroll={{ x: 1050 }}
          locale={{ emptyText: <EmptyState description="暂无预警数据" showCreate onCreate={openCreate} createText="新增预警" /> }} />
      )}

      <Modal title={editingId ? '编辑预警' : '新增预警'} open={open} onCancel={close} onOk={submit} confirmLoading={submitting} width={600} destroyOnHidden>
        <Form ref={formRef} layout="vertical">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item name="type" label="预警类型" rules={[{ required: true, message: '请输入' }]}><Input placeholder="如：进度滞后" /></Form.Item>
            <Form.Item name="projectId" label="关联项目" rules={[{ required: true, message: '请选择' }]}>
              <Select placeholder="选择项目" showSearch optionFilterProp="label"
                options={projects.map(p => ({ value: p.id, label: p.projectName }))} />
            </Form.Item>
            <Form.Item name="level" label="严重程度" initialValue="medium">
              <Select options={Object.entries(LEVEL_TAGS).map(([k, v]) => ({ value: k, label: v.label }))} />
            </Form.Item>
            <Form.Item name="manager" label="负责人"><Input /></Form.Item>
          </div>
          <Form.Item name="description" label="问题描述"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
