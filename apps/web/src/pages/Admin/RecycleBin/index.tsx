import { useEffect, useState } from 'react';
import { Table, Button, Tag, Input, Space, Card, message, Modal } from 'antd';
import { fetchRecyclePage, restoreRecycle, permDeleteRecycle, type ClueVO } from '../../../api/clue';
import Permission from '../../../components/auth/Permission';

const STATUS_COLORS: Record<string, string> = {
  '待跟进': 'blue', '跟进中': 'orange', '已提案': 'purple',
  '已签约': 'green', '已关闭': 'default',
};

export default function RecycleBin() {
  const [list, setList] = useState<ClueVO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pageNum, setPageNum] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedKeys, setSelectedKeys] = useState<number[]>([]);
  const [permModalOpen, setPermModalOpen] = useState(false);
  const [permConfirmText, setPermConfirmText] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchRecyclePage({ pageNum, pageSize: 15, type: 'clue' });
      setList(res.records || []);
      setTotal(res.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [pageNum]);

  let data = list;
  if (search) {
    const s = search.toLowerCase();
    data = list.filter(l => l.clueName?.toLowerCase().includes(s) || l.clientCompany?.toLowerCase().includes(s));
  }

  const handleRestore = async (ids: number[]) => {
    await restoreRecycle(ids);
    message.success(`已恢复 ${ids.length} 条`);
    setSelectedKeys([]);
    loadData();
  };

  const handlePermDelete = async () => {
    if (permConfirmText !== '确认删除') { message.warning('请输入"确认删除"'); return; }
    await permDeleteRecycle(selectedKeys);
    message.success(`已永久删除 ${selectedKeys.length} 条`);
    setPermConfirmText('');
    setPermModalOpen(false);
    setSelectedKeys([]);
    loadData();
  };

  const columns = [
    { title: '线索名称', dataIndex: 'clueName', width: 160 },
    { title: '甲方公司', dataIndex: 'clientCompany', width: 120 },
    { title: '承接人', dataIndex: 'beikeOwner', width: 80 },
    { title: '状态', dataIndex: 'clueStatus', width: 90, render: (v: string) => <Tag color={STATUS_COLORS[v]}>{v}</Tag> },
    { title: '删除时间', dataIndex: 'updateTime', width: 160 },
    {
      title: '操作', key: 'action', width: 200,
      render: (_: unknown, r: ClueVO) => (
        <Space>
          <Button size="small" type="primary" ghost onClick={() => handleRestore([r.id])}>恢复</Button>
          <Permission code="recycle:list">
            <Button size="small" danger onClick={() => { setSelectedKeys([r.id]); setPermModalOpen(true); }}>永久删除</Button>
          </Permission>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search placeholder="搜索线索" value={search} onChange={e => setSearch(e.target.value)} style={{ width: 220 }} allowClear />
        <Button disabled={!selectedKeys.length} onClick={() => handleRestore(selectedKeys)}>
          批量恢复({selectedKeys.length || 0})
        </Button>
        <Permission code="recycle:list">
          <Button danger disabled={!selectedKeys.length} onClick={() => setPermModalOpen(true)}>
            永久删除({selectedKeys.length || 0})
          </Button>
        </Permission>
        <span style={{ color: '#999', fontSize: 12 }}>共 {total} 条已删除线索</span>
      </Space>
      <Table columns={columns} dataSource={data} rowKey="id" size="middle" loading={loading}
        rowSelection={{ selectedRowKeys: selectedKeys, onChange: keys => setSelectedKeys(keys as number[]) }}
        pagination={{ current: pageNum, pageSize: 15, total, showTotal: t => `共 ${t} 条`, onChange: p => setPageNum(p) }}
        locale={{ emptyText: '回收站为空' }} />

      <Modal title="永久删除确认" open={permModalOpen} onCancel={() => { setPermModalOpen(false); setPermConfirmText(''); }}
        onOk={handlePermDelete} okText="确认永久删除" okButtonProps={{ danger: true }}>
        <p style={{ marginBottom: 12, color: '#ef4444' }}>
          将永久删除 {selectedKeys.length} 条数据，此操作不可恢复！
        </p>
        <p>请输入 <strong>确认删除</strong> 以继续：</p>
        <Input value={permConfirmText} onChange={e => setPermConfirmText(e.target.value)} placeholder="确认删除" />
      </Modal>
    </Card>
  );
}
