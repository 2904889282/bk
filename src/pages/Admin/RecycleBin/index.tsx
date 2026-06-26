import { useEffect, useState } from 'react';
import { Table, Button, Tag, Input, Select, Space, Card, message, Modal } from 'antd';
import { useLeadStore, LEAD_STATUS_COLORS, type Lead } from '../../../store/useLeadStore';
import Permission from '../../../components/auth/Permission';

export default function RecycleBin() {
  const { loadAll, restore, permDelete } = useLeadStore();
  const [trash, setTrash] = useState<Lead[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [permConfirmText, setPermConfirmText] = useState('');
  const [permModalOpen, setPermModalOpen] = useState(false);

  const refresh = () => {
    const all = loadAll();
    setTrash(all.filter(l => l.isDeleted));
    setSelectedKeys([]);
  };

  useEffect(() => { refresh(); }, []);

  let data = trash;
  if (search) { const s = search.toLowerCase(); data = data.filter(l => l.name.toLowerCase().includes(s) || l.company.toLowerCase().includes(s)); }

  const handleRestore = (ids: string[]) => {
    const conflict = restore(ids);
    if (conflict) { message.warning('以下线索恢复时存在冲突(同名同客户): ' + conflict + ', 请先处理冲突'); }
    else { message.success(`已恢复 ${ids.length} 条`); }
    refresh();
  };

  const handlePermDelete = () => {
    if (permConfirmText !== '确认删除') { message.warning('请输入"确认删除"'); return; }
    permDelete(selectedKeys);
    message.success(`已永久删除 ${selectedKeys.length} 条，不可恢复`);
    setPermConfirmText('');
    setPermModalOpen(false);
    refresh();
  };

  const columns = [
    { title: '线索名称', dataIndex: 'name', width: 160 },
    { title: '甲方公司', dataIndex: 'company', width: 120 },
    { title: '承接人', dataIndex: 'owner', width: 80 },
    { title: '状态', dataIndex: 'status', width: 90, render: (v: string) => <Tag color={LEAD_STATUS_COLORS[v]}>{v}</Tag> },
    { title: '删除时间', dataIndex: 'deleteTime', width: 160 },
    { title: '删除人', dataIndex: 'deleteBy', width: 80 },
    {
      title: '操作', key: 'action', width: 200,
      render: (_: unknown, r: Lead) => (
        <Space>
          <Button size="small" type="primary" ghost onClick={() => handleRestore([r.id])}>恢复</Button>
          <Permission code="admin:recycle">
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
          🔄 批量恢复({selectedKeys.length || 0})
        </Button>
        <Permission code="admin:recycle">
          <Button danger disabled={!selectedKeys.length} onClick={() => setPermModalOpen(true)}>
            ⚠️ 永久删除({selectedKeys.length || 0})
          </Button>
        </Permission>
        <span style={{ color: '#999', fontSize: 12 }}>共 {trash.length} 条已删除线索，30天内可恢复</span>
      </Space>
      <Table columns={columns} dataSource={data} rowKey="id" size="middle"
        rowSelection={{ selectedRowKeys: selectedKeys, onChange: (keys) => setSelectedKeys(keys as string[]) }}
        pagination={{ pageSize: 15, showTotal: t => `共 ${t} 条` }} />

      <Modal title="⚠️ 永久删除确认" open={permModalOpen} onCancel={() => { setPermModalOpen(false); setPermConfirmText(''); }}
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
