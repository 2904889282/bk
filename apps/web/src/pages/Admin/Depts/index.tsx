import { useEffect, useState } from 'react';
import { Card, Tree, Button, Modal, Input, TreeSelect, Space, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import { fetchDeptTree, createDept, updateDept, deleteDept, type DeptNode } from '../../../api/dept';

function DeptPage() {
  const [treeData, setTreeData] = useState<DataNode[]>([]);
  const [flatList, setFlatList] = useState<DeptNode[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<{ id: number; name: string; parentId?: number | null } | null>(null);
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<number | null | undefined>(null);
  const [loading, setLoading] = useState(false);

  const flatten = (nodes: DeptNode[]): DeptNode[] => {
    let result: DeptNode[] = [];
    for (const n of nodes) {
      result.push({ id: n.id, name: n.name, parent_id: n.parent_id });
      if (n.children) result = result.concat(flatten(n.children));
    }
    return result;
  };

  const buildTree = (nodes: DeptNode[]): DataNode[] =>
    nodes.map(n => ({
      key: n.id,
      title: n.name,
      children: n.children ? buildTree(n.children) : undefined,
    }));

  const loadData = async () => {
    const data = await fetchDeptTree();
    setTreeData(buildTree(data));
    setFlatList(flatten(data));
  };

  useEffect(() => { loadData(); }, []);

  const openCreate = (pid?: number | null) => {
    setEditingNode(null);
    setName('');
    setParentId(pid);
    setModalOpen(true);
  };

  const openEdit = (id: number, currentName: string) => {
    setEditingNode({ id, name: currentName });
    setName(currentName);
    setParentId(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return message.warning('请输入部门名称');
    setLoading(true);
    if (editingNode) {
      await updateDept(editingNode.id, name.trim());
    } else {
      await createDept(name.trim(), parentId || null);
    }
    setLoading(false);
    setModalOpen(false);
    loadData();
    message.success(editingNode ? '修改成功' : '创建成功');
  };

  const handleDelete = async (id: number) => {
    const res = await deleteDept(id);
    if (res.code === 200) {
      loadData();
      message.success('已删除');
    } else {
      message.error(res.msg || '删除失败');
    }
  };

  return (
    <Card title="部门管理" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openCreate(null)}>新增根部门</Button>}>
      <Tree
        treeData={treeData}
        blockNode
        defaultExpandAll
        titleRender={(node) => (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '4px 0' }}>
            <span>{String(node.title)}</span>
            <Space size="small" onClick={e => e.stopPropagation()}>
              <Button size="small" type="link" icon={<PlusOutlined />} onClick={() => openCreate(node.key as number)}>子部门</Button>
              <Button size="small" type="link" icon={<EditOutlined />} onClick={() => openEdit(node.key as number, String(node.title))} />
              <Popconfirm title="确定删除？如有子部门需先删除" onConfirm={() => handleDelete(node.key as number)}>
                <Button size="small" type="link" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Space>
          </div>
        )}
      />
      <Modal title={editingNode ? '编辑部门' : '新增部门'} open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)} confirmLoading={loading}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8 }}>部门名称</div>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="请输入部门名称" />
        </div>
        {!editingNode && (
          <div>
            <div style={{ marginBottom: 8 }}>上级部门（留空为根部门）</div>
            <TreeSelect
              style={{ width: '100%' }}
              treeData={treeData}
              value={parentId}
              onChange={v => setParentId(v)}
              placeholder="选择上级部门"
              allowClear
              treeDefaultExpandAll
              fieldNames={{ label: 'title', value: 'key', children: 'children' }}
            />
          </div>
        )}
      </Modal>
    </Card>
  );
}

export default DeptPage;
