import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Tag, Space, Tabs, Input, Select, DatePicker, message, Modal, Spin, Tooltip } from 'antd';
import {
  ArrowLeftOutlined, EditOutlined, SaveOutlined, CloseOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { fetchClueDetail, updateClue, convertClueToProject, deleteClue, type ClueVO, type ClueSaveDTO } from '../../../../api/clue';
import { useAuth } from '../../../../hooks/useAuth';
import Permission from '../../../../components/auth/Permission';
import FollowUpTab from './FollowUpTab';
import TriangleTab from './TriangleTab';
import FilesTab from './FilesTab';
import dayjs from 'dayjs';

/** 线索状态 → 标签颜色 */
const CLUE_STATUS_COLORS: Record<string, string> = {
  '线索接触': 'blue',
  '沟通提案': 'purple',
  '执行测试': 'orange',
  '已承接': 'green',
  '已丢失': 'default',
  '已延期': 'red',
  '已转项目': 'geekblue',
};

const CLUE_LEVEL_COLORS: Record<string, string> = {
  S: 'red', A: 'orange', B: 'blue', C: 'default',
};

type Tab = 'info' | 'followup' | 'triangle' | 'files';

export default function LeadsDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const [clue, setClue] = useState<ClueVO | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Partial<ClueSaveDTO>>({});
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [convertOpen, setConvertOpen] = useState(false);
  const [convertLoading, setConvertLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [convertForm, setConvertForm] = useState({
    projectName: '', projectManager: '', projectAmount: '',
  });

  /** 加载线索详情 */
  const loadDetail = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await fetchClueDetail(Number(id));
      setClue(data);
    } catch {
      setClue(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadDetail(); }, [loadDetail]);

  // 终态锁定判断
  const isTerminalLocked = clue?.isConverted ?? false;

  // ============ 加载态 / 空态 ============
  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin size="large" />
          <p style={{ marginTop: 16, color: '#999' }}>加载中…</p>
        </div>
      </Card>
    );
  }
  if (!clue) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 60 }}>
          <ExclamationCircleOutlined style={{ fontSize: 48, color: '#999' }} />
          <p style={{ marginTop: 16 }}>线索不存在或已删除</p>
          <Button onClick={() => navigate('/ltc/leads')}>返回线索列表</Button>
        </div>
      </Card>
    );
  }

  // ============ 操作处理 ============

  /** 进入编辑模式 */
  const enterEditMode = () => {
    setEditForm({
      clueName: clue.clueName,
      clientCompany: clue.clientCompany,
      clientDept: clue.clientDept,
      clientContact: clue.clientContact,
      beikeOwner: clue.beikeOwner,
      budget: clue.budget,
      clueLevel: clue.clueLevel,
      reviewStatus: clue.reviewStatus,
      businessConfirmed: clue.businessConfirmed,
      contactDate: clue.contactDate,
      proposalDate: clue.proposalDate,
      requirementDesc: clue.requirementDesc,
      clueEvaluation: clue.clueEvaluation,
      remark: clue.remark,
      deptBelong: clue.deptBelong,
    });
    setEditMode(true);
  };

  /** 保存编辑 */
  const handleSave = async () => {
    if (!id) return;
    try {
      const data: ClueSaveDTO = {
        clueName: editForm.clueName ?? clue.clueName,
        clientCompany: editForm.clientCompany ?? clue.clientCompany,
        clientDept: editForm.clientDept ?? clue.clientDept,
        clientContact: editForm.clientContact ?? clue.clientContact,
        beikeOwner: editForm.beikeOwner ?? clue.beikeOwner,
        budget: editForm.budget ?? clue.budget,
        clueLevel: editForm.clueLevel ?? clue.clueLevel,
        clueStatus: clue.clueStatus, // 状态不允许通过编辑修改，必须通过跟进触发
        reviewStatus: editForm.reviewStatus ?? clue.reviewStatus,
        businessConfirmed: editForm.businessConfirmed ?? clue.businessConfirmed,
        contactDate: editForm.contactDate ?? clue.contactDate,
        proposalDate: editForm.proposalDate ?? clue.proposalDate,
        requirementDesc: editForm.requirementDesc ?? clue.requirementDesc,
        clueEvaluation: editForm.clueEvaluation ?? clue.clueEvaluation,
        remark: editForm.remark ?? clue.remark,
        deptBelong: editForm.deptBelong ?? clue.deptBelong,
      };
      await updateClue(Number(id), data);
      message.success('线索已更新');
      setEditMode(false);
      await loadDetail();
    } catch { /* 错误由请求拦截器处理 */ }
  };

  /** 一键转项目 */
  const handleConvert = async () => {
    if (!id) return;
    try {
      setConvertLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await convertClueToProject(Number(id), {
        projectName: convertForm.projectName || clue.clueName,
        projectManager: convertForm.projectManager || clue.beikeOwner,
        projectAmount: convertForm.projectAmount ? Number(convertForm.projectAmount) : 0,
      }) as any;
      const projectId: number = result?.projectId;
      message.success('线索已转为项目，正在跳转…');
      setConvertOpen(false);
      navigate(`/project/${projectId}`);
    } catch { /* 错误由请求拦截器处理 */ }
    finally { setConvertLoading(false); }
  };

  /** 删除线索 */
  const handleDelete = async () => {
    if (!id) return;
    try {
      setDeleteLoading(true);
      await deleteClue(Number(id));
      message.success('线索已删除');
      setDeleteOpen(false);
      navigate('/ltc/leads');
    } catch { /* 错误由请求拦截器处理 */ }
    finally { setDeleteLoading(false); }
  };

  // ============ 编辑字段配置 ============
  interface EditFieldDef {
    key: string;
    label: string;
    type: 'text' | 'select' | 'date' | 'longtext';
    options?: string[];
  }
  const editFields: EditFieldDef[] = [
    { key: 'clueName', label: '线索名称', type: 'text' },
    { key: 'clientCompany', label: '甲方公司', type: 'text' },
    { key: 'clientDept', label: '甲方部门', type: 'text' },
    { key: 'clientContact', label: '甲方对接人', type: 'text' },
    { key: 'beikeOwner', label: '承接人', type: 'text' },
    { key: 'budget', label: '预算量级', type: 'select', options: ['＜10万', '10-50万', '50-100万', '100-500万', '＞500万'] },
    { key: 'clueLevel', label: '项目等级', type: 'select', options: ['S', 'A', 'B', 'C'] },
    { key: 'clueEvaluation', label: '线索评价', type: 'select', options: ['高价值', '中等价值', '低价值'] },
    { key: 'reviewStatus', label: '评审状态', type: 'select', options: ['未评审', '评审中', '已通过', '未通过'] },
    { key: 'businessConfirmed', label: '确认商机', type: 'select', options: ['是', '否', '待确认'] },
    { key: 'contactDate', label: '接触日期', type: 'date' },
    { key: 'proposalDate', label: '提案日期', type: 'date' },
    { key: 'deptBelong', label: '承接部门', type: 'text' },
    { key: 'requirementDesc', label: '需求说明', type: 'longtext' },
    { key: 'remark', label: '备注', type: 'longtext' },
  ];

  const renderEditField = (field: EditFieldDef) => {
    const v = ((editForm as Record<string, unknown>)[field.key] ?? '') as string;
    if (field.type === 'select' && field.options) {
      return (
        <Select value={v || undefined}
          onChange={val => setEditForm(p => ({ ...p, [field.key]: val }))}
          style={{ width: '100%' }}
          options={field.options.map(o => ({ value: o, label: o }))}
          placeholder={`请选择${field.label}`} allowClear />
      );
    }
    if (field.type === 'date') {
      return (
        <DatePicker value={v ? dayjs(v) : null}
          onChange={d => setEditForm(p => ({ ...p, [field.key]: d ? d.format('YYYY-MM-DD') : '' }))}
          style={{ width: '100%' }} />
      );
    }
    if (field.type === 'longtext') {
      return <Input.TextArea value={v} onChange={e => setEditForm(p => ({ ...p, [field.key]: e.target.value }))} rows={2} />;
    }
    return <Input value={v} onChange={e => setEditForm(p => ({ ...p, [field.key]: e.target.value }))} />;
  };

  // ============ 详情展示分组 ============
  const renderValue = (key: string) => {
    const v = (clue as Record<string, unknown>)[key];
    if (key === 'clueStatus') {
      return <Tag color={CLUE_STATUS_COLORS[String(v)] || 'default'}>{String(v ?? '-')}</Tag>;
    }
    if (key === 'clueLevel') {
      return <Tag color={CLUE_LEVEL_COLORS[String(v)] || 'default'}>{String(v ?? '-')}</Tag>;
    }
    if (v == null || v === '') return '-';
    return String(v);
  };

  const labelOf = (key: string): string => {
    const m: Record<string, string> = {
      clueName: '线索名称', clientCompany: '甲方公司', clientDept: '甲方部门',
      clientContact: '甲方对接人', beikeOwner: '承接人', budget: '预算量级',
      requirementDesc: '需求说明', clueEvaluation: '线索评价', clueLevel: '项目等级',
      deptBelong: '承接部门', businessConfirmed: '确认商机', contactDate: '接触日期',
      proposalDate: '提案日期', createDate: '创建日期', reviewStatus: '评审状态',
      remark: '备注',
    };
    return m[key] || key;
  };

  const infoGroups: { title: string; keys: string[] }[] = [
    { title: '甲方信息', keys: ['clueName', 'clientCompany', 'clientDept', 'clientContact'] },
    { title: '项目信息', keys: ['budget', 'requirementDesc', 'clueEvaluation', 'clueLevel'] },
    { title: '人员信息', keys: ['beikeOwner', 'deptBelong', 'businessConfirmed'] },
    { title: '时间信息', keys: ['contactDate', 'proposalDate', 'createDate'] },
    { title: '评审信息', keys: ['reviewStatus', 'remark'] },
  ];

  const isLongtext = (key: string) => ['requirementDesc', 'remark'].includes(key);

  const infoContent = (
    <div>
      {infoGroups.map(g => (
        <Card title={g.title} size="small" style={{ marginBottom: 16 }} key={g.title}>
          <Descriptions column={{ xs: 1, sm: 2 }} size="small" bordered>
            {g.keys.map(key => {
              const ef = editFields.find(f => f.key === key);
              if (editMode && ef) {
                return (
                  <Descriptions.Item key={key} label={ef.label} span={isLongtext(key) ? 2 : 1}>
                    {renderEditField(ef)}
                  </Descriptions.Item>
                );
              }
              return (
                <Descriptions.Item key={key} label={labelOf(key)} span={isLongtext(key) ? 2 : 1}>
                  {renderValue(key)}
                </Descriptions.Item>
              );
            })}
          </Descriptions>
        </Card>
      ))}
      {/* 沟通记录 */}
      <Card title="沟通记录" size="small" style={{ marginBottom: 16 }}>
        <Descriptions column={1} size="small" bordered>
          {['commRecord1', 'commRecord2', 'commRecord3', 'commRecord4'].map((key, i) => (
            <Descriptions.Item key={key} label={`第${['一', '二', '三', '四'][i]}次沟通`}>
              {(clue as Record<string, unknown>)[key] ? String((clue as Record<string, unknown>)[key]) : '-'}
            </Descriptions.Item>
          ))}
        </Descriptions>
      </Card>
      {/* 关联信息 */}
      <Card title="关联信息" size="small" style={{ marginBottom: 16 }}>
        <Descriptions column={1} size="small" bordered>
          {['relation1', 'relation2', 'relation3'].map((key, i) => (
            <Descriptions.Item key={key} label={i === 0 ? '关联' : `关联${i}`}>
              {(clue as Record<string, unknown>)[key] ? String((clue as Record<string, unknown>)[key]) : '-'}
            </Descriptions.Item>
          ))}
        </Descriptions>
      </Card>
    </div>
  );

  // ============ Tab 项 ============
  const tabItems = [
    { key: 'info', label: '📋 基础信息', children: infoContent },
    {
      key: 'followup', label: '💬 跟进进度',
      children: (
        <FollowUpTab
          clueId={Number(id!)}
          isTerminalLocked={isTerminalLocked}
          onFollowCreated={loadDetail}
        />
      ),
    },
    {
      key: 'triangle', label: '🔺 铁三角',
      children: <TriangleTab clueData={clue} />,
    },
    {
      key: 'files', label: '📎 资料附件',
      children: <FilesTab bizType="clue" bizId={Number(id!)} />,
    },
  ];

  // ============ 渲染 ============
  return (
    <div style={{ maxWidth: 1100 }}>
      {/* 顶部固定信息栏 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <Space align="center" style={{ marginBottom: 8 }}>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/ltc/leads')} size="small">返回</Button>
              <span style={{ fontSize: 18, fontWeight: 700 }}>{clue.clueName}</span>
              <Tag>{clue.clientCompany}</Tag>
              {clue.clueLevel && <Tag color={CLUE_LEVEL_COLORS[clue.clueLevel] || 'blue'}>{clue.clueLevel}</Tag>}
            </Space>
            <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
              <span>预算: {clue.budget || '-'}</span>
              <span>
                状态:
                <Tag color={CLUE_STATUS_COLORS[clue.clueStatus] || 'default'} style={{ marginLeft: 4 }}>
                  {clue.clueStatus}
                </Tag>
              </span>
              <span>承接部门: {clue.deptBelong || '-'}</span>
              <span>创建: {clue.createDate || '-'}</span>
            </div>
          </div>
          <Space wrap>
            {/* 终态锁定 — 全部置灰 */}
            {isTerminalLocked ? (
              <>
                <Tooltip title="已转项目的线索不可修改">
                  <span><Button icon={<EditOutlined />} disabled>编辑</Button></span>
                </Tooltip>
                <Tooltip title="已转项目的线索不可修改">
                  <span><Button disabled>+ 新增跟进</Button></span>
                </Tooltip>
              </>
            ) : (
              <>
                {hasPermission('clue:edit') && (
                  editMode ? (
                    <>
                      <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>保存</Button>
                      <Button icon={<CloseOutlined />} onClick={() => setEditMode(false)}>取消</Button>
                    </>
                  ) : (
                    <Button icon={<EditOutlined />} onClick={enterEditMode}>编辑</Button>
                  )
                )}
                {!editMode && hasPermission('clue:edit') && (
                  <Button onClick={() => setActiveTab('followup')}>+ 新增跟进</Button>
                )}
                {clue.clueStatus === '已承接' && (
                  <Permission code="clue:convert">
                    <Button type="primary" onClick={() => {
                      setConvertForm({
                        projectName: clue.clueName,
                        projectManager: clue.beikeOwner,
                        projectAmount: clue.budget || '',
                      });
                      setConvertOpen(true);
                    }}>
                      🔄 转为项目
                    </Button>
                  </Permission>
                )}
              </>
            )}
            {!editMode && (
              <Permission code="clue:delete">
                <Button danger onClick={() => setDeleteOpen(true)}>删除</Button>
              </Permission>
            )}
          </Space>
        </div>
      </Card>

      {/* Tabs */}
      <Card>
        <Tabs activeKey={activeTab} onChange={k => setActiveTab(k as Tab)} items={tabItems} />
      </Card>

      {/* 转项目弹窗 */}
      <Modal
        title="🔄 线索转为项目"
        open={convertOpen}
        onCancel={() => setConvertOpen(false)}
        onOk={handleConvert}
        destroyOnClose
        confirmLoading={convertLoading}
      >
        <p style={{ color: '#666', marginBottom: 16 }}>此线索的基础信息将同步创建为新项目</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>项目名称</div>
            <Input value={convertForm.projectName} onChange={e => setConvertForm(p => ({ ...p, projectName: e.target.value }))} />
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>项目经理</div>
            <Input value={convertForm.projectManager} onChange={e => setConvertForm(p => ({ ...p, projectManager: e.target.value }))} />
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>金额（万）</div>
            <Input type="number" value={convertForm.projectAmount} onChange={e => setConvertForm(p => ({ ...p, projectAmount: e.target.value }))} />
          </div>
          <div style={{ color: '#999', fontSize: 12 }}>
            甲方公司「{clue.clientCompany}」及需求描述将自动同步
          </div>
        </div>
      </Modal>

      {/* 删除确认 */}
      <Modal
        title="确认删除"
        open={deleteOpen}
        onCancel={() => setDeleteOpen(false)}
        onOk={handleDelete}
        destroyOnClose
        confirmLoading={deleteLoading}
      >
        <p>确定要删除线索「{clue.clueName}」吗？</p>
        <p style={{ color: '#999', fontSize: 13 }}>此操作将逻辑删除，可在回收站恢复。</p>
      </Modal>
    </div>
  );
}
