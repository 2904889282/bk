import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button, Typography, App, Modal, Input, Select, Form, Drawer, Timeline, Tag } from 'antd';
import {
  SearchOutlined, PlusOutlined, DownloadOutlined,
  EditOutlined, DeleteOutlined,
  CheckCircleFilled, CloseCircleFilled,
  RightOutlined, DownOutlined,
} from '@ant-design/icons';
import {
  fetchCluePage, createClue, updateClue, deleteClue,
  fetchClueDashboard, createClueFollow,
  type ClueVO, type FollowSaveDTO,
} from '../../../../api/clue';
import { isMockTokenError } from '../../../../utils/request';
import { useTheme } from '../../../../store/useTheme';
import CmdPalette, { useCmdActions } from '../../../../components/ui/CmdPalette';

const DM = (dark: boolean) => ({
  pageBg: dark ? '#0f1011' : '#F5F5F5',
  cardBg: dark ? '#1a1a1a' : '#fff',
  cardBorder: dark ? '#2a2a2a' : '#E5E7EB',
  text: dark ? '#f7f8f8' : '#111827',
  text2: dark ? '#d0d6e0' : '#374151',
  text3: dark ? '#8a8f98' : '#6B7280',
  text4: dark ? '#757880' : '#9CA3AF',
});

/* 模块级 dm，LeadsList 渲染时通过 getDm() 更新 */
let currentDm = DM(false);
const getDm = () => currentDm;

const { Text } = Typography;
const { TextArea } = Input;

/* ============ 紫色品牌色系 ============ */
const BRAND = {
  50: '#EEEDFE',
  100: '#CECBF6',
  500: '#7F77DD',
  600: '#534AB7',
  700: '#3C3489',
};

/* ============ 状态映射 — 短名→长名 ============ */
const ST_SHORT = ['接触', '沟通', '提案', '承接', '延期', '丢失'];
const ST_LONG: Record<string, string> = {
  '接触': '线索接触', '沟通': '沟通提案', '提案': '执行测试',
  '承接': '已承接', '延期': '已延期', '丢失': '已丢失',
};
/* ============ 状态色（设计规范） ============ */
const STYLE = {
  statusBg: {
    '接触': '#EFF6FF', '沟通': '#F5F3FF', '提案': '#FFF7ED',
    '承接': '#ECFDF5', '延期': '#F9FAFB', '丢失': '#FEF2F2',
  } as Record<string, string>,
  statusColor: {
    '接触': '#3B82F6', '沟通': '#8B5CF6', '提案': '#F59E0B',
    '承接': '#10B981', '延期': '#9CA3AF', '丢失': '#EF4444',
  } as Record<string, string>,
  statusBorder: {
    '接触': '#BFDBFE', '沟通': '#DDD6FE', '提案': '#FED7AA',
    '承接': '#A7F3D0', '延期': '#E5E7EB', '丢失': '#FECACA',
  } as Record<string, string>,
  grade: {
    A: { bg: '#DC2626', color: '#fff' },
    B: { bg: '#D97706', color: '#fff' },
    C: { bg: '#6B7280', color: '#fff' },
  } as Record<string, { bg: string; color: string }>,
  kpi: {
    total: { bg: '#EFF6FF', iconBg: '#DBEAFE', color: '#3B82F6', label: '线索总数' },
    active: { bg: '#ECFDF5', iconBg: '#D1FAE5', color: '#10B981', label: '活跃线索' },
    budget: { bg: '#FFF7ED', iconBg: '#FFEDD5', color: '#F59E0B', label: '预算总额' },
    lost: { bg: '#FEF2F2', iconBg: '#FEE2E2', color: '#EF4444', label: '已丢失' },
  },
};

/* ============ 工具 ============ */
const fmtMoney = (n?: number | string) => {
  const v = Number(n);
  if (!v || isNaN(v)) return '-';
  if (v >= 1e8) return `${(v / 1e8).toFixed(2)}亿`;
  if (v >= 10000) return `${(v / 10000).toFixed(0)}万`;
  return `¥${v.toLocaleString()}`;
};

const displayStatus = (s: string) => ST_LONG[s] || s;

/* ============ 子组件 ============ */
function StatusBadge({ status }: { status: string }) {
  const short = status.length <= 2 ? status : (Object.entries(ST_LONG).find(([, v]) => v === status)?.[0] || status);
  const label = displayStatus(short);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 10px', borderRadius: 999,
      fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
      background: STYLE.statusBg[short] || '#F9FAFB',
      color: STYLE.statusColor[short] || '#9CA3AF',
      border: `1px solid ${STYLE.statusBorder[short] || '#E5E7EB'}`,
    }}>
      {label}
    </span>
  );
}

function GradeBadge({ grade }: { grade: string }) {
  const s = STYLE.grade[grade] || { bg: '#9CA3AF', color: '#fff' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 20, height: 20, borderRadius: 4,
      fontSize: 10, fontWeight: 700,
      background: s.bg, color: s.color,
    }}>
      {grade}
    </span>
  );
}

function ReviewBadge({ status }: { status?: string }) {
  if (!status) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444' }} />
        <span style={{ color: '#EF4444' }}>未评审</span>
      </span>
    );
  }
  const done = status === '通过' || status === '已评审';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: done ? '#10B981' : '#EF4444' }} />
      <span style={{ color: done ? '#10B981' : '#EF4444' }}>{status}</span>
    </span>
  );
}

function ConfirmBadge({ status }: { status?: string }) {
  const done = status === '已确认';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: done ? '#3B82F6' : '#9CA3AF' }} />
      <span style={{ color: done ? '#3B82F6' : '#9CA3AF' }}>{status || '待确认'}</span>
    </span>
  );
}

function KpiCard({ type, value, sub }: { type: 'total' | 'active' | 'budget' | 'lost'; value: string; sub: string }) {
  const cfg = STYLE.kpi[type];
  return (
    <div style={{
      flex: 1, minWidth: 180,
      background: getDm().cardBg, borderRadius: 12,
      padding: '20px 24px',
      border: '1px solid #E5E7EB',
      display: 'flex', alignItems: 'flex-start', gap: 16,
      transition: 'box-shadow 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: cfg.iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, color: cfg.color, flexShrink: 0,
      }}>
        {type === 'total' ? '📊' : type === 'active' ? '🔥' : type === 'budget' ? '💰' : '⚠'}
      </div>
      <div>
        <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>{cfg.label}</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: getDm().text, lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{sub}</div>
      </div>
    </div>
  );
}

function BarChart({ label, count, total, fill, bg }: { label: string; count: number; total: number; fill: string; bg?: string }) {
  const pct = total > 0 ? Math.round(count / total * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <span style={{ width: 48, fontSize: 12, color: '#6B7280', textAlign: 'right', flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 28, background: bg || '#F3F4F6', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 6,
          width: `${Math.max(pct, 3)}%`,
          background: fill, display: 'flex', alignItems: 'center', paddingLeft: 10,
          transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
          minWidth: pct > 0 ? 48 : 0,
        }}>
          <span style={{ fontSize: 11, color: pct > 35 ? '#fff' : fill, fontWeight: 500, whiteSpace: 'nowrap' }}>
            {count} 条 · {pct}%
          </span>
        </div>
      </div>
    </div>
  );
}

/* ============ 线索详情抽屉 ============ */
function ClueDetailDrawer({ clueId, open, onClose }: { clueId: number | null; open: boolean; onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [followModal, setFollowModal] = useState(false);
  const [followForm] = Form.useForm();

  useEffect(() => {
    if (!clueId || !open) return;
    setLoading(true);
    fetchClueDashboard(clueId)
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [clueId, open]);

  const clue = data?.clue;
  const follows = data?.follows || [];

  const handleAddFollow = async () => {
    try {
      const v = await followForm.validateFields();
      await createClueFollow({
        clueId: clueId!,
        followType: v.followType,
        contactPerson: v.contactPerson,
        coreConclusion: v.coreConclusion,
        detailContent: v.detailContent,
        nextPlan: v.nextPlan,
        nextDeadline: v.nextDeadline,
        newStatus: v.newStatus,
      } as FollowSaveDTO);
      setFollowModal(false);
      followForm.resetFields();
      // 重新加载数据
      if (clueId) {
        fetchClueDashboard(clueId).then(d => setData(d)).catch(() => {});
      }
    } catch { /* ignore */ }
  };

  return (
    <Drawer
      title={null}
      placement="right"
      width={480}
      open={open}
      onClose={onClose}
      closable={false}
      styles={{ body: { padding: 0 } }}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#9CA3AF' }}>加载中...</div>
      ) : !clue ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#9CA3AF' }}>线索不存在</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* 顶部标题栏 */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px', borderBottom: '1px solid #F3F4F6',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 18, fontWeight: 600, color: getDm().text }}>{clue.clueName}</span>
                <StatusBadge status={clue.clueStatus} />
                {clue.clueLevel && <GradeBadge grade={clue.clueLevel} />}
              </div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                创建日期：{clue.contactDate || clue.createDate || '-'} · 承接人：{clue.beikeOwner || '-'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <Button size="small" icon={<EditOutlined />}>编辑</Button>
              <Button size="small" icon={<CloseCircleFilled />} type="text" onClick={onClose} style={{ color: '#9CA3AF' }} />
            </div>
          </div>

          {/* 内容区 */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            {/* 基本信息 */}
            <Section title="基本信息">
              <FieldRow label="客户公司" value={clue.clientCompany || '-'} />
              <FieldRow label="部门" value={clue.clientDept || '-'} />
              <FieldRow label="甲方对接人" value={clue.clientContact || '-'} />
              <FieldRow label="承接部门" value={clue.deptBelong || '-'} />
              <FieldRow label="预算量级" value={fmtMoney(clue.opportunityAmount ?? clue.budgetAmount)} />
              <FieldRow label="项目等级" value={clue.clueLevel ? <GradeBadge grade={clue.clueLevel} /> : '-'} />
              <FieldRow label="接触日期" value={clue.contactDate || '-'} />
              <FieldRow label="提案日期" value={clue.proposalDate || '-'} />
            </Section>

            {/* 评审与商机 */}
            <Section title="评审与商机状态">
              <div style={{ display: 'flex', gap: 32 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>评审状态</div>
                  <ReviewBadge status={clue.reviewStatus} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>确认商机</div>
                  <ConfirmBadge status={clue.businessConfirmed} />
                </div>
              </div>
            </Section>

            {/* 需求说明 */}
            <Section title="线索需求说明">
              <Text style={{ fontSize: 13, color: '#374151', lineHeight: 1.8 }}>
                {clue.requirementDesc || '暂无需求说明'}
              </Text>
            </Section>

            {/* 沟通记录 */}
            <Section title="沟通记录">
              {follows.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#9CA3AF', fontSize: 13 }}>
                  暂无沟通记录
                </div>
              ) : (
                <Timeline
                  items={[
                    ...follows.map((f: any) => ({
                      dot: <span style={{ width: 10, height: 10, borderRadius: '50%', background: BRAND[500], display: 'block', marginTop: 4 }} />,
                      children: (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 13, fontWeight: 500, color: getDm().text }}>
                              {f.follow_type || '跟进'}
                            </span>
                            <span style={{ fontSize: 11, color: '#9CA3AF' }}>
                              {f.followDate || f.follow_date || '-'}
                            </span>
                            <span style={{ fontSize: 11, color: '#9CA3AF' }}>{f.followUserName || f.follow_user_name || ''}</span>
                          </div>
                          {f.coreConclusion && (
                            <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.6 }}>
                              {f.coreConclusion}
                            </div>
                          )}
                          {f.detailContent && (
                            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2, lineHeight: 1.6 }}>
                              {f.detailContent}
                            </div>
                          )}
                          {f.nextPlan && (
                            <div style={{ fontSize: 11, color: BRAND[500], marginTop: 2 }}>
                              下一步：{f.nextPlan}
                            </div>
                          )}
                        </div>
                      ),
                    })),
                    {
                      dot: <span style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid #CECBF6', background: getDm().cardBg, display: 'block', marginTop: 4 }} />,
                      children: (
                        <div
                          onClick={() => setFollowModal(true)}
                          style={{
                            fontSize: 13, color: BRAND[500], cursor: 'pointer',
                            padding: '6px 0', fontWeight: 500,
                          }}
                        >
                          + 添加沟通记录
                        </div>
                      ),
                    },
                  ]}
                />
              )}
              {follows.length > 0 && (
                <div
                  onClick={() => setFollowModal(true)}
                  style={{
                    fontSize: 12, color: BRAND[500], cursor: 'pointer',
                    padding: '4px 0 4px 20px', fontWeight: 500,
                  }}
                >
                  + 添加沟通记录
                </div>
              )}
            </Section>

            {/* 线索评价 */}
            {clue.clueEvaluation && (
              <Section title="线索评价">
                <Text style={{ fontSize: 13, color: '#374151', lineHeight: 1.8 }}>
                  {clue.clueEvaluation}
                </Text>
              </Section>
            )}

            {/* 备注 */}
            {clue.remark && (
              <Section title="备注与所需配合">
                <Text style={{ fontSize: 13, color: '#374151', lineHeight: 1.8 }}>
                  {clue.remark}
                </Text>
              </Section>
            )}
          </div>

          {/* 底部操作栏 */}
          <div style={{
            borderTop: '1px solid #F3F4F6',
            padding: '12px 20px',
            display: 'flex', gap: 8,
            background: getDm().cardBg,
          }}>
            <Button size="small" style={{ borderColor: BRAND[100], color: BRAND[600] }}>更新状态</Button>
            <Button size="small" type="primary" onClick={() => setFollowModal(true)}
              style={{ background: BRAND[500], borderColor: BRAND[500] }}>
              添加沟通
            </Button>
            <Button size="small" icon={<EditOutlined />}>编辑线索</Button>
            <Button size="small" danger icon={<DeleteOutlined />} style={{ marginLeft: 'auto' }}>删除</Button>
          </div>

          {/* 添加沟通弹窗 */}
          <Modal title="添加沟通记录" open={followModal} onCancel={() => setFollowModal(false)}
            onOk={handleAddFollow} okText="保存" cancelText="取消" destroyOnHidden width={480}>
            <Form form={followForm} layout="vertical" style={{ marginTop: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
                <Form.Item name="followType" label="沟通类型" initialValue="电话">
                  <Select options={['电话', '拜访', '微信', '邮件', '会议'].map(v => ({ value: v, label: v }))} />
                </Form.Item>
                <Form.Item name="contactPerson" label="联系人">
                  <Input placeholder="跟进联系人" />
                </Form.Item>
              </div>
              <Form.Item name="coreConclusion" label="核心结论" rules={[{ required: true, message: '请输入' }]}>
                <TextArea rows={2} placeholder="如：客户确认预算范围..." />
              </Form.Item>
              <Form.Item name="detailContent" label="详细内容">
                <TextArea rows={2} placeholder="跟进详细记录..." />
              </Form.Item>
              <Form.Item name="nextPlan" label="下一步计划">
                <Input placeholder="如：下周提交方案初稿" />
              </Form.Item>
              <Form.Item name="nextDeadline" label="下次联系时间">
                <Input placeholder="YYYY-MM-DD" />
              </Form.Item>
              <Form.Item name="newStatus" label="更新线索状态">
                <Select allowClear placeholder="不改变"
                  options={ST_SHORT.map(s => ({ value: s, label: displayStatus(s) }))} />
              </Form.Item>
            </Form>
          </Modal>
        </div>
      )}
    </Drawer>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontSize: 11, fontWeight: 600, color: '#9CA3AF',
        textTransform: 'uppercase', letterSpacing: '0.5px',
        marginBottom: 10, paddingBottom: 8,
        borderBottom: '1px solid #F3F4F6',
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '6px 0' }}>
      <span style={{ width: 90, fontSize: 12, color: '#9CA3AF', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#374151' }}>{value}</span>
    </div>
  );
}

/* ============ 主页面组件 ============ */
export default function LeadsList() {
  const { message } = App.useApp();
  const { isDark } = useTheme();
  currentDm = DM(isDark);  // 更新模块级变量，子组件通过 getDm() 读取
  const [leads, setLeads] = useState<ClueVO[]>([]);
  const [total, setTotal] = useState(0);
  const [pg, setPg] = useState({ p: 1, s: 15 });

  /* 视图切换 */
  const [view, setView] = useState<'dashboard' | 'board' | 'list'>('list');

  /* 筛选 */
  const [kw, setKw] = useState('');
  const [sf, setSf] = useState<string | null>(null);

  /* 列表状态 */
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [exp, setExp] = useState<Set<number>>(new Set());
  const [sortF, setSortF] = useState<string | null>(null);
  const [sortD, setSortD] = useState<'asc' | 'desc'>('asc');

  /* 弹窗与抽屉 */
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [formLoading, setFormLoading] = useState(false);
  const [drawerId, setDrawerId] = useState<number | null>(null);
  const [cmd, setCmd] = useState(false);
  const cmdActs = useCmdActions({ new: () => openCreate() });

  /* 数据加载 */
  const load = useCallback(async (page = pg.p, size = pg.s) => {
    try {
      const params: any = { pageNum: page, pageSize: size };
      if (kw) params.keyword = kw;
      if (sf) params.status = sf;
      const res = await fetchCluePage(params);
      setLeads(res.records || []);
      setTotal(res.total || 0);
      setPg({ p: page, s: size });
    } catch (e) { if (!isMockTokenError(e)) message.error('加载失败'); }
  }, [kw, sf]);

  useEffect(() => { load(1); }, [sf, kw]);

  /* 排序 */
  const sorted = useMemo(() => {
    if (!sortF) return leads;
    const d = [...leads];
    d.sort((a: any, b: any) => {
      const va = a[sortF] ?? '', vb = b[sortF] ?? '';
      if (typeof va === 'number') return sortD === 'asc' ? va - vb : vb - va;
      return sortD === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
    return d;
  }, [leads, sortF, sortD]);

  /* CRUD */
  const openCreate = () => { form.resetFields(); setEditId(null); setFormOpen(true); };
  const openEdit = (clue: ClueVO) => {
    form.setFieldsValue({
      clueName: clue.clueName,
      clientCompany: clue.clientCompany,
      clientDept: clue.clientDept,
      clientContact: clue.clientContact,
      beikeOwner: clue.beikeOwner,
      clueLevel: clue.clueLevel,
      clueStatus: clue.clueStatus,
      deptBelong: clue.deptBelong,
      opportunityAmount: clue.opportunityAmount,
      contactDate: clue.contactDate,
      proposalDate: clue.proposalDate,
      requirementDesc: clue.requirementDesc,
      clueEvaluation: clue.clueEvaluation,
      remark: clue.remark,
    });
    setEditId(clue.id);
    setFormOpen(true);
  };

  const handleSave = async () => {
    try {
      const v = await form.validateFields();
      setFormLoading(true);
      if (editId) {
        await updateClue(editId, v);
        message.success('已更新');
      } else {
        await createClue(v);
        message.success('已创建');
      }
      setFormOpen(false);
      load(1);
    } catch (e: any) { if (!e?.errorFields) message.error('操作失败'); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '删除后可在回收站恢复，确定要删除这条线索吗？',
      okText: '确定删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try { await deleteClue(id); message.success('已删除'); load(1); }
        catch { message.error('删除失败'); }
      },
    });
  };

  /* 键盘 */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === '/' && !(e.target as HTMLElement)?.closest('input,textarea')) {
        e.preventDefault(); setCmd(true);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  /* 统计 */
  const stats = useMemo(() => {
    const m: Record<string, number> = {};
    leads.forEach(l => { m[l.clueStatus] = (m[l.clueStatus] || 0) + 1; });
    const active = leads.filter(l => l.clueStatus !== '丢失' && l.clueStatus !== '延期').length;
    const budget = leads.reduce((a, l) => a + Number(l.opportunityAmount ?? l.budgetAmount ?? 0), 0);
    const lost = (m['丢失'] || 0);
    return { total: leads.length, active, budget, lost, map: m };
  }, [leads]);

  /* 部门统计 */
  const deptStats = useMemo(() => {
    const m: Record<string, number> = {};
    leads.forEach(l => { const d = l.deptBelong || '未分配'; m[d] = (m[d] || 0) + 1; });
    return m;
  }, [leads]);

  /* 分页 */
  const tp = Math.ceil(total / pg.s);
  const pn = useMemo(() => {
    const a: number[] = [];
    let s = Math.max(1, pg.p - 2), e = Math.min(tp, s + 4);
    if (e - s < 4) s = Math.max(1, e - 4);
    for (let i = s; i <= e; i++) a.push(i);
    return a;
  }, [pg.p, tp]);

  const toggleExp = (id: number) => {
    setExp(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  /* ============ 渲染 ============ */
  return (
    <div style={{ minHeight: '100%', background: getDm().pageBg }}>
      <CmdPalette open={cmd} onClose={() => setCmd(false)} actions={cmdActs} />

      {/* ---- 数据看板 ---- */}
      {view === 'dashboard' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: getDm().text }}>数据看板</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button icon={<PlusOutlined />} onClick={openCreate}
                style={{ background: BRAND[500], borderColor: BRAND[500], color: '#fff', borderRadius: 8 }}>
                新增线索
              </Button>
            </div>
          </div>

          {/* KPI 卡片 */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <KpiCard type="total" value={`${stats.total}`} sub="条线索" />
            <KpiCard type="active" value={`${stats.active}`} sub={`进行中 · ${Math.round(stats.active / Math.max(stats.total, 1) * 100)}%`} />
            <KpiCard type="budget" value={stats.budget >= 1e8 ? `${(stats.budget / 1e8).toFixed(2)}亿` : `${(stats.budget / 10000).toFixed(0)}万`}
              sub={`${leads.filter(l => l.opportunityAmount || l.budgetAmount).length}条已录入`} />
            <KpiCard type="lost" value={`${stats.lost}`} sub={`${Math.round(stats.lost / Math.max(stats.total, 1) * 100)}% 丢失率`} />
          </div>

          {/* 图表区 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            {/* 线索状态分布 */}
            <div style={{ background: getDm().cardBg, borderRadius: 12, border: `1px solid ${getDm().cardBorder}`, padding: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: getDm().text }}>
                线索状态分布
                <Tag style={{ margin: 0, borderRadius: 999, fontSize: 11 }}>{stats.total} 条</Tag>
              </div>
              {ST_SHORT.map(st => {
                const count = stats.map[st] || 0;
                return (
                  <BarChart key={st} label={displayStatus(st)} count={count} total={stats.total}
                    fill={STYLE.statusColor[st]} bg={STYLE.statusBg[st]} />
                );
              })}
            </div>

            {/* 部门线索分布 */}
            <div style={{ background: getDm().cardBg, borderRadius: 12, border: `1px solid ${getDm().cardBorder}`, padding: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                部门线索分布
                <Tag style={{ margin: 0, borderRadius: 999, fontSize: 11 }}>{Object.keys(deptStats).length} 个部门</Tag>
              </div>
              {Object.entries(deptStats).slice(0, 5).map(([d, c]) => (
                <BarChart key={d} label={d} count={c} total={stats.total}
                  fill={BRAND[500]} bg={`${BRAND[50]}`} />
              ))}
            </div>

            {/* 月度线索趋势（占位） */}
            <div style={{ background: getDm().cardBg, borderRadius: 12, border: `1px solid ${getDm().cardBorder}`, padding: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>月度线索趋势</div>
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#D1D5DB' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📈</div>
                <div style={{ fontSize: 13 }}>折线图 · 近12个月新增线索趋势</div>
              </div>
            </div>

            {/* 承接人业绩TOP10 */}
            <div style={{ background: getDm().cardBg, borderRadius: 12, border: `1px solid ${getDm().cardBorder}`, padding: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>承接人业绩 TOP10</div>
              {(() => {
                const m: Record<string, number> = {};
                leads.forEach(l => { if (l.beikeOwner) m[l.beikeOwner] = (m[l.beikeOwner] || 0) + 1; });
                const top = Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 8);
                const mx = top[0]?.[1] || 1;
                return top.length === 0
                  ? <div style={{ textAlign: 'center', padding: '40px 0', color: '#D1D5DB', fontSize: 13 }}>暂无数据</div>
                  : top.map(([o, c]) => (
                    <BarChart key={o} label={o} count={c} total={mx}
                      fill={BRAND[500]} bg={`${BRAND[50]}`} />
                  ));
              })()}
            </div>
          </div>

          {/* 最近更新 */}
          <div style={{ background: getDm().cardBg, borderRadius: 12, border: `1px solid ${getDm().cardBorder}`, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>最近更新的线索</span>
              <Button type="link" size="small" onClick={() => setView('list')} style={{ color: BRAND[500] }}>
                查看全部 →
              </Button>
            </div>
            {sorted.slice(0, 5).map(l => (
              <div key={l.id}
                onClick={() => setDrawerId(l.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 0', borderBottom: '1px solid #F9FAFB',
                  cursor: 'pointer', transition: 'background 0.12s',
                  borderRadius: 6,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = BRAND[50]; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <StatusBadge status={l.clueStatus} />
                <span style={{ fontWeight: 500, fontSize: 13, color: getDm().text }}>{l.clueName || '-'}</span>
                <span style={{ fontSize: 12, color: '#9CA3AF' }}>{l.clientCompany}</span>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: '#D1D5DB' }}>{l.updateTime || l.createTime || '-'}</span>
              </div>
            ))}
            {sorted.length === 0 && (
              <div style={{ textAlign: 'center', padding: 30, color: '#D1D5DB', fontSize: 13 }}>
                暂无线索数据
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---- 线索看板 ---- */}
      {view === 'board' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: getDm().text }}>线索看板</h2>
            <Button icon={<PlusOutlined />} onClick={openCreate}
              style={{ background: BRAND[500], borderColor: BRAND[500], color: '#fff', borderRadius: 8 }}>
              新增线索
            </Button>
          </div>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 20 }}>
            拖拽卡片可改变线索状态 · 点击卡片查看详情
          </div>

          {/* 看板列 */}
          <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 24, minHeight: 'calc(100vh - 240px)' }}>
            {ST_SHORT.map(status => {
              const items = leads.filter(l => l.clueStatus === status);
              return (
                <div key={status} style={{ minWidth: 280, maxWidth: 280, flexShrink: 0 }}>
                  {/* 列头 */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '0 4px 12px',
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: STYLE.statusColor[status] }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{displayStatus(status)}</span>
                    <span style={{
                      marginLeft: 'auto', fontSize: 12, fontWeight: 600,
                      color: BRAND[500], background: BRAND[50],
                      padding: '1px 8px', borderRadius: 999,
                    }}>
                      {items.length}
                    </span>
                  </div>

                  {/* 卡片列表 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {items.map(l => {
                      const amt = Number(l.opportunityAmount ?? l.budgetAmount);
                      const isLost = status === '丢失' || status === '延期';
                      return (
                        <div key={l.id}
                          draggable
                          onClick={() => setDrawerId(l.id)}
                          onDragStart={e => {
                            e.dataTransfer.setData('text/plain', String(l.id));
                            (e.currentTarget as HTMLElement).style.opacity = '0.5';
                          }}
                          onDragEnd={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                          style={{
                            background: getDm().cardBg, border: `1px solid ${getDm().cardBorder}`,
                            borderRadius: 8, padding: 14, cursor: 'pointer',
                            transition: 'all 0.15s', opacity: isLost ? 0.65 : 1,
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.borderColor = BRAND[500];
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(127,119,221,0.1)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.borderColor = '#E5E7EB';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          {/* 线索名称 */}
                          <div style={{
                            fontSize: 13, fontWeight: 600, color: getDm().text,
                            marginBottom: 6, textDecoration: isLost ? 'line-through' : 'none',
                            display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                          }}>
                            {l.clueName || l.clientCompany}
                          </div>

                          {/* 公司 · 承接人 */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 11, color: '#9CA3AF' }}>
                            <span>{l.clientCompany || '-'}</span>
                            <span>·</span>
                            <span>{l.beikeOwner || '-'}</span>
                          </div>

                          {/* 底栏 */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {l.clueLevel && <GradeBadge grade={l.clueLevel} />}
                            {amt > 0 && (
                              <span style={{ fontSize: 11, color: '#374151', fontWeight: 500 }}>
                                {fmtMoney(amt)}
                              </span>
                            )}
                            {l.reviewStatus && (
                              <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 3, fontSize: 10 }}>
                                <CheckCircleFilled style={{ color: l.reviewStatus === '通过' ? '#10B981' : '#D1D5DB', fontSize: 11 }} />
                                <span style={{ color: l.reviewStatus === '通过' ? '#10B981' : '#9CA3AF' }}>
                                  {l.reviewStatus === '通过' ? '已评审' : l.reviewStatus}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {items.length === 0 && (
                      <div style={{
                        textAlign: 'center', padding: '20px 12px', fontSize: 12,
                        color: '#D1D5DB', border: '1px dashed #E5E7EB',
                        borderRadius: 8,
                      }}>
                        暂无线索
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---- 线索列表 ---- */}
      {view === 'list' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: getDm().text }}>线索列表</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button icon={<DownloadOutlined />} style={{ borderRadius: 8 }}>导出</Button>
              <Button icon={<PlusOutlined />} onClick={openCreate}
                style={{ background: BRAND[500], borderColor: BRAND[500], color: '#fff', borderRadius: 8 }}>
                新增线索
              </Button>
            </div>
          </div>

          {/* 视图切换 */}
          <ViewSwitch view={view} onChange={setView} counts={{ total: stats.total }} />

          {/* 状态筛选标签 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {[{ k: null, l: '全部' }, ...ST_SHORT.map(s => ({ k: s, l: displayStatus(s) }))].map(t => {
              const active = t.k === null ? !sf : sf === t.k;
              return (
                <button key={t.k ?? 'all'} onClick={() => setSf(t.k)}
                  style={{
                    padding: '6px 16px', borderRadius: 999, border: 'none',
                    fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                    fontWeight: active ? 500 : 400,
                    background: active ? BRAND[500] : BRAND[50],
                    color: active ? '#fff' : BRAND[600],
                    transition: 'all 0.15s',
                  }}
                >
                  {t.l}
                </button>
              );
            })}
          </div>

          {/* 批量操作栏 */}
          {sel.size > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: BRAND[50], border: `1px solid ${BRAND[100]}`,
              borderRadius: 8, padding: '8px 16px', marginBottom: 12,
            }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: BRAND[600] }}>已选 {sel.size} 项</span>
              <Button size="small" onClick={() => setSel(new Set())} style={{ marginLeft: 'auto' }}>取消选择</Button>
              <Button size="small" danger>批量删除</Button>
            </div>
          )}

          {/* 搜索+筛选 — 完整筛选栏 */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap',
            padding: '12px 16px', background: getDm().cardBg, borderRadius: 8, border: `1px solid ${getDm().cardBorder}`,
            overflowX: 'auto',
          }}>
            <Input prefix={<SearchOutlined style={{ color: '#9CA3AF' }} />}
              placeholder="搜索线索名称、客户公司..."
              value={kw} onChange={e => setKw(e.target.value)}
              allowClear style={{ width: 240 }} />
            <Select placeholder="状态" allowClear style={{ width: 110 }}
              value={sf} onChange={v => setSf(v)}
              options={ST_SHORT.map(s => ({ value: s, label: displayStatus(s) }))} />
            <Select placeholder="承接部门" allowClear style={{ width: 110 }}
              options={['平台一部', '平台二部', '平台三部', '中台'].map(v => ({ value: v, label: v }))} />
            <Select placeholder="等级" allowClear style={{ width: 80 }}
              options={['A', 'B', 'C'].map(v => ({ value: v, label: v + '级' }))} />
            <span style={{ flex: 1, minWidth: 8 }} />
            <Button icon={<DownloadOutlined />} style={{ borderRadius: 6 }}>导出</Button>
            <Button onClick={() => { setKw(''); setSf(null); load(1); }} style={{ borderRadius: 6 }}>重置</Button>
          </div>

          {/* 表格 */}
          <div style={{ background: getDm().cardBg, borderRadius: 8, border: `1px solid ${getDm().cardBorder}`, overflowX: 'auto' }}>
            {/* 表头 — 13列：☑ ▸ 线索名称 客户公司 部门 对接人 承接人 预算 等级 状态 评审 商机 日期 操作 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '34px 24px minmax(120px,1.2fr) 80px 60px 56px 56px 72px 36px 72px 52px 52px 72px 52px',
              alignItems: 'center', padding: '10px 12px', minWidth: 1000,
              borderBottom: '1px solid #F3F4F6',
              fontSize: 11, fontWeight: 500, color: '#9CA3AF',
            }}>
              <span style={{ textAlign: 'center' }}>
                <input type="checkbox" checked={sel.size > 0 && sorted.every(l => sel.has(l.id))}
                  onChange={() => { sorted.every(l => sel.has(l.id)) ? setSel(new Set()) : setSel(new Set(sorted.map(l => l.id))); }}
                  style={{ width: 14, height: 14, accentColor: BRAND[500] }} />
              </span>
              <span></span>
              <span onClick={() => { setSortF(sortF === 'clueName' ? null : 'clueName'); setSortD('asc'); }}
                style={{ cursor: 'pointer', userSelect: 'none' }}>
                线索名称
              </span>
              <span>客户公司</span>
              <span>部门</span>
              <span>对接人</span>
              <span>承接人</span>
              <span onClick={() => { setSortF(sortF === 'opportunityAmount' ? null : 'opportunityAmount'); setSortD('asc'); }}
                style={{ cursor: 'pointer', userSelect: 'none' }}>
                预算
              </span>
              <span>等级</span>
              <span>状态</span>
              <span>评审</span>
              <span>商机</span>
              <span style={{ textAlign: 'center' }}>日期</span>
              <span style={{ textAlign: 'center' }}>操作</span>
            </div>

            {/* 表体 */}
            {sorted.map((l, idx) => {
              const isS = sel.has(l.id);
              const isE = exp.has(l.id);
              const isLost = l.clueStatus === '丢失';
              return (
                <div key={l.id}>
                  {/* 行 — 14列 */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '34px 24px minmax(120px,1.2fr) 80px 60px 56px 56px 72px 36px 72px 52px 52px 72px 52px',
                    alignItems: 'center', padding: '10px 12px', minWidth: 1000,
                    borderBottom: isE ? 'none' : '1px solid #F9FAFB',
                    cursor: 'pointer', fontSize: 12,
                    background: isS ? BRAND[50] : idx % 2 === 1 ? '#FAFAFA' : '#fff',
                    opacity: isLost ? 0.5 : 1,
                    transition: 'background 0.08s',
                  }}
                    onMouseEnter={e => { if (!isE && !isS) e.currentTarget.style.background = BRAND[50]; }}
                    onMouseLeave={e => { if (!isE && !isS) e.currentTarget.style.background = isS ? BRAND[50] : idx % 2 === 1 ? '#FAFAFA' : '#fff'; }}
                  >
                    <span style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={isS}
                        onChange={() => {
                          const n = new Set(sel);
                          isS ? n.delete(l.id) : n.add(l.id);
                          setSel(n);
                        }}
                        style={{ width: 14, height: 14, accentColor: BRAND[500] }} />
                    </span>
                    <span onClick={e => { e.stopPropagation(); toggleExp(l.id); }}
                      style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 10 }}>
                      {isE ? <DownOutlined /> : <RightOutlined />}
                    </span>
                    <span style={{
                      fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      textDecoration: isLost ? 'line-through' : 'none', color: isLost ? '#9CA3AF' : '#111827',
                    }}
                      onClick={() => setDrawerId(l.id)}>
                      {l.clueName || '-'}
                    </span>
                    <span style={{ fontSize: 11, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.clientCompany || '-'}</span>
                    <span style={{ fontSize: 11, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.clientDept || '-'}</span>
                    <span style={{ fontSize: 11, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.clientContact || '-'}</span>
                    <span style={{ fontSize: 11, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.beikeOwner || '-'}</span>
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{fmtMoney(l.opportunityAmount ?? l.budgetAmount)}</span>
                    <span>{l.clueLevel ? <GradeBadge grade={l.clueLevel} /> : '-'}</span>
                    <span><StatusBadge status={l.clueStatus} /></span>
                    <span><ReviewBadge status={l.reviewStatus} /></span>
                    <span><ConfirmBadge status={l.businessConfirmed} /></span>
                    <span style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center' }}>{l.contactDate?.slice(0, 10) || l.updateTime?.slice(0, 10) || '-'}</span>
                    <span style={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                      <Button size="small" type="text" icon={<EditOutlined />}
                        onClick={e => { e.stopPropagation(); openEdit(l); }}
                        style={{ color: '#9CA3AF', padding: '1px 3px', height: 22, fontSize: 11 }} />
                      <Button size="small" type="text" danger icon={<DeleteOutlined />}
                        onClick={e => { e.stopPropagation(); handleDelete(l.id); }}
                        style={{ padding: '1px 3px', height: 22, fontSize: 11 }} />
                    </span>
                  </div>

                  {/* 展开行 */}
                  {isE && (
                    <div style={{
                      padding: '12px 16px 14px 80px',
                      background: '#F9FAFB',
                      borderBottom: '1px solid #F3F4F6',
                      cursor: 'default',
                    }}>
                      {/* 需求摘要 */}
                      <div style={{ marginBottom: 10 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF' }}>需求摘要：</span>
                        <span style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {l.requirementDesc || '暂无'}
                        </span>
                      </div>
                      {/* 评价 */}
                      {l.clueEvaluation && (
                        <div style={{ marginBottom: 10 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF' }}>评价：</span>
                          <span style={{ fontSize: 12, color: '#6B7280' }}>
                            {l.clueEvaluation.slice(0, 60)}{l.clueEvaluation.length > 60 ? '...' : ''}
                          </span>
                        </div>
                      )}
                      {/* 快捷操作 */}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button size="small" style={{ borderColor: BRAND[100], color: BRAND[600], borderRadius: 6 }}>
                          更新状态
                        </Button>
                        <Button size="small" type="primary"
                          style={{ background: BRAND[500], borderColor: BRAND[500], borderRadius: 6 }}
                          onClick={() => setDrawerId(l.id)}>
                          添加沟通
                        </Button>
                        <Button size="small" onClick={() => openEdit(l)}
                          style={{ borderRadius: 6 }}>
                          编辑
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* 空状态 */}
            {sorted.length === 0 && (
              <div style={{ textAlign: 'center', padding: 60, color: '#D1D5DB' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                <div style={{ fontSize: 14, marginBottom: 4 }}>暂无匹配的线索</div>
                <div style={{ fontSize: 12 }}>试试调整筛选条件，或者创建第一条线索</div>
                <Button type="primary" style={{ marginTop: 16, background: BRAND[500], borderColor: BRAND[500], borderRadius: 8 }}
                  onClick={openCreate}>
                  创建第一条线索
                </Button>
              </div>
            )}

            {/* 分页 */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', borderTop: '1px solid #F3F4F6',
              fontSize: 12, color: '#9CA3AF',
            }}>
              <span>共 {total} 条 · 第 {pg.p}/{tp || 1} 页</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <PgBtn disabled={pg.p <= 1} onClick={() => { load(1); }}>‹‹</PgBtn>
                {pn[0] > 1 && <PgBtn disabled onClick={() => {}}>...</PgBtn>}
                {pn.map(n => (
                  <PgBtn key={n} active={n === pg.p} onClick={() => { load(n); }}>{n}</PgBtn>
                ))}
                {pn[pn.length - 1] < tp && <PgBtn disabled onClick={() => {}}>...</PgBtn>}
                <PgBtn disabled={pg.p >= tp} onClick={() => { load(tp); }}>››</PgBtn>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== 新增/编辑弹窗 ===== */}
      <Modal
        title={editId ? '编辑线索' : '新增线索'}
        open={formOpen}
        onCancel={() => setFormOpen(false)}
        onOk={handleSave}
        confirmLoading={formLoading}
        okText="保存"
        cancelText="取消"
        destroyOnHidden
        width={560}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            <Form.Item name="clueName" label="线索名称" rules={[{ required: true, message: '请输入线索名称' }]}>
              <Input placeholder="如 美团-AI视频" />
            </Form.Item>
            <Form.Item name="clientCompany" label="甲方公司" rules={[{ required: true, message: '请输入甲方公司' }]}>
              <Input placeholder="如 美团、阿里" />
            </Form.Item>
            <Form.Item name="clientDept" label="甲方部门">
              <Input placeholder="客户部门" />
            </Form.Item>
            <Form.Item name="clientContact" label="甲方对接人">
              <Input placeholder="客户方联系人" />
            </Form.Item>
            <Form.Item name="beikeOwner" label="承接人" rules={[{ required: true, message: '请输入承接人' }]}>
              <Input placeholder="内部负责人" />
            </Form.Item>
            <Form.Item name="clueStatus" label="线索状态">
              <Select options={ST_SHORT.map(s => ({ value: s, label: displayStatus(s) }))} placeholder="选择状态" />
            </Form.Item>
            <Form.Item name="clueLevel" label="项目等级">
              <Select options={['A', 'B', 'C'].map(v => ({ value: v, label: v + '级' }))} placeholder="选择等级" />
            </Form.Item>
            <Form.Item name="deptBelong" label="承接部门">
              <Select options={['平台一部', '平台二部', '平台三部', '中台'].map(v => ({ value: v, label: v }))} placeholder="选择部门" />
            </Form.Item>
            <Form.Item name="contactDate" label="接触日期">
              <Input placeholder="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item name="proposalDate" label="提案日期">
              <Input placeholder="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item name="opportunityAmount" label="预算金额">
              <Input type="number" placeholder="预算金额（元）" />
            </Form.Item>
          </div>
          <Form.Item name="requirementDesc" label="需求说明">
            <TextArea rows={3} placeholder="描述客户需求..." />
          </Form.Item>
          <Form.Item name="clueEvaluation" label="线索评价">
            <TextArea rows={2} placeholder="线索价值评估..." />
          </Form.Item>
          <Form.Item name="remark" label="备注与所需配合">
            <TextArea rows={2} placeholder="备注和支持需求..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* ===== 线索详情抽屉 ===== */}
      <ClueDetailDrawer clueId={drawerId} open={drawerId !== null} onClose={() => setDrawerId(null)} />
    </div>
  );
}

/* ============ 视图切换按钮组 ============ */
function ViewSwitch({ view, onChange, counts }: {
  view: string;
  onChange: (v: 'dashboard' | 'board' | 'list') => void;
  counts: { total: number };
}) {
  return (
    <div style={{
      display: 'inline-flex', background: BRAND[50], borderRadius: 8, padding: 3,
      marginBottom: 16,
    }}>
      {[
        { k: 'dashboard', l: '📊 数据看板' },
        { k: 'board', l: '▦ 线索看板' },
        { k: 'list', l: `☰ 线索列表 (${counts.total})` },
      ].map(item => (
        <button key={item.k}
          onClick={() => onChange(item.k as any)}
          style={{
            padding: '6px 14px', borderRadius: 6, border: 'none',
            fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
            fontWeight: view === item.k ? 500 : 400,
            background: view === item.k ? '#fff' : 'transparent',
            color: view === item.k ? '#111827' : '#6B7280',
            boxShadow: view === item.k ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.15s',
          }}
        >
          {item.l}
        </button>
      ))}
    </div>
  );
}

/* ============ 分页按钮 ============ */
function PgBtn({ children, active, disabled, onClick }: {
  children: React.ReactNode; active?: boolean; disabled?: boolean; onClick: () => void;
}) {
  return (
    <button onClick={disabled ? undefined : onClick} style={{
      padding: '5px 11px', borderRadius: 6,
      border: '1px solid #E5E7EB', background: active ? BRAND[50] : '#fff',
      color: active ? BRAND[600] : disabled ? '#D1D5DB' : '#6B7280',
      fontSize: 12, fontFamily: 'inherit', cursor: disabled ? 'default' : 'pointer',
      fontWeight: active ? 600 : 400,
      transition: 'all 0.12s',
    }}>
      {children}
    </button>
  );
}
