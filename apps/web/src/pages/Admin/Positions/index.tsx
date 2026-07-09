import { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Input, InputNumber, Space, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { fetchPositionList, createPosition, updatePosition, deletePosition, type Position } from '../../../api/position';

function PositionPage() {
  const [data, setData] = useState<Position[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Position | null>(null);
  const [name, setName] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    const list = await fetchPositionList();
    setData(list);
  };

  useEffect(() => { loadData(); }, []);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setSortOrder(data.length + 1);
    setModalOpen(true);
  };

  const openEdit = (item: Position) => {
    setEditing(item);
    setName(item.name);
    setSortOrder(item.sort_order);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return message.warning('请输入职位名称');
    setLoading(true);
    if (editing) {
      await updatePosition(editing.id, name.trim(), sortOrder);
    } else {
      await createPosition(name.trim(), sortOrder);
    }
    setLoading(false);
    setModalOpen(false);
    loadData();
    message.success(editing ? '修改成功' : '创建成功');
  };

  const handleDelete = async (id: number) => {
    await deletePosition(id);
    loadData();
    message.success('已删除');
  };

  const columns = [
    { title: '排序', dataIndex: 'sort_order', width: 80 },
    { title: '职位名称', dataIndex: 'name' },
    {
      title: '操作', width: 160,
      render: (_: unknown, r: Position) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card title="职位管理" extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增职位</Button>}>
      <Table dataSource={data} columns={columns} rowKey="id" pagination={false} size="middle" />
      <Modal title={editing ? '编辑职位' : '新增职位'} open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)} confirmLoading={loading}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8 }}>职位名称</div>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="请输入职位名称" />
        </div>
        <div>
          <div style={{ marginBottom: 8 }}>排序号</div>
          <InputNumber value={sortOrder} onChange={v => setSortOrder(v || 0)} style={{ width: '100%' }} />
        </div>
      </Modal>
    </Card>
  );
}

export default PositionPage;
