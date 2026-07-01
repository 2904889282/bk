import { useState, useEffect } from 'react';
import { Card, Row, Col, Tag, Button, Modal, Form, Input, DatePicker, message } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import type { TriangleMember } from '../../../../store/useLeadStore';
import { LS_TRIANGLE, loadLS, saveLS } from '../../../../store/useLeadStore';
import dayjs from 'dayjs';

const ROLE_CONFIG: Record<string, { title: string; color: string; icon: string; responsibility: string }> = {
  AR: { title: '客户经理 (AR)', color: '#6366f1', icon: '👤', responsibility: '负责客户关系维护、商务谈判、合同签订，是项目第一负责人' },
  SR: { title: '方案经理 (SR)', color: '#10b981', icon: '📋', responsibility: '负责方案设计、技术选型、需求澄清，提供专业解决方案' },
  FR: { title: '交付经理 (FR)', color: '#f59e0b', icon: '🚀', responsibility: '负责项目交付实施、进度管控、质量保障，确保按时交付' },
};

interface Props { leadId: string; }
export default function TriangleTab({ leadId }: Props) {
  const [members, setMembers] = useState<TriangleMember[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editRole, setEditRole] = useState<'AR' | 'SR' | 'FR'>('AR');
  const [form] = Form.useForm();

  const load = () => setMembers(loadLS<TriangleMember[]>(LS_TRIANGLE, []).filter(m => m.leadId === leadId));
  useEffect(() => { load(); }, [leadId]);

  const ensureDefaults = () => {
    const all = loadLS<TriangleMember[]>(LS_TRIANGLE, []);
    const existing = all.filter(m => m.leadId === leadId);
    const roles = ['AR', 'SR', 'FR'] as const;
    const defaults: TriangleMember[] = [];
    roles.forEach(role => {
      if (!existing.find(m => m.role === role)) {
        defaults.push({ leadId, role, name: '', responsibility: ROLE_CONFIG[role].responsibility, todo: '', deadline: '' });
      }
    });
    if (defaults.length > 0) { all.push(...defaults); saveLS(LS_TRIANGLE, all); }
    load();
  };

  useEffect(() => { ensureDefaults(); }, [leadId]); // eslint-disable-line

  const openEdit = (role: 'AR' | 'SR' | 'FR') => {
    const m = members.find(x => x.role === role);
    form.setFieldsValue({ name: m?.name, todo: m?.todo, deadline: m?.deadline ? dayjs(m.deadline) : null });
    setEditRole(role); setEditOpen(true);
  };

  const handleEdit = () => {
    form.validateFields().then(vals => {
      const all = loadLS<TriangleMember[]>(LS_TRIANGLE, []);
      const idx = all.findIndex(m => m.leadId === leadId && m.role === editRole);
      const updated = {
        leadId, role: editRole,
        name: vals.name, responsibility: ROLE_CONFIG[editRole].responsibility,
        todo: vals.todo, deadline: vals.deadline ? vals.deadline.format('YYYY-MM-DD') : '',
      };
      if (idx >= 0) all[idx] = updated; else all.push(updated);
      saveLS(LS_TRIANGLE, all);
      message.success(`${ROLE_CONFIG[editRole].title} 已更新`);
      setEditOpen(false); load();
    }).catch(() => {});
  };

  return (
    <div>
      <Row gutter={[16, 16]}>
        {(['AR', 'SR', 'FR'] as const).map(role => {
          const m = members.find(x => x.role === role);
          const cfg = ROLE_CONFIG[role];
          return (
            <Col xs={24} md={8} key={role}>
              <Card
                title={<span>{cfg.icon} {cfg.title}</span>}
                extra={<Button size="small" icon={<EditOutlined />} onClick={() => openEdit(role)}>编辑</Button>}
                style={{ borderTop: `3px solid ${cfg.color}` }}
              >
                <div style={{ color: '#666', fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>{cfg.responsibility}</div>
                <div style={{ marginBottom: 8 }}><Tag color={cfg.color}>负责人</Tag> <strong>{m?.name || '-'}</strong></div>
                <div style={{ marginBottom: 8 }}><Tag>当前待办</Tag> {m?.todo || '-'}</div>
                <div><Tag>截止时间</Tag> {m?.deadline || '-'}</div>
              </Card>
            </Col>
          );
        })}
      </Row>

      <Card title="📅 整体执行计划" style={{ marginTop: 16 }}>
        <div style={{ color: '#666', fontSize: 13, lineHeight: 2 }}>
          {members.filter(m => m.name).length === 0 ? (
            <span>尚未指定铁三角成员，请点击各卡片右上角编辑按钮填写。</span>
          ) : (
            members.filter(m => m.name).sort((a, b) => a.deadline.localeCompare(b.deadline)).map(m => (
              <div key={m.role} style={{ marginBottom: 8 }}>
                <Tag color={ROLE_CONFIG[m.role].color}>{ROLE_CONFIG[m.role].title}</Tag>
                <strong>{m.name}</strong> — {m.todo || '待填写'}
                {m.deadline && <span style={{ color: '#999', marginLeft: 8 }}>截止: {m.deadline}</span>}
              </div>
            ))
          )}
        </div>
      </Card>

      <Modal title={`编辑 ${ROLE_CONFIG[editRole].title}`} open={editOpen} onCancel={() => setEditOpen(false)} onOk={handleEdit} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="指定负责人" rules={[{ required: true, message: '请输入负责人' }]}>
            <Input placeholder="输入姓名" />
          </Form.Item>
          <Form.Item name="todo" label="当前待办" rules={[{ required: true, message: '请输入待办内容' }]}>
            <Input.TextArea rows={2} placeholder="当前阶段核心待办事项" />
          </Form.Item>
          <Form.Item name="deadline" label="截止时间">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
