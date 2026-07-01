import { useEffect, useState } from 'react';
import { Table, Button, Tag, Input, Select, Space, Card, Modal, Form, DatePicker, message } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../hooks/useAuth';
import {
  fetchClueList, createClue, updateClue, deleteClue, deleteClueBatch,
  type ClueVO, type ClueSaveDTO,
} from '../../../../api/clue';
import dayjs from 'dayjs';

// === Constants ===
const CLUE_STATUS_OPTIONS = ['线索接触', '沟通提案', '执行测试', '已承接', '已丢失', '已延期', '已转项目'];
const CLUE_LEVEL_OPTIONS = ['A', 'B', 'C'];
const CLUE_EVALUATION_OPTIONS = ['高价值', '中等价值', '低价值'];
const DEPT_BELONG_OPTIONS = ['平台一部', '平台二部', '平台三部', '中台'];

const STATUS_COLOR_MAP: Record<string, string> = {
  '线索接触': 'default',
  '沟通提案': 'processing',
  '执行测试': 'orange',
  '已承接': 'green',
  '已丢失': 'red',
  '已延期': 'gold',
  '已转项目': 'purple',
};

const LEVEL_COLOR_MAP: Record<string, string> = { A: 'red', B: 'orange', C: 'blue' };
const EVALUATION_COLOR_MAP: Record<string, string> = { '高价值': 'red', '中等价值': 'orange', '低价值': 'default' };

// === Component ===
export default function LeadsList() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  // Pagination & data
  const [data, setData] = useState<ClueVO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filters
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [levelFilter, setLevelFilter] = useState<string | undefined>(undefined);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Selection
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<ClueVO | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // === Data fetching ===
  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await fetchClueList({
          pageNum,
          pageSize,
          keyword: keyword || undefined,
          status: statusFilter,
          level: levelFilter,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        });
        if (cancelled) return;
        setData(result.list);
        setTotal(result.total);
      } catch {
        // Errors handled by global interceptor
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadData();
    return () => { cancelled = true; };
  }, [pageNum, pageSize, keyword, statusFilter, levelFilter, dateFrom, dateTo, refreshKey]);

  // === Handlers ===
  const handleFilterChange = (setter: (v: any) => void) => (value: any) => {
    setter(value);
    setPageNum(1);
  };

  const handleTableChange = (pagination: any) => {
    setPageNum(pagination.current);
    setPageSize(pagination.pageSize);
  };

  const refreshList = () => {
    setRefreshKey(k => k + 1);
  };

  // Single delete
  const handleDelete = (record: ClueVO) => {
    Modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除线索「${record.clueName}」吗？删除后数据移入回收站。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        await deleteClue(record.id);
        message.success('删除成功');
        refreshList();
      },
    });
  };

  // Batch delete
  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) return;
    Modal.confirm({
      title: '确认批量删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除已选择的 ${selectedRowKeys.length} 条线索吗？删除后数据移入回收站。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        await deleteClueBatch(selectedRowKeys);
        message.success(`已删除 ${selectedRowKeys.length} 条`);
        setSelectedRowKeys([]);
        refreshList();
      },
    });
  };

  // Create
  const handleCreate = async () => {
    try {
      const vals = await createForm.validateFields();
      setSubmitting(true);
      const payload: ClueSaveDTO = {
        clueName: vals.clueName,
        clientCompany: vals.clientCompany,
        clientDept: vals.clientDept || '',
        clientContact: vals.clientContact || '',
        beikeOwner: vals.beikeOwner,
        budget: vals.budget || '',
        clueLevel: vals.clueLevel,
        clueStatus: vals.clueStatus,
        deptBelong: vals.deptBelong,
        contactDate: vals.contactDate ? dayjs(vals.contactDate).format('YYYY-MM-DD') : undefined,
        requirementDesc: vals.requirementDesc || '',
        clueEvaluation: vals.clueEvaluation || '',
        remark: vals.remark || '',
      };
      await createClue(payload);
      message.success('线索已创建');
      createForm.resetFields();
      setCreateModalOpen(false);
      setPageNum(1);
      setRefreshKey(k => k + 1);
    } catch {
      // Validation errors handled by Form; API errors by global interceptor
    } finally {
      setSubmitting(false);
    }
  };

  // Edit
  const openEditModal = (record: ClueVO) => {
    setEditRecord(record);
    editForm.setFieldsValue({
      clueName: record.clueName,
      clientCompany: record.clientCompany,
      clientDept: record.clientDept,
      clientContact: record.clientContact,
      beikeOwner: record.beikeOwner,
      budget: record.budget,
      clueLevel: record.clueLevel,
      clueStatus: record.clueStatus,
      deptBelong: record.deptBelong,
      contactDate: record.contactDate ? dayjs(record.contactDate) : null,
      requirementDesc: record.requirementDesc,
      clueEvaluation: record.clueEvaluation,
      remark: record.remark,
    });
    setEditModalOpen(true);
  };

  const handleEdit = async () => {
    try {
      const vals = await editForm.validateFields();
      setSubmitting(true);
      const payload: ClueSaveDTO = {
        clueName: vals.clueName,
        clientCompany: vals.clientCompany,
        clientDept: vals.clientDept || '',
        clientContact: vals.clientContact || '',
        beikeOwner: vals.beikeOwner,
        budget: vals.budget || '',
        clueLevel: vals.clueLevel,
        clueStatus: vals.clueStatus,
        deptBelong: vals.deptBelong,
        contactDate: vals.contactDate ? dayjs(vals.contactDate).format('YYYY-MM-DD') : undefined,
        requirementDesc: vals.requirementDesc || '',
        clueEvaluation: vals.clueEvaluation || '',
        remark: vals.remark || '',
      };
      await updateClue(editRecord!.id, payload);
      message.success('线索已更新');
      editForm.resetFields();
      setEditModalOpen(false);
      setEditRecord(null);
      refreshList();
    } catch {
      // Validation errors handled by Form; API errors by global interceptor
    } finally {
      setSubmitting(false);
    }
  };

  // === Table columns ===
  const columns = [
    { title: '线索名称', dataIndex: 'clueName', width: 180, render: (v: string, r: ClueVO) =>
      <a onClick={() => navigate(`/ltc/leads/${r.id}`)}>{v}</a> },
    { title: '甲方公司', dataIndex: 'clientCompany', width: 140 },
    { title: '甲方对接人', dataIndex: 'clientContact', width: 100, render: (v: string) => v || '-' },
    { title: '承接人', dataIndex: 'beikeOwner', width: 80, render: (v: string) =>
      <span style={{ fontWeight: 500 }}>{v || '-'}</span> },
    { title: '预算量级', dataIndex: 'budget', width: 100 },
    { title: '线索状态', dataIndex: 'clueStatus', width: 90, render: (v: string) =>
      <Tag color={STATUS_COLOR_MAP[v] || 'default'}>{v || '-'}</Tag> },
    { title: '项目等级', dataIndex: 'clueLevel', width: 80, render: (v: string) =>
      v ? <Tag color={LEVEL_COLOR_MAP[v] || 'blue'}>{v}</Tag> : '-' },
    { title: '线索评价', dataIndex: 'clueEvaluation', width: 80, render: (v: string) =>
      v ? <Tag color={EVALUATION_COLOR_MAP[v] || 'default'}>{v}</Tag> : '-' },
    { title: '接触日期', dataIndex: 'contactDate', width: 110, render: (v: string) => v || '-' },
    {
      title: '操作', key: 'action', width: 200, fixed: 'right' as const,
      render: (_: unknown, r: ClueVO) => (
        <Space>
          <a onClick={() => navigate(`/ltc/leads/${r.id}`)}>详情</a>
          {hasPermission('clue:edit') && !r.isConverted && (
            <a onClick={() => openEditModal(r)}><EditOutlined /> 编辑</a>
          )}
          {hasPermission('clue:delete') && !r.isConverted && (
            <a onClick={() => handleDelete(r)} style={{ color: '#ff4d4f' }}><DeleteOutlined /> 删除</a>
          )}
        </Space>
      ),
    },
  ];

  // === Reusable form fields (used by both create & edit) ===
  const renderClueForm = (form: any) => (
    <Form form={form} layout="vertical">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <Form.Item name="clueName" label="线索名称" rules={[{ required: true, message: '请输入线索名称' }]}>
          <Input placeholder="输入线索名称" />
        </Form.Item>
        <Form.Item name="clientCompany" label="甲方公司" rules={[{ required: true, message: '请输入甲方公司' }]}>
          <Input placeholder="甲方公司名称" />
        </Form.Item>
        <Form.Item name="clientDept" label="甲方部门">
          <Input placeholder="甲方部门" />
        </Form.Item>
        <Form.Item name="clientContact" label="甲方对接人">
          <Input placeholder="对接人姓名" />
        </Form.Item>
        <Form.Item name="beikeOwner" label="承接人" rules={[{ required: true, message: '请输入承接人' }]}>
          <Input placeholder="承接人姓名" />
        </Form.Item>
        <Form.Item name="deptBelong" label="承接部门" rules={[{ required: true, message: '请选择承接部门' }]}>
          <Select options={DEPT_BELONG_OPTIONS.map(v => ({ value: v, label: v }))} placeholder="选择部门" />
        </Form.Item>
        <Form.Item name="budget" label="预算量级">
          <Input placeholder="如 10-50万" />
        </Form.Item>
        <Form.Item name="clueLevel" label="项目等级" rules={[{ required: true, message: '请选择项目等级' }]}>
          <Select options={CLUE_LEVEL_OPTIONS.map(v => ({ value: v, label: v }))} placeholder="选择等级" />
        </Form.Item>
        <Form.Item name="clueStatus" label="线索状态" rules={[{ required: true, message: '请选择线索状态' }]}>
          <Select options={CLUE_STATUS_OPTIONS.map(v => ({ value: v, label: v }))} placeholder="选择状态" />
        </Form.Item>
        <Form.Item name="clueEvaluation" label="线索评价">
          <Select options={CLUE_EVALUATION_OPTIONS.map(v => ({ value: v, label: v }))} placeholder="选择评价" />
        </Form.Item>
        <Form.Item name="contactDate" label="接触日期">
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
      </div>
      <Form.Item name="requirementDesc" label="需求说明">
        <Input.TextArea rows={3} placeholder="描述线索需求详情" />
      </Form.Item>
      <Form.Item name="remark" label="备注">
        <Input.TextArea rows={2} placeholder="其他备注信息" />
      </Form.Item>
    </Form>
  );

  // === Render ===
  return (
    <Card>
      {/* Search & Filters */}
      <div style={{ marginBottom: 16 }}>
        <Space wrap style={{ marginBottom: 8 }}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="线索名称 / 公司"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onPressEnter={() => setPageNum(1)}
            style={{ width: 180 }}
            allowClear
          />
          <Select
            value={statusFilter}
            onChange={handleFilterChange(setStatusFilter)}
            style={{ width: 120 }}
            placeholder="全部状态"
            allowClear
            options={CLUE_STATUS_OPTIONS.map(v => ({ value: v, label: v }))}
          />
          <Select
            value={levelFilter}
            onChange={handleFilterChange(setLevelFilter)}
            style={{ width: 100 }}
            placeholder="全部等级"
            allowClear
            options={CLUE_LEVEL_OPTIONS.map(v => ({ value: v, label: `等级${v}` }))}
          />
        </Space>
        <br />
        <Space wrap>
          <span style={{ color: '#999', fontSize: 13 }}>接触日期:</span>
          <Input
            type="date" value={dateFrom}
            onChange={handleFilterChange(setDateFrom)}
            style={{ width: 145 }} placeholder="开始"
          />
          <span style={{ color: '#999' }}>—</span>
          <Input
            type="date" value={dateTo}
            onChange={handleFilterChange(setDateTo)}
            style={{ width: 145 }} placeholder="结束"
          />
          {hasPermission('clue:batch') && (
            <Button danger disabled={!selectedRowKeys.length} onClick={handleBatchDelete}>
              批量删除({selectedRowKeys.length || 0})
            </Button>
          )}
          {hasPermission('clue:create') && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
              新建线索
            </Button>
          )}
        </Space>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        size="middle"
        loading={loading}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys as number[]),
          getCheckboxProps: (r: ClueVO) => ({ disabled: r.isConverted }),
        }}
        pagination={{
          current: pageNum,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: t => `共 ${t} 条`,
        }}
        onChange={handleTableChange}
        scroll={{ x: 1300 }}
        locale={{ emptyText: '暂无线索数据' }}
      />

      {/* Create Modal */}
      <Modal
        title="新建线索"
        open={createModalOpen}
        onCancel={() => { createForm.resetFields(); setCreateModalOpen(false); }}
        onOk={handleCreate}
        confirmLoading={submitting}
        width={640}
        destroyOnClose
      >
        {renderClueForm(createForm)}
      </Modal>

      {/* Edit Modal */}
      <Modal
        title="编辑线索"
        open={editModalOpen}
        onCancel={() => { editForm.resetFields(); setEditModalOpen(false); setEditRecord(null); }}
        onOk={handleEdit}
        confirmLoading={submitting}
        width={640}
        destroyOnClose
      >
        {editRecord && renderClueForm(editForm)}
      </Modal>
    </Card>
  );
}
