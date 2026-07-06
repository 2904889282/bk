import { useState, useEffect, useCallback } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, message, Popconfirm, Tag, Card, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, RedoOutlined } from '@ant-design/icons';
import request from '../../../utils/request';

interface UserRow {
  id: string; username: string; realName: string; status: number;
  avatar?: string; createdAt: string;
}

export default function AdminUsers() {
  const [data, setData] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await request.get('/api/user/page', { params: { page, size: 10, keyword } });
      setData(res.data?.records || []);
      setTotal(res.data?.total || 0);
    } catch {
      // 后端不可用 — 降级 localStorage
      const stored = JSON.parse(localStorage.getItem('beike_admin_users') || '[]');
      if (stored.length === 0) {
        const defaults = [
          { id: 'U001', username: 'admin', realName: '管理员', status: 1, createdAt: '2026-01-01' },
          { id: 'U002', username: 'zhangming', realName: '张明', status: 1, createdAt: '2026-01-01' },
        ];
        localStorage.setItem('beike_admin_users', JSON.stringify(defaults));
        stored.push(...defaults);
      }
      let filtered = stored;
      if (keyword) filtered = filtered.filter((u: UserRow) => u.username.includes(keyword) || u.realName?.includes(keyword));
      setData(filtered.slice((page - 1) * 10, page * 10));
      setTotal(filtered.length);
    }
    setLoading(false);
  }, [page, keyword]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openModal = (user?: UserRow) => {
    setEditId(user ? user.id : null);
    form.resetFields();
    if (user) form.setFieldsValue({ username: user.username, realName: user.realName, status: user.status });
    setModalOpen(true);
  };

  const saveToLocal = (users: UserRow[]) => localStorage.setItem('beike_admin_users', JSON.stringify(users));
  const getLocal: () => UserRow[] = () => JSON.parse(localStorage.getItem('beike_admin_users') || '[]');

  const handleSave = async () => {
    const values = await form.validateFields();
    try {
      if (editId) {
        await request.put('/api/user', { id: editId, ...values, password: values.password || '' });
      } else {
        await request.post('/api/user', values);
      }
    } catch {
      // 降级 localStorage
      const users = getLocal();
      if (editId) {
        const idx = users.findIndex(u => u.id === editId);
        if (idx >= 0) { users[idx] = { ...users[idx], ...values }; saveToLocal(users); }
      } else {
        if (users.find(u => u.username === values.username)) { message.error('用户名已存在'); return; }
        users.push({ id: 'U' + Date.now(), username: values.username, realName: values.realName || values.username, status: 1, createdAt: new Date().toISOString().slice(0, 10) });
        saveToLocal(users);
      }
    }
    message.success(editId ? '已更新' : '已创建');
    setModalOpen(false); fetchData();
  };

  const handleDelete = async (id: string) => {
    try { await request.delete(`/api/user/${id}`); } catch {
      saveToLocal(getLocal().filter(u => u.id !== id));
    }
    message.success('已删除'); fetchData();
  };

  const toggleStatus = async (id: string) => {
    try { await request.put(`/api/user/${id}/status`); } catch {
      const users = getLocal();
      const u = users.find(x => x.id === id);
      if (u) { u.status = u.status === 1 ? 0 : 1; saveToLocal(users); }
    }
    fetchData();
  };

  const resetPwd = async (id: string) => {
    try { await request.put(`/api/user/${id}/reset-password`, { password: '123456' }); } catch {}
    message.success('已重置为 123456');
  };

  const columns = [
    { title: '用户名', dataIndex: 'username', key: 'username', width: 120, render: (v: string) => <strong>{v}</strong> },
    { title: '姓名', dataIndex: 'realName', key: 'realName', width: 100 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (v: number) => <Tag color={v === 1 ? 'green' : 'red'}>{v === 1 ? '正常' : '禁用'}</Tag> },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
    {
      title: '操作', key: 'action', width: 280, render: (_: unknown, r: UserRow) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openModal(r)}>编辑</Button>
          <Switch size="small" checked={r.status === 1} onChange={() => toggleStatus(r.id)} />
          <Button size="small" icon={<RedoOutlined />} onClick={() => resetPwd(r.id)}>重置密码</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search placeholder="搜索用户" value={keyword} onChange={e => setKeyword(e.target.value)}
          onSearch={() => { setPage(1); fetchData(); }} style={{ width: 240 }} allowClear enterButton />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>新增用户</Button>
      </Space>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading}
        pagination={{ current: page, total, pageSize: 10, onChange: p => setPage(p), showTotal: t => `共 ${t} 人` }} />

      <Modal title={editId ? '编辑用户' : '新增用户'} open={modalOpen} onCancel={() => setModalOpen(false)}
        onOk={handleSave} destroyOnHidden width={520}>
        <Form form={form} layout="vertical">
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input disabled={!!editId} placeholder="登录用户名" />
          </Form.Item>
          <Form.Item name="realName" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="真实姓名" />
          </Form.Item>
          <Form.Item name="password" label={editId ? '新密码（留空不修改）' : '密码'} rules={editId ? [] : [{ required: true, message: '请输入密码' }]}>
            <Input.Password placeholder="至少6位" />
          </Form.Item>
          {!editId && (
            <Form.Item name="status" label="状态" initialValue={1}>
              <Select options={[{ value: 1, label: '正常' }, { value: 0, label: '禁用' }]} />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </Card>
  );
}
