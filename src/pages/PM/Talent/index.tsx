import { Table, Tag, Progress, Space, Card, Button, Modal, Form, Input, InputNumber, Select, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import Permission from '../../../components/auth/Permission';
import SkeletonTable from '../../../components/ui/SkeletonTable';
import EmptyState from '../../../components/ui/EmptyState';
import BatchActionBar from '../../../components/ui/BatchActionBar';
import { useTable } from '../../../hooks/useTable';
import { useFormDialog } from '../../../hooks/useFormDialog';
import {
  fetchTalentPage, createTalent, updateTalent, deleteTalent, batchDeleteTalent,
  type TalentVO, type TalentSaveDTO,
} from '../../../api/talent';
import { useState, useRef } from 'react';

const STATUS_MAP: Record<string, { color: string; label: string }> = {
  normal: { color: 'green', label: '正常' }, high: { color: 'orange', label: '高负荷' },
  overload: { color: 'red', label: '超负荷' }, idle: { color: 'blue', label: '空闲' },
};

export default function PmTalent() {
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const keywordTimer = useRef<ReturnType<typeof setTimeout>>();

  const {
    list, total, pageNum, pageSize, loading,
    selectedRowKeys, selectedRows,
    refresh, setPage, setSelected, getRowKey,
  } = useTable<TalentVO, { keyword?: string; status?: string }>({
    fetchApi: fetchTalentPage,
    defaultPageSize: 15,
    filters: { keyword: keyword || undefined, status: statusFilter || undefined },
  });

  // 防抖搜索
  const onSearchChange = (val: string) => {
    setKeyword(val);
    clearTimeout(keywordTimer.current);
    keywordTimer.current = setTimeout(() => setKeyword(val), 400);
  };

  const { open, editingId, submitting, formRef, openCreate, openEdit, close, submit } =
    useFormDialog<TalentSaveDTO & { id?: number }>({
      defaultValues: { utilization: 50, status: 'normal' },
      onSubmit: async (values, id) => {
        if (id) await updateTalent(id, values);
        else await createTalent(values);
      },
      onSuccess: refresh,
    });

  const handleDelete = async (r: TalentVO) => {
    await deleteTalent(r.id);
    message.success('已删除');
    refresh();
  };

  const columns = [
    { title: '姓名', dataIndex: 'name', width: 80, render: (v: string) => <strong>{v}</strong> },
    { title: '角色', dataIndex: 'role', width: 100 },
    {
      title: '技能标签', dataIndex: 'skills', width: 180,
      render: (v: string) => v
        ? <Space size={2} wrap>{v.split(',').map(s => <Tag key={s} color="blue">{s.trim()}</Tag>)}</Space>
        : '-',
    },
    { title: '当前项目', dataIndex: 'currentProject', width: 140, ellipsis: true },
    {
      title: '利用率', dataIndex: 'utilization', width: 140,
      render: (v: number) => (
        <Space><Progress percent={v} size="small" style={{ width: 70 }}
          strokeColor={v > 85 ? '#f59e0b' : v > 60 ? '#10b981' : '#6366f1'} />{v}%</Space>
      ),
    },
    {
      title: '状态', dataIndex: 'status', width: 80,
      render: (v: string) => {
        const m = STATUS_MAP[v];
        return <Tag color={m?.color}>{m?.label || v}</Tag>;
      },
    },
    {
      title: '操作', key: 'action', width: 140, fixed: 'right' as const,
      render: (_: unknown, r: TalentVO) => (
        <Space size={0}>
          <Permission code="talent:edit">
            <Button size="small" type="link" onClick={() => openEdit(r as unknown as TalentVO & { id: number })}>编辑</Button>
          </Permission>
          <Permission code="talent:delete">
            <Button size="small" type="link" danger onClick={() => Modal.confirm({
              title: '确认删除', content: `确定删除人才「${r.name}」？`,
              okText: '确认删除', cancelText: '取消', okButtonProps: { danger: true },
              onOk: () => handleDelete(r),
            })}>删除</Button>
          </Permission>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Space style={{ marginBottom: 12 }} wrap>
        <Input.Search placeholder="搜索姓名/角色/技能" onChange={e => onSearchChange(e.target.value)}
          style={{ width: 220 }} allowClear />
        <Select placeholder="全部状态" value={statusFilter} onChange={v => setStatusFilter(v)} allowClear style={{ width: 110 }}
          options={Object.entries(STATUS_MAP).map(([k, v]) => ({ value: k, label: v.label }))} />
        <Permission code="talent:create">
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增人才</Button>
        </Permission>
      </Space>

      <BatchActionBar
        selectedCount={selectedRowKeys.length}
        defaultDelete={{
          label: '人才',
          onDelete: async () => { await batchDeleteTalent(selectedRowKeys.map(Number)); refresh(); },
        }}
        onClear={() => setSelected([], [])}
      />

      {loading && list.length === 0 ? (
        <SkeletonTable columns={6} />
      ) : (
        <Table columns={columns} dataSource={list} rowKey={getRowKey} size="middle" loading={loading && list.length > 0}
          rowSelection={{ selectedRowKeys, onChange: (keys, rows) => setSelected(keys, rows as TalentVO[]) }}
          pagination={{ current: pageNum, pageSize, total, showSizeChanger: true, showTotal: t => `共 ${t} 人`, onChange: setPage }}
          scroll={{ x: 920 }}
          locale={{ emptyText: <EmptyState description="暂无人才数据" showCreate onCreate={openCreate} createText="新增人才" /> }}
        />
      )}

      <Modal title={editingId ? '编辑人才' : '新增人才'} open={open} onCancel={close}
        onOk={submit} confirmLoading={submitting} width={600} destroyOnHidden>
        <Form ref={formRef} layout="vertical">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="role" label="角色"><Input placeholder="如: 项目经理" /></Form.Item>
            <Form.Item name="skills" label="技能标签"><Input placeholder="逗号分隔" /></Form.Item>
            <Form.Item name="currentProject" label="当前项目"><Input /></Form.Item>
            <Form.Item name="utilization" label="利用率(%)" initialValue={50}>
              <InputNumber min={0} max={100} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="status" label="状态" initialValue="normal">
              <Select options={Object.entries(STATUS_MAP).map(([k, v]) => ({ value: k, label: v.label }))} />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </Card>
  );
}
