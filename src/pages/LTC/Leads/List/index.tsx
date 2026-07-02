import { useEffect, useState } from 'react';
import { Table, Button, Tag, Input, Select, Space, Card, message, Modal } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Permission from '../../../../components/auth/Permission';
import {
  fetchCluePage,
  deleteClue,
  batchDeleteClue,
  type ClueVO,
  type CluePageParams,
} from '../../../../api/clue';

const STATUS_OPTIONS = ['待跟进', '跟进中', '已提案', '已签约', '已关闭'];
const LEVEL_OPTIONS = ['S', 'A', 'B', 'C'];

const STATUS_COLORS: Record<string, string> = {
  '待跟进': 'blue', '跟进中': 'orange', '已提案': 'purple',
  '已签约': 'green', '已关闭': 'default',
};

const LEVEL_COLORS: Record<string, string> = {
  S: 'red', A: 'orange', B: 'blue', C: 'default',
};

export default function LeadsList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<ClueVO[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);

  const buildParams = (pn: number, ps: number): CluePageParams => {
    const p: CluePageParams = { pageNum: pn, pageSize: ps };
    if (search) p.keyword = search;
    if (statusFilter) p.status = statusFilter;
    if (levelFilter) p.level = levelFilter;
    return p;
  };

  const loadData = async (pn = pageNum, ps = pageSize) => {
    setLoading(true);
    try {
      const res = await fetchCluePage(buildParams(pn, ps));
      setList(res.records || []);
      setTotal(res.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPageNum(1);
    loadData(1, pageSize);
  }, [search, statusFilter, levelFilter]);

  const onPageChange = (pn: number, ps: number) => {
    setPageNum(pn);
    setPageSize(ps);
    loadData(pn, ps);
  };

  const refresh = () => loadData(pageNum, pageSize);

  const handleSingleDelete = async (clue: ClueVO) => {
    await deleteClue(clue.id);
    message.success('已移入回收站');
    refresh();
  };

  const handleBatchDelete = async () => {
    await batchDeleteClue(selectedRowKeys);
    message.success(`已批量删除 ${selectedRowKeys.length} 条`);
    setSelectedRowKeys([]);
    refresh();
  };

  const columns = [
    { title: '线索名称', dataIndex: 'clueName', width: 180, render: (v: string, r: ClueVO) => <a onClick={() => navigate(`/ltc/leads/${r.id}`)}>{v}</a> },
    { title: '甲方公司', dataIndex: 'clientCompany', width: 120 },
    { title: '乙方对接人', dataIndex: 'beikeOwner', width: 80 },
    { title: '甲方对接人', dataIndex: 'clientContact', width: 100 },
    { title: '预算量级', dataIndex: 'budget', width: 100 },
    { title: '线索状态', dataIndex: 'clueStatus', width: 90, render: (v: string) => <Tag color={STATUS_COLORS[v]}>{v}</Tag> },
    { title: '评价', dataIndex: 'clueEvaluation', width: 80, render: (v: string) => v ? <Tag color={v === '高价值' ? 'red' : v === '中等价值' ? 'orange' : 'default'}>{v}</Tag> : '-' },
    { title: '等级', dataIndex: 'clueLevel', width: 70, render: (v: string) => v ? <Tag color={LEVEL_COLORS[v] || 'default'}>{v}</Tag> : '-' },
    { title: '留痕日期', dataIndex: 'createDate', width: 110 },
    {
      title: '操作', key: 'action', width: 140, fixed: 'right' as const,
      render: (_: unknown, r: ClueVO) => (
        <Space>
          <a onClick={() => navigate(`/ltc/leads/${r.id}`)}>详情</a>
          <Permission code="clue:edit"><a onClick={() => navigate(`/ltc/leads/${r.id}?edit=1`)}>编辑</a></Permission>
          <Permission code="clue:delete">
            <a onClick={() => Modal.confirm({
              title: '确认删除', content: `确定删除线索「${r.clueName}」？数据将移入回收站。`,
              okText: '确认删除', cancelText: '取消', okButtonProps: { danger: true },
              onOk: () => handleSingleDelete(r),
            })}>删除</a>
          </Permission>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input prefix={<SearchOutlined />} placeholder="搜索线索名称/公司" value={search} onChange={e => setSearch(e.target.value)} style={{ width: 200 }} allowClear />
        <Select placeholder="全部状态" value={statusFilter} onChange={v => setStatusFilter(v)} allowClear style={{ width: 110 }}
          options={STATUS_OPTIONS.map(v => ({ value: v, label: v }))} />
        <Select placeholder="全部等级" value={levelFilter} onChange={v => setLevelFilter(v)} allowClear style={{ width: 110 }}
          options={LEVEL_OPTIONS.map(v => ({ value: v, label: v }))} />
        <Permission code="clue:batch">
          <Button danger disabled={!selectedRowKeys.length} onClick={() => Modal.confirm({
            title: '批量删除确认', content: `确定删除选中的 ${selectedRowKeys.length} 条线索？数据将移入回收站。`,
            okText: '确认删除', cancelText: '取消', okButtonProps: { danger: true },
            onOk: handleBatchDelete,
          })}>批量删除({selectedRowKeys.length || 0})</Button>
        </Permission>
        <Permission code="clue:create">
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/ltc/leads/new')}>新建线索</Button>
        </Permission>
      </Space>
      <Table columns={columns} dataSource={list} rowKey="id" size="middle" loading={loading}
        rowSelection={{ selectedRowKeys, onChange: keys => setSelectedRowKeys(keys as number[]) }}
        pagination={{ current: pageNum, pageSize, total, showSizeChanger: true, showTotal: t => `共 ${t} 条`, onChange: onPageChange }}
        scroll={{ x: 1300 }} locale={{ emptyText: '暂无线索数据' }} />
    </Card>
  );
}
