import { useEffect, useState } from 'react';
import { Table, Button, Tag, Input, Select, Space, Card, message, Modal } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import Permission from '../../../components/auth/Permission';
import ProjectForm from './Form';
import {
  fetchProjectPage,
  deleteProject,
  deleteProjectBatch,
  type ProjectVO,
  type ProjectPageParams,
} from '../../../api/project';

const STATUS_OPTIONS = ['进行中', '暂停', '已交付', '已终止'];
const LEVEL_OPTIONS = ['S', 'A', 'B', 'C'];

const STATUS_COLORS: Record<string, string> = {
  '进行中': 'blue',
  '暂停': 'orange',
  '已交付': 'green',
  '已终止': 'default',
};

const LEVEL_COLORS: Record<string, string> = {
  S: 'red',
  A: 'orange',
  B: 'blue',
  C: 'default',
};

export default function PmProjects() {
  // 筛选
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [projectLevel, setProjectLevel] = useState<string | undefined>(undefined);
  const [deptBelong, setDeptBelong] = useState<string | undefined>(undefined);

  // 分页
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [total, setTotal] = useState(0);
  const [list, setList] = useState<ProjectVO[]>([]);
  const [loading, setLoading] = useState(false);

  // 选中
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);

  // 表单
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const buildParams = (pn: number, ps: number): ProjectPageParams => {
    const params: ProjectPageParams = { pageNum: pn, pageSize: ps };
    if (keyword) params.keyword = keyword;
    if (status) params.status = status;
    if (projectLevel) params.projectLevel = projectLevel;
    if (deptBelong) params.deptBelong = deptBelong;
    return params;
  };

  const loadData = async (pn = pageNum, ps = pageSize) => {
    setLoading(true);
    try {
      const res = await fetchProjectPage(buildParams(pn, ps));
      setList(res.list);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPageNum(1);
    loadData(1, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, status, projectLevel, deptBelong]);

  const onPageChange = (pn: number, ps: number) => {
    setPageNum(pn);
    setPageSize(ps);
    loadData(pn, ps);
  };

  const refreshList = () => loadData(pageNum, pageSize);

  const handleDelete = async (id: number) => {
    await deleteProject(id);
    message.success('已删除');
    refreshList();
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) return;
    await deleteProjectBatch(selectedRowKeys);
    message.success(`已批量删除 ${selectedRowKeys.length} 个项目`);
    setSelectedRowKeys([]);
    refreshList();
  };

  const openCreate = () => {
    setEditId(null);
    setFormOpen(true);
  };

  const openEdit = (id: number) => {
    setEditId(id);
    setFormOpen(true);
  };

  const columns = [
    {
      title: '项目名称',
      dataIndex: 'projectName',
      key: 'projectName',
      width: 180,
      render: (v: string) => <strong>{v}</strong>,
    },
    {
      title: '客户公司',
      dataIndex: 'clientCompany',
      key: 'clientCompany',
      width: 130,
    },
    {
      title: '项目经理',
      dataIndex: 'projectManager',
      key: 'projectManager',
      width: 90,
    },
    {
      title: '合同金额',
      dataIndex: 'projectAmount',
      key: 'projectAmount',
      width: 110,
      render: (v: number) => <strong>¥{v?.toLocaleString() ?? 0}</strong>,
    },
    {
      title: '项目等级',
      dataIndex: 'projectLevel',
      key: 'projectLevel',
      width: 90,
      render: (v: string) =>
        v ? <Tag color={LEVEL_COLORS[v] || 'default'}>{v}</Tag> : '-',
    },
    {
      title: '项目状态',
      dataIndex: 'projectStatus',
      key: 'projectStatus',
      width: 100,
      render: (v: string) => (
        <Tag color={STATUS_COLORS[v] || 'default'}>{v}</Tag>
      ),
    },
    {
      title: '所属部门',
      dataIndex: 'deptBelong',
      key: 'deptBelong',
      width: 100,
    },
    {
      title: '开始日期',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 110,
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right' as const,
      render: (_: unknown, r: ProjectVO) => (
        <Space>
          <Permission code="project:edit">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEdit(r.id)}
            />
          </Permission>
          <Permission code="project:delete">
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                Modal.confirm({
                  title: '确认删除',
                  content: `确定删除项目「${r.projectName}」？此操作不可撤销。`,
                  okText: '确认删除',
                  cancelText: '取消',
                  okButtonProps: { danger: true },
                  onOk: () => handleDelete(r.id),
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
          placeholder="搜索项目名称/客户"
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
          }}
          style={{ width: 200 }}
          allowClear
        />
        <Select
          placeholder="项目状态"
          value={status}
          onChange={(v) => setStatus(v)}
          allowClear
          style={{ width: 120 }}
          options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
        />
        <Select
          placeholder="项目等级"
          value={projectLevel}
          onChange={(v) => setProjectLevel(v)}
          allowClear
          style={{ width: 110 }}
          options={LEVEL_OPTIONS.map((s) => ({ value: s, label: s }))}
        />
        <Input
          placeholder="所属部门"
          value={deptBelong}
          onChange={(e) => setDeptBelong(e.target.value || undefined)}
          style={{ width: 140 }}
          allowClear
        />

        <Permission code="project:batch">
          <Button
            danger
            disabled={!selectedRowKeys.length}
            onClick={() => {
              if (selectedRowKeys.length === 0) return;
              Modal.confirm({
                title: '批量删除确认',
                content: `确定删除选中的 ${selectedRowKeys.length} 个项目？此操作不可撤销。`,
                okText: '确认删除',
                cancelText: '取消',
                okButtonProps: { danger: true },
                onOk: handleBatchDelete,
              });
            }}
          >
            批量删除({selectedRowKeys.length || 0})
          </Button>
        </Permission>

        <Permission code="project:create">
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新建项目
          </Button>
        </Permission>
      </Space>

      <Table
        columns={columns}
        dataSource={list}
        rowKey="id"
        size="middle"
        loading={loading}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys as number[]),
        }}
        pagination={{
          current: pageNum,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
          onChange: onPageChange,
        }}
        scroll={{ x: 1200 }}
        locale={{ emptyText: '暂无项目数据' }}
      />

      <ProjectForm
        open={formOpen}
        editId={editId}
        onClose={() => setFormOpen(false)}
        onSuccess={() => {
          setFormOpen(false);
          refreshList();
        }}
      />
    </Card>
  );
}
