import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, App, Modal, Form, Input, Select, Button } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { fetchCluePage, createClue, updateClue } from '../../../api/clue';
import type { ClueVO, ClueSaveDTO } from '../../../api/clue';
import { useNavigate } from 'react-router-dom';

const { TextArea } = Input;

const BRAND = {
  50: '#EEEDFE', 100: '#CECBF6', 500: '#7F77DD', 600: '#534AB7', 700: '#3C3489',
};

const ST_SHORT = ['接触', '沟通', '提案', '承接', '延期', '丢失'];
const ST_LONG: Record<string, string> = {
  '接触': '线索接触', '沟通': '沟通提案', '提案': '执行测试',
  '承接': '已承接', '延期': '已延期', '丢失': '已丢失',
};

const STYLE = {
  statusColor: {
    '接触': '#3B82F6', '沟通': '#8B5CF6', '提案': '#F59E0B',
    '承接': '#10B981', '延期': '#9CA3AF', '丢失': '#EF4444',
  } as Record<string, string>,
  grade: {
    S: { bg: '#DC2626', color: '#fff' },
    A: { bg: '#DC2626', color: '#fff' },
    B: { bg: '#D97706', color: '#fff' },
    C: { bg: '#6B7280', color: '#fff' },
  } as Record<string, { bg: string; color: string }>,
};

const fmtMoney = (n?: number | string) => {
  const v = Number(n);
  if (!v || isNaN(v)) return '-';
  if (v >= 10000) return `${(v / 10000).toFixed(0)}万`;
  return `¥${v.toLocaleString()}`;
};

export default function KanbanBoard() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<ClueVO[]>([]);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formPrefillStatus, setFormPrefillStatus] = useState('接触');
  const [form] = Form.useForm();

  const loadLeads = useCallback(async () => {
    try {
      const res = await fetchCluePage({ pageNum: 1, pageSize: 200 });
      setLeads(res.records || []);
    } catch { message.error('加载线索失败'); }
  }, []);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  const byStatus = useMemo(() => {
    const map: Record<string, ClueVO[]> = {};
    ST_SHORT.forEach(s => { map[s] = leads.filter(l => l.clueStatus === s); });
    return map;
  }, [leads]);

  /* 拖拽 */
  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedId(id);
    e.dataTransfer.setData('text/plain', String(id));
    (e.currentTarget as HTMLElement).style.opacity = '0.5';
  };
  const handleDragEnd = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.opacity = '1';
    setDraggedId(null); setDropTarget(null);
  };
  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault(); setDropTarget(status);
  };
  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault(); setDropTarget(null);
    if (!draggedId) return;
    const lead = leads.find(l => l.id === draggedId);
    if (!lead || lead.clueStatus === newStatus) return;
    const old = lead.clueStatus;
    lead.clueStatus = newStatus;
    setLeads([...leads]);
    try {
      await updateClue(draggedId, { clueStatus: newStatus } as any);
      message.success(`「${lead.clueName || lead.clientCompany}」${ST_LONG[old]} → ${ST_LONG[newStatus]}`);
    } catch { lead.clueStatus = old; setLeads([...leads]); message.error('状态更新失败'); }
  };

  /* 新增 */
  const openCreate = (prefillStatus: string) => {
    setFormPrefillStatus(prefillStatus);
    form.resetFields();
    form.setFieldsValue({ clueStatus: prefillStatus });
    setFormOpen(true);
  };
  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      await createClue({ ...values, clueStatus: values.clueStatus || formPrefillStatus } as ClueSaveDTO);
      message.success('线索已创建');
      setFormOpen(false); loadLeads();
    } catch (e: any) { if (!e?.errorFields) message.error('创建失败'); }
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#111827' }}>线索看板</h2>
          <Button icon={<PlusOutlined />} onClick={() => openCreate('接触')}
            style={{ background: BRAND[500], borderColor: BRAND[500], color: '#fff', borderRadius: 8 }}>
            新增线索
          </Button>
        </div>
        <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 12 }}>
          拖拽卡片可改变线索状态 · 点击卡片查看详情
        </div>

        {/* 看板顶部筛选栏 */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
          padding: '10px 16px', background: '#fff', borderRadius: 8, border: '1px solid #E5E7EB',
        }}>
          <Input prefix={<SearchOutlined style={{ color: '#9CA3AF' }} />}
            placeholder="搜索线索名称、客户公司..."
            allowClear style={{ width: 240 }} />
          <Select placeholder="承接部门" allowClear style={{ width: 110 }}
            options={['平台一部', '平台二部', '平台三部', '中台'].map(v => ({ value: v, label: v }))} />
          <Select placeholder="等级" allowClear style={{ width: 80 }}
            options={['A', 'B', 'C'].map(v => ({ value: v, label: v + '级' }))} />
          <Select placeholder="状态" allowClear style={{ width: 110 }}
            options={ST_SHORT.map(s => ({ value: s, label: ST_LONG[s] }))} />
        </div>
      </div>

      {/* 看板列 */}
      <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 24, minHeight: 'calc(100vh - 220px)' }}>
        {ST_SHORT.map(status => {
          const cards = byStatus[status] || [];
          const isTarget = dropTarget === status;
          return (
            <div key={status} style={{ minWidth: 280, maxWidth: 280, flexShrink: 0 }}
              onDragOver={(e) => handleDragOver(e, status)}
              onDragLeave={() => setDropTarget(null)}
              onDrop={(e) => handleDrop(e, status)}>
              {/* 列头 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px 12px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: STYLE.statusColor[status] }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{ST_LONG[status]}</span>
                <span style={{
                  marginLeft: 'auto', fontSize: 12, fontWeight: 600,
                  color: BRAND[600], background: BRAND[50],
                  padding: '1px 8px', borderRadius: 999,
                }}>{cards.length}</span>
              </div>

              {/* 卡片 */}
              {cards.map(lead => {
                const grd = STYLE.grade[lead.clueLevel] || { bg: '#9CA3AF', color: '#fff' };
                const amount = lead.opportunityAmount ?? lead.budgetAmount;
                const isLost = status === '丢失' || status === '延期';
                return (
                  <Card key={lead.id} size="small" hoverable draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => navigate(`/ltc/leads/${lead.id}`)}
                    style={{
                      cursor: 'grab', borderRadius: 8, marginBottom: 10,
                      border: '1px solid #E5E7EB',
                      opacity: isLost ? 0.65 : 1,
                      transition: 'all 0.15s',
                    }}
                    styles={{ body: { padding: '14px' } }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 6, textDecoration: isLost ? 'line-through' : 'none' }}>
                      {lead.clueName || lead.clientCompany}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 11, color: '#9CA3AF' }}>
                      <span>{lead.clientCompany || '-'}</span><span>·</span><span>{lead.beikeOwner || '-'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {lead.clueLevel && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: 4, fontSize: 10, fontWeight: 700, background: grd.bg, color: grd.color }}>
                          {lead.clueLevel}
                        </span>
                      )}
                      {amount && <span style={{ fontSize: 11, color: '#374151', fontWeight: 500 }}>{fmtMoney(amount)}</span>}
                      {lead.reviewStatus === '通过' && (
                        <span style={{ fontSize: 10, color: '#10B981', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981' }} />已评审
                        </span>
                      )}
                    </div>
                  </Card>
                );
              })}

              {/* 空状态 / 拖放目标 */}
              {cards.length === 0 && (
                <div style={{
                  textAlign: 'center', padding: '20px 12px', fontSize: 12,
                  color: isTarget ? BRAND[600] : '#D1D5DB',
                  border: `1px dashed ${isTarget ? BRAND[500] : '#E5E7EB'}`,
                  borderRadius: 8, background: isTarget ? BRAND[50] : 'transparent',
                  transition: 'all 0.15s',
                }}>
                  {isTarget ? '释放以移动到此列' : '拖拽卡片到此处'}
                </div>
              )}

              {/* 新增按钮 */}
              <div onClick={() => openCreate(status)}
                style={{
                  textAlign: 'center', padding: '10px 12px', fontSize: 12,
                  color: '#9CA3AF', border: '1px dashed #E5E7EB',
                  borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s', marginTop: 10,
                }}
                onMouseEnter={e => { e.currentTarget.style.color = BRAND[500]; e.currentTarget.style.borderColor = BRAND[500]; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.borderColor = '#E5E7EB'; }}>
                + 新增线索
              </div>
            </div>
          );
        })}
      </div>

      {/* 新增弹窗 */}
      <Modal title="新增线索" open={formOpen} onCancel={() => setFormOpen(false)} onOk={handleCreate}
        okText="创建" cancelText="取消" destroyOnHidden width={560}>
        <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            <Form.Item name="clueName" label="线索名称" rules={[{ required: true, message: '请输入' }]}>
              <Input placeholder="输入线索名称" />
            </Form.Item>
            <Form.Item name="clientCompany" label="甲方公司" rules={[{ required: true, message: '请输入' }]}>
              <Input placeholder="如 美团、阿里" />
            </Form.Item>
            <Form.Item name="beikeOwner" label="承接人" rules={[{ required: true, message: '请输入' }]}>
              <Input placeholder="请输入承接人" />
            </Form.Item>
            <Form.Item name="clueStatus" label="线索状态">
              <Select options={ST_SHORT.map(s => ({ value: s, label: ST_LONG[s] }))} />
            </Form.Item>
            <Form.Item name="clueLevel" label="等级">
              <Select options={['S', 'A', 'B', 'C'].map(v => ({ value: v, label: v + '级' }))} />
            </Form.Item>
            <Form.Item name="deptBelong" label="承接部门">
              <Select options={['平台一部', '平台二部', '平台三部', '中台'].map(d => ({ value: d, label: d }))} />
            </Form.Item>
          </div>
          <Form.Item name="requirementDesc" label="需求说明">
            <TextArea rows={3} placeholder="描述客户需求..." />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            <Form.Item name="contactDate" label="接触日期"><Input placeholder="YYYY-MM-DD" /></Form.Item>
            <Form.Item name="budgetAmount" label="预算金额"><Input type="number" placeholder="预算金额" /></Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
