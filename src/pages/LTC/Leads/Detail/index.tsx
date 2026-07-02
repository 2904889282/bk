import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Descriptions, Button, Tag, Space, Input, Select, DatePicker, message, Row, Col, Spin, Modal } from 'antd';
import { ArrowLeftOutlined, EditOutlined, SaveOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  fetchClueDetail,
  createClue,
  updateClue,
  deleteClue,
  type ClueVO,
  type ClueSaveDTO,
} from '../../../../api/clue';

const STATUS_OPTIONS = ['待跟进', '跟进中', '已提案', '已签约', '已关闭'];
const LEVEL_OPTIONS = ['S', 'A', 'B', 'C'];
const EVAL_OPTIONS = ['高价值', '中等价值', '低价值'];

const STATUS_COLORS: Record<string, string> = {
  '待跟进': 'blue', '跟进中': 'orange', '已提案': 'purple',
  '已签约': 'green', '已关闭': 'default',
};

type FieldDef = {
  key: keyof ClueSaveDTO | 'createDate' | 'createTime';
  label: string;
  type: 'text' | 'select' | 'date' | 'longtext';
  options?: string[];
  required?: boolean;
};

const BASE_FIELDS: FieldDef[] = [
  { key: 'clueName', label: '线索名称', type: 'text', required: true },
  { key: 'clientCompany', label: '甲方公司', type: 'text', required: true },
  { key: 'clientDept', label: '甲方部门', type: 'text' },
  { key: 'clientContact', label: '甲方对接人', type: 'text' },
  { key: 'beikeOwner', label: '承接人', type: 'text', required: true },
  { key: 'budget', label: '预算量级', type: 'select', options: ['＜10万', '10-50万', '50-100万', '100-500万', '＞500万'] },
  { key: 'requirementDesc', label: '需求说明', type: 'longtext' },
  { key: 'clueStatus', label: '线索状态', type: 'select', options: STATUS_OPTIONS, required: true },
  { key: 'contactDate', label: '接触日期', type: 'date' },
  { key: 'proposalDate', label: '提案日期', type: 'date' },
];

const BIZ_FIELDS: FieldDef[] = [
  { key: 'clueEvaluation', label: '线索评价', type: 'select', options: EVAL_OPTIONS },
  { key: 'clueLevel', label: '项目等级', type: 'select', options: LEVEL_OPTIONS, required: true },
  { key: 'remark', label: '备注说明', type: 'longtext' },
  { key: 'deptBelong', label: '承接部门', type: 'text', required: true },
  { key: 'reviewStatus', label: '评审状态', type: 'select', options: ['待评审', '评审中', '已通过', '未通过'] },
  { key: 'businessConfirmed', label: '确认商机', type: 'select', options: ['是', '否'] },
];

const COMM_FIELDS: FieldDef[] = [
  { key: 'commRecord1', label: '初次沟通记录', type: 'longtext' },
  { key: 'commRecord2', label: '二次沟通记录', type: 'longtext' },
  { key: 'commRecord3', label: '三次沟通记录', type: 'longtext' },
  { key: 'commRecord4', label: '四次沟通记录', type: 'longtext' },
];

const META_FIELDS: FieldDef[] = [
  { key: 'createDate', label: '留痕日期', type: 'text' as const },
  { key: 'relation1', label: '关联', type: 'text' },
  { key: 'relation2', label: '关联1', type: 'text' },
  { key: 'relation3', label: '关联2', type: 'text' },
];

export default function LeadsDetail() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [lead, setLead] = useState<ClueVO | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [editMode, setEditMode] = useState(params.get('edit') === '1' || isNew);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (!isNew && id) {
      setLoading(true);
      fetchClueDetail(Number(id))
        .then(setLead)
        .catch(() => message.error('获取线索详情失败'))
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  const getValue = (key: string) => {
    if (editMode) return form[key] ?? (lead as Record<string, unknown>)?.[key];
    return (lead as Record<string, unknown>)?.[key];
  };

  const renderField = (f: FieldDef) => {
    const v = getValue(f.key);
    if (editMode) {
      if (f.type === 'select' && f.options) {
        return <Select value={v as string} onChange={val => setForm(p => ({ ...p, [f.key]: val }))} style={{ width: '100%' }} options={f.options.map(o => ({ value: o, label: o }))} />;
      }
      if (f.type === 'date') {
        return <DatePicker value={v ? dayjs(v as string) : null} onChange={d => setForm(p => ({ ...p, [f.key]: d ? d.format('YYYY-MM-DD') : undefined }))} style={{ width: '100%' }} />;
      }
      if (f.type === 'longtext') {
        return <Input.TextArea value={v as string} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} rows={2} />;
      }
      return <Input value={v as string} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />;
    }
    if (f.key === 'clueStatus') return <Tag color={STATUS_COLORS[String(v)]}>{v || '-'}</Tag>;
    if (v == null || v === '') return '-';
    return String(v);
  };

  const handleSave = async () => {
    const dto: ClueSaveDTO = {
      clueName: (form.clueName || lead?.clueName || '') as string,
      clientCompany: (form.clientCompany || lead?.clientCompany || '') as string,
      beikeOwner: (form.beikeOwner || lead?.beikeOwner || '') as string,
      clueLevel: (form.clueLevel || lead?.clueLevel || 'B') as string,
      clueStatus: (form.clueStatus || lead?.clueStatus || '待跟进') as string,
      deptBelong: (form.deptBelong || lead?.deptBelong || '') as string,
      clientDept: (form.clientDept ?? lead?.clientDept ?? '') as string,
      clientContact: (form.clientContact ?? lead?.clientContact ?? '') as string,
      budget: (form.budget ?? lead?.budget ?? '') as string,
      requirementDesc: (form.requirementDesc ?? lead?.requirementDesc ?? '') as string,
      clueEvaluation: (form.clueEvaluation ?? lead?.clueEvaluation ?? '') as string,
      reviewStatus: (form.reviewStatus ?? lead?.reviewStatus ?? '') as string,
      businessConfirmed: (form.businessConfirmed ?? lead?.businessConfirmed ?? '') as string,
      contactDate: form.contactDate ? String(form.contactDate) : (lead?.contactDate || ''),
      proposalDate: form.proposalDate ? String(form.proposalDate) : (lead?.proposalDate || ''),
      createDate: form.createDate ? String(form.createDate) : (lead?.createDate || ''),
      remark: (form.remark ?? lead?.remark ?? '') as string,
      commRecord1: (form.commRecord1 ?? lead?.commRecord1 ?? '') as string,
      commRecord2: (form.commRecord2 ?? lead?.commRecord2 ?? '') as string,
      commRecord3: (form.commRecord3 ?? lead?.commRecord3 ?? '') as string,
      commRecord4: (form.commRecord4 ?? lead?.commRecord4 ?? '') as string,
    };

    setSaving(true);
    try {
      if (isNew) {
        await createClue(dto);
        message.success('线索已创建');
        navigate('/ltc/leads');
      } else {
        await updateClue(lead!.id, dto);
        message.success('已保存');
        setLead(prev => ({ ...prev!, ...dto }));
        setEditMode(false);
      }
    } catch {
      // 全局拦截器已处理
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!lead) return;
    await deleteClue(lead.id);
    message.success('已移入回收站');
    navigate('/ltc/leads');
  };

  if (loading) return <Card><Spin style={{ display: 'block', margin: '60px auto' }} /></Card>;
  if (!lead && !isNew) return <Card><p>线索不存在</p></Card>;

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/ltc/leads')}>返回列表</Button>
        {!isNew && !editMode && <Button icon={<EditOutlined />} onClick={() => { setForm({}); setEditMode(true); }}>编辑</Button>}
        {(editMode || isNew) && <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>保存</Button>}
        {!isNew && <Button danger icon={<DeleteOutlined />} onClick={() => { Modal.confirm({ title: '确认删除', content: `确定删除线索「${lead?.clueName}」？数据将移入回收站。`, okText: '确认删除', cancelText: '取消', okButtonProps: { danger: true }, onOk: handleDelete }); }}>删除</Button>}
      </Space>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="基础信息" style={{ marginBottom: 16 }}>
            <Descriptions column={2} size="small" bordered>
              {BASE_FIELDS.map(f => <Descriptions.Item key={f.key} label={f.label} span={f.key === 'requirementDesc' ? 2 : 1}>{renderField(f)}</Descriptions.Item>)}
            </Descriptions>
          </Card>
          <Card title="业务详情">
            <Descriptions column={2} size="small" bordered>
              {BIZ_FIELDS.map(f => <Descriptions.Item key={f.key} label={f.label} span={f.key === 'remark' ? 2 : 1}>{renderField(f)}</Descriptions.Item>)}
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="沟通记录" style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small" bordered>
              {COMM_FIELDS.map(f => <Descriptions.Item key={f.key} label={f.label}>{renderField(f)}</Descriptions.Item>)}
            </Descriptions>
          </Card>
          <Card title="归属信息">
            <Descriptions column={1} size="small" bordered>
              {META_FIELDS.map(f => <Descriptions.Item key={f.key} label={f.label}>{renderField(f)}</Descriptions.Item>)}
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </div>
  );
}


