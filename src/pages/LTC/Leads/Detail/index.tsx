import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Tag, Space, Tabs, Input, Select, DatePicker, message, Modal } from 'antd';
import { ArrowLeftOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons';
import { useLeadStore, LEAD_FIELDS, LEAD_STATUS_COLORS, type Lead } from '../../../../store/useLeadStore';
import { LS_LOGS, loadLS, saveLS } from '../../../../store/useLeadStore';
import type { OperationLogItem } from '../../../../store/useLeadStore';
import Permission from '../../../../components/auth/Permission';
import FollowUpTab from './FollowUpTab';
import TriangleTab from './TriangleTab';
import FilesTab from './FilesTab';
import LogsTab from './LogsTab';
import { useDataStore } from '../../../../store/useDataStore';
import dayjs from 'dayjs';

type Tab = 'info' | 'followup' | 'triangle' | 'files' | 'logs';

function addLog(leadId: string, operator: string, actionType: string, detail: string) {
  const logs = loadLS<OperationLogItem[]>(LS_LOGS, []);
  logs.push({ id: 'LOG' + Date.now(), leadId, time: new Date().toISOString().slice(0, 19).replace('T', ' '), operator, actionType, detail });
  saveLS(LS_LOGS, logs);
}

export default function LeadsDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { leads, load, update } = useLeadStore();
  const { addProject } = useDataStore();
  const { user } = useDataStore();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<Partial<Lead>>({});
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [convertOpen, setConvertOpen] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: '', manager: '', amount: '' });

  useEffect(() => { load(); }, [load]);
  const lead = leads.find(l => l.id === id);

  const operator = user?.name || '系统';

  const logAndUpdate = (leadId: string, updates: Partial<Lead>, actionType: string, detail: string) => {
    update(leadId, updates);
    addLog(leadId, operator, actionType, detail);
  };

  if (!lead) return (
    <Card>
      <div style={{ textAlign: 'center', padding: 60 }}>
        <p>线索不存在或已删除</p>
        <Button onClick={() => navigate('/ltc/leads')}>返回线索列表</Button>
      </div>
    </Card>
  );

  const handleSave = () => {
    const data = { ...form,
      ...(form.contactDate && !dayjs.isDayjs(form.contactDate) ? { contactDate: form.contactDate } : {}),
      ...(form.proposalDate && !dayjs.isDayjs(form.proposalDate) ? { proposalDate: form.proposalDate } : {}),
      ...(form.createdAt && !dayjs.isDayjs(form.createdAt) ? { createdAt: form.createdAt } : {}),
    };
    logAndUpdate(lead.id, data, '编辑', `编辑线索: ${data.name || lead.name}`);
    message.success('已保存'); setEditMode(false);
  };

  const handleConvertToProject = () => {
    const name = projectForm.name || lead.name;
    addProject({
      name, stage: 'initiation', client: lead.company, amount: Number(projectForm.amount) || 0,
      progress: 0, status: 'active', manager: projectForm.manager || lead.owner,
      startDate: new Date().toISOString().slice(0, 10), expectedEnd: '',
      description: lead.requirements || '',
    });
    logAndUpdate(lead.id, { status: '已承接' }, '转为项目', `线索转为项目: ${name}`);
    message.success(`已创建项目「${name}」，线索状态已更新为已承接`);
    setConvertOpen(false);
  };

  const fieldValue = (key: keyof Lead) => editMode ? (form[key] ?? lead[key]) : lead[key];
  const renderField = (f: typeof LEAD_FIELDS[number]) => {
    const v = fieldValue(f.key);
    if (editMode) {
      if (f.type === 'select' && f.options) return <Select value={v as string} onChange={val => setForm(p => ({ ...p, [f.key]: val }))} style={{ width: '100%' }} options={f.options.map(o => ({ value: o, label: o }))} />;
      if (f.type === 'date') return <DatePicker value={v ? dayjs(v as string) : null} onChange={d => setForm(p => ({ ...p, [f.key]: d ? d.format('YYYY-MM-DD') : '' }))} style={{ width: '100%' }} />;
      if (f.type === 'longtext') return <Input.TextArea value={v as string} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} rows={2} />;
      return <Input value={v as string} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />;
    }
    if (f.key === 'status') return <Tag color={LEAD_STATUS_COLORS[String(v)]}>{v || '-'}</Tag>;
    return v == null || v === '' ? '-' : String(v);
  };

  const groupFields = (keys: string[]) => LEAD_FIELDS.filter(f => keys.includes(f.key));
  const infoGroups = [
    { title: '甲方信息', keys: ['name', 'company', 'department', 'contact'] },
    { title: '项目信息', keys: ['budget', 'requirements', 'evaluation', 'projectLevel'] },
    { title: '人员信息', keys: ['owner', 'dept', 'confirmedBiz'] },
    { title: '时间信息', keys: ['contactDate', 'proposalDate', 'createdAt'] },
    { title: '评审信息', keys: ['reviewStatus', 'notes'] },
  ];

  // 基础信息 Tab
  const infoContent = (
    <div>
      {infoGroups.map(g => (
        <Card title={g.title} size="small" style={{ marginBottom: 16 }} key={g.title}>
          <Descriptions column={{ xs: 1, sm: 2 }} size="small" bordered>
            {groupFields(g.keys).map(f => (
              <Descriptions.Item key={f.key} label={f.label} span={['requirements', 'notes'].includes(f.key) ? 2 : 1}>
                {renderField(f)}
              </Descriptions.Item>
            ))}
          </Descriptions>
        </Card>
      ))}
      {/* 关联信息 */}
      <Card title="沟通记录" size="small" style={{ marginBottom: 16 }}>
        <Descriptions column={1} size="small" bordered>
          {LEAD_FIELDS.filter(f => f.key.startsWith('commRecord')).map(f => (
            <Descriptions.Item key={f.key} label={f.label}>{renderField(f)}</Descriptions.Item>
          ))}
        </Descriptions>
      </Card>
    </div>
  );

  const tabItems = [
    { key: 'info', label: '📋 基础信息', children: infoContent },
    { key: 'followup', label: '💬 跟进进度', children: <FollowUpTab leadId={lead.id} operator={operator} /> },
    { key: 'triangle', label: '🔺 铁三角', children: <TriangleTab leadId={lead.id} /> },
    { key: 'files', label: '📎 资料附件', children: <FilesTab leadId={lead.id} operator={operator} onLog={(action, detail) => addLog(lead.id, operator, action, detail)} /> },
    { key: 'logs', label: '📝 操作日志', children: <LogsTab leadId={lead.id} /> },
  ];

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* 顶部固定信息栏 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <Space align="center" style={{ marginBottom: 8 }}>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/ltc/leads')} size="small">返回</Button>
              <span style={{ fontSize: 18, fontWeight: 700 }}>{lead.name}</span>
              <Tag>{lead.company}</Tag>
              {lead.projectLevel && <Tag color={lead.projectLevel === 'S' ? 'red' : lead.projectLevel === 'A' ? 'orange' : 'blue'}>{lead.projectLevel}</Tag>}
            </Space>
            <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
              <span>预算: {lead.budget || '-'}</span>
              <span>状态: <Tag color={LEAD_STATUS_COLORS[lead.status]}>{lead.status}</Tag></span>
              <span>承接部门: {lead.dept || '-'}</span>
              <span>创建: {lead.createdAt || '-'}</span>
            </div>
          </div>
          <Space wrap>
            <Permission code="pipeline:edit">
              {editMode ? (
                <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>保存</Button>
              ) : (
                <Button icon={<EditOutlined />} onClick={() => { setForm({}); setEditMode(true); }}>编辑</Button>
              )}
            </Permission>
            {!editMode && (
              <Permission code="pipeline:edit">
                <Button onClick={() => { setActiveTab('followup'); }}>+ 新增跟进</Button>
              </Permission>
            )}
            {lead.status === '已承接' && (
              <Permission code="pipeline:edit">
                <Button type="primary" onClick={() => { setProjectForm({ name: lead.name, manager: lead.owner, amount: lead.budget || '0' }); setConvertOpen(true); }}>
                  🔄 转为项目
                </Button>
              </Permission>
            )}
          </Space>
        </div>
      </Card>

      {/* Tabs */}
      <Card>
        <Tabs activeKey={activeTab} onChange={k => setActiveTab(k as Tab)} items={tabItems} />
      </Card>

      {/* 转为项目弹窗 */}
      <Modal title="🔄 线索转为项目" open={convertOpen} onCancel={() => setConvertOpen(false)} onOk={handleConvertToProject} destroyOnClose>
        <p style={{ color: '#666', marginBottom: 16 }}>将此线索的基础信息同步创建为新项目</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>项目名称</div>
            <Input value={projectForm.name} onChange={e => setProjectForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>项目经理</div>
            <Input value={projectForm.manager} onChange={e => setProjectForm(p => ({ ...p, manager: e.target.value }))} />
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>金额（万）</div>
            <Input type="number" value={projectForm.amount} onChange={e => setProjectForm(p => ({ ...p, amount: e.target.value }))} />
          </div>
          <div style={{ color: '#999', fontSize: 12 }}>甲方公司「{lead.company}」及需求描述将自动同步</div>
        </div>
      </Modal>
    </div>
  );
}
