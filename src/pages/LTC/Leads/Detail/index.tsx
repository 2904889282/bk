import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Descriptions, Button, Tag, Space, Tabs, Input, Select, DatePicker, message, Row, Col } from 'antd';
import { ArrowLeftOutlined, EditOutlined, SaveOutlined, DeleteOutlined } from '@ant-design/icons';
import { useLeadStore, LEAD_FIELDS, LEAD_STATUS_COLORS, type Lead } from '../../../../store/useLeadStore';
import dayjs from 'dayjs';

export default function LeadsDetail() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { leads, load, update, remove } = useLeadStore();
  const [editMode, setEditMode] = useState(params.get('edit') === '1');
  const [form, setForm] = useState<Partial<Lead>>({});

  useEffect(() => { load(); }, [load]);
  const lead = id === 'new' ? {} as Lead : leads.find(l => l.id === id);

  if (!lead && id !== 'new') return <Card><p>线索不存在</p></Card>;

  const isNew = id === 'new';
  const { add } = useLeadStore();

  const handleSave = () => {
    const data = { ...form, ...(form.contactDate ? { contactDate: dayjs.isDayjs(form.contactDate) ? dayjs(form.contactDate as unknown as dayjs.Dayjs).format('YYYY-MM-DD') : form.contactDate } : {}), ...(form.proposalDate ? { proposalDate: dayjs.isDayjs(form.proposalDate as unknown as dayjs.Dayjs) ? dayjs(form.proposalDate as unknown as dayjs.Dayjs).format('YYYY-MM-DD') : form.proposalDate } : {}), ...(form.createdAt ? { createdAt: dayjs.isDayjs(form.createdAt as unknown as dayjs.Dayjs) ? dayjs(form.createdAt as unknown as dayjs.Dayjs).format('YYYY-MM-DD') : form.createdAt } : {}) };
    if (isNew) { add({ ...data, name: data.name || '新线索', company: data.company || '', owner: data.owner || '', status: data.status || '待跟进' } as Lead); message.success('线索已创建'); navigate('/ltc/leads'); }
    else { update(id!, data); message.success('已保存'); setEditMode(false); }
  };

  const fieldValue = (key: keyof Lead) => editMode ? (form[key] ?? lead?.[key]) : (lead?.[key]);

  const renderField = (f: typeof LEAD_FIELDS[number]) => {
    const v = fieldValue(f.key);
    if (editMode) {
      if (f.type === 'select' && f.options) return <Select value={v as string} onChange={val => setForm(p => ({ ...p, [f.key]: val }))} style={{ width: '100%' }} options={f.options.map(o => ({ value: o, label: o }))} />;
      if (f.type === 'date') return <DatePicker value={v ? dayjs(v as string) : null} onChange={d => setForm(p => ({ ...p, [f.key]: d ? d.format('YYYY-MM-DD') : '' }))} style={{ width: '100%' }} />;
      if (f.type === 'longtext') return <Input.TextArea value={v as string} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} rows={2} />;
      return <Input value={v as string} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />;
    }
    if (f.type === 'longtext') {
      const [expanded, setExpanded] = useState(false);
      const text = v == null || v === '' ? '-' : String(v);
      return text.length > 80 && !expanded ? <span>{text.slice(0, 80)}... <a onClick={() => setExpanded(true)}>展开</a></span> : <span>{text} {text.length > 80 && expanded ? <a onClick={() => setExpanded(false)}>收起</a> : ''}</span>;
    }
    if (f.key === 'status') return <Tag color={LEAD_STATUS_COLORS[String(v)]}>{v || '-'}</Tag>;
    return v == null || v === '' ? '-' : String(v);
  };

  const baseFields = LEAD_FIELDS.filter(f => ['name','company','department','contact','owner','budget','requirements','status','contactDate','proposalDate'].includes(f.key));
  const bizFields = LEAD_FIELDS.filter(f => ['evaluation','projectLevel','notes','dept','reviewStatus','confirmedBiz'].includes(f.key));
  const commFields = LEAD_FIELDS.filter(f => f.key.startsWith('commRecord'));
  const metaFields = LEAD_FIELDS.filter(f => ['createdAt','relation1','relation2','relation3'].includes(f.key));

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/ltc/leads')}>返回列表</Button>
        {!isNew && !editMode && <Button icon={<EditOutlined />} onClick={() => { setForm({}); setEditMode(true); }}>编辑</Button>}
        {(editMode || isNew) && <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>保存</Button>}
        {!isNew && <Button danger icon={<DeleteOutlined />} onClick={() => { remove(id!); message.success('已删除'); navigate('/ltc/leads'); }}>删除</Button>}
      </Space>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="📋 基础信息" style={{ marginBottom: 16 }}>
            <Descriptions column={2} size="small" bordered>
              {baseFields.map(f => <Descriptions.Item key={f.key} label={f.label} span={['requirements'].includes(f.key) ? 2 : 1}>{renderField(f)}</Descriptions.Item>)}
            </Descriptions>
          </Card>
          <Card title="💼 业务详情">
            <Descriptions column={2} size="small" bordered>
              {bizFields.map(f => <Descriptions.Item key={f.key} label={f.label} span={['notes'].includes(f.key) ? 2 : 1}>{renderField(f)}</Descriptions.Item>)}
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card style={{ marginBottom: 16 }}>
            <Tabs items={[{ key: 'comm', label: '💬 沟通记录', children: <Descriptions column={1} size="small" bordered>{commFields.map(f => <Descriptions.Item key={f.key} label={f.label}>{renderField(f)}</Descriptions.Item>)}</Descriptions> }, { key: 'meta', label: '📎 归属信息', children: <Descriptions column={1} size="small" bordered>{metaFields.map(f => <Descriptions.Item key={f.key} label={f.label}>{renderField(f)}</Descriptions.Item>)}</Descriptions> }]} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
