import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Tag, Table, Button, Modal, Form, Input, Select, message, Timeline, Descriptions, Empty, Row, Col, Statistic } from 'antd';
import { ArrowLeftOutlined, EditOutlined, PhoneOutlined, HeartOutlined, MessageOutlined, CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import { fetchClueDashboard, createClueFollow, type FollowSaveDTO } from '../../../../api/clue';

const { TextArea } = Input;

/* ============ 紫色品牌色系 ============ */
const BRAND = {
  50: '#EEEDFE',
  100: '#CECBF6',
  500: '#7F77DD',
  600: '#534AB7',
  700: '#3C3489',
};

const STYLE = {
  statusBg: {
    '接触': '#EFF6FF', '沟通': '#F5F3FF', '提案': '#FFF7ED',
    '承接': '#ECFDF5', '延期': '#F9FAFB', '丢失': '#FEF2F2',
  } as Record<string, string>,
  statusColor: {
    '接触': '#3B82F6', '沟通': '#8B5CF6', '提案': '#F59E0B',
    '承接': '#10B981', '延期': '#9CA3AF', '丢失': '#EF4444',
  } as Record<string, string>,
  grade: {
    A: { bg: '#DC2626', color: '#fff' },
    B: { bg: '#D97706', color: '#fff' },
    C: { bg: '#6B7280', color: '#fff' },
    S: { bg: '#DC2626', color: '#fff' },
  } as Record<string, { bg: string; color: string }>,
};

const ST_LONG: Record<string, string> = {
  '接触': '线索接触', '沟通': '沟通提案', '提案': '执行测试',
  '承接': '已承接', '延期': '已延期', '丢失': '已丢失',
};

const fmtMoney = (n?: number | string) => {
  const v = Number(n);
  if (!v || isNaN(v)) return '-';
  if (v >= 1e8) return `${(v / 1e8).toFixed(2)}亿`;
  if (v >= 10000) return `${(v / 10000).toFixed(0)}万`;
  return `¥${v.toLocaleString()}`;
};

export default function ClueDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const clueId = Number(id);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [followModal, setFollowModal] = useState(false);
  const [followForm] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetchClueDashboard(clueId);
      setData(d);
    } catch { message.error('加载失败'); }
    finally { setLoading(false); }
  }, [clueId]);

  useEffect(() => { load(); }, [load]);

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
      message.success('跟进记录已添加');
      setFollowModal(false);
      followForm.resetFields();
      load();
    } catch { /* ignore */ }
  };

  if (loading) return <div style={{ padding: 80, textAlign: 'center', color: '#9CA3AF' }}>加载中...</div>;
  if (!data || !data.clue) return <Empty description="线索不存在" />;

  const c = data.clue;
  const follows = data.follows || [];
  const logs = data.logs || [];

  return (
    <div style={{ paddingBottom: 40, maxWidth: 1000 }}>
      {/* 顶部栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/ltc/leads')} style={{ marginBottom: 8, borderRadius: 8 }}>
            返回列表
          </Button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#111827' }}>{c.clueName}</h2>
            {c.clueLevel && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 24, height: 24, borderRadius: 5, fontSize: 11, fontWeight: 700,
                background: STYLE.grade[c.clueLevel]?.bg || '#9CA3AF',
                color: STYLE.grade[c.clueLevel]?.color || '#fff',
              }}>
                {c.clueLevel}
              </span>
            )}
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '3px 12px', borderRadius: 999, fontSize: 12, fontWeight: 500,
              background: STYLE.statusBg[c.clueStatus] || '#F9FAFB',
              color: STYLE.statusColor[c.clueStatus] || '#9CA3AF',
            }}>
              {ST_LONG[c.clueStatus] || c.clueStatus}
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
            创建日期：{c.contactDate || c.createDate || '-'} · 承接人：{c.beikeOwner || '-'}
          </div>
        </div>
        <Button type="primary" icon={<EditOutlined />} onClick={() => setFollowModal(true)}
          style={{ background: BRAND[500], borderColor: BRAND[500], borderRadius: 8 }}>
          添加跟进
        </Button>
      </div>

      {/* KPI 概览 */}
      <Row gutter={12} style={{ marginBottom: 20 }}>
        <Col span={6}>
          <Card size="small" styles={{ body: { padding: '16px 18px' } }}
            style={{ borderRadius: 10, borderLeft: `3px solid ${BRAND[500]}` }}>
            <Statistic title={<span style={{ fontSize: 11, color: '#9CA3AF' }}>线索等级</span>}
              value={c.clueLevel || '-'} prefix={<HeartOutlined style={{ color: STYLE.grade[c.clueLevel]?.bg }} />}
              valueStyle={{ fontSize: 22, fontWeight: 600, color: '#111827' }} />
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{c.clientCompany}</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" styles={{ body: { padding: '16px 18px' } }}
            style={{ borderRadius: 10, borderLeft: '3px solid #F59E0B' }}>
            <Statistic title={<span style={{ fontSize: 11, color: '#9CA3AF' }}>预估金额</span>}
              value={fmtMoney(c.opportunityAmount ?? c.budgetAmount)} prefix="¥"
              valueStyle={{ fontSize: 22, fontWeight: 600, color: '#111827' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" styles={{ body: { padding: '16px 18px' } }}
            style={{ borderRadius: 10, borderLeft: '3px solid #10B981' }}>
            <Statistic title={<span style={{ fontSize: 11, color: '#9CA3AF' }}>跟进次数</span>}
              value={follows.length} prefix={<MessageOutlined />}
              valueStyle={{ fontSize: 22, fontWeight: 600, color: '#111827' }} />
            <div style={{ fontSize: 11, color: follows.length > 0 ? '#10B981' : '#EF4444', marginTop: 2 }}>
              {follows.length > 0 ? `最近: ${follows[0]?.followDate || follows[0]?.follow_date || '-'}` : '未跟进'}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" styles={{ body: { padding: '16px 18px' } }}
            style={{ borderRadius: 10, borderLeft: '3px solid #3B82F6' }}>
            <Statistic title={<span style={{ fontSize: 11, color: '#9CA3AF' }}>负责人</span>}
              value={c.beikeOwner || '-'} prefix={<PhoneOutlined />}
              valueStyle={{ fontSize: 22, fontWeight: 600, color: '#111827' }} />
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>客户: {c.clientContact || '-'}</div>
          </Card>
        </Col>
      </Row>

      {/* 评审状态 */}
      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card size="small" styles={{ body: { padding: '14px 18px' } }}
            style={{ borderRadius: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>评审状态：</span>
              <CheckCircleFilled style={{ color: c.reviewStatus === '通过' ? '#10B981' : '#D1D5DB', fontSize: 16 }} />
              <span style={{ fontSize: 14, fontWeight: 500, color: c.reviewStatus === '通过' ? '#10B981' : '#9CA3AF' }}>
                {c.reviewStatus === '通过' ? '已评审' : c.reviewStatus || '未评审'}
              </span>
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small" styles={{ body: { padding: '14px 18px' } }}
            style={{ borderRadius: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>确认商机：</span>
              <CheckCircleFilled style={{ color: c.businessConfirmed === '已确认' ? '#3B82F6' : '#D1D5DB', fontSize: 16 }} />
              <span style={{ fontSize: 14, fontWeight: 500, color: c.businessConfirmed === '已确认' ? '#3B82F6' : '#9CA3AF' }}>
                {c.businessConfirmed || '待确认'}
              </span>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 沟通时间线 */}
      {follows.length > 0 && (
        <Card title="沟通记录" size="small" style={{ marginBottom: 16, borderRadius: 10 }}
          styles={{ body: { padding: '12px 20px' } }}>
          <Timeline items={follows.map((f: any, idx: number) => ({
            dot: <span style={{
              width: 10, height: 10, borderRadius: '50%',
              background: BRAND[500], display: 'block', marginTop: 4,
            }} />,
            children: (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>
                    {f.follow_type || '跟进'} · 第{idx + 1}次
                  </span>
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>
                    {f.followDate || f.follow_date || '-'}
                  </span>
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>
                    {f.followUserName || f.follow_user_name || ''}
                  </span>
                </div>
                {f.coreConclusion && (
                  <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.6 }}>{f.coreConclusion}</div>
                )}
                {f.detailContent && (
                  <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{f.detailContent}</div>
                )}
                {f.nextPlan && (
                  <div style={{ fontSize: 11, color: BRAND[500], marginTop: 4 }}>下一步：{f.nextPlan}</div>
                )}
              </div>
            ),
          }))} />
        </Card>
      )}

      {/* 线索详情 */}
      <Card title="线索详情" size="small" style={{ marginBottom: 16, borderRadius: 10 }}>
        <Descriptions column={2} size="small" bordered>
          <Descriptions.Item label="线索名称">{c.clueName}</Descriptions.Item>
          <Descriptions.Item label="客户公司">{c.clientCompany}</Descriptions.Item>
          <Descriptions.Item label="客户部门">{c.clientDept || '-'}</Descriptions.Item>
          <Descriptions.Item label="客户联系人">{c.clientContact || '-'}</Descriptions.Item>
          <Descriptions.Item label="贝壳负责人">{c.beikeOwner || '-'}</Descriptions.Item>
          <Descriptions.Item label="承接部门">{c.deptBelong || '-'}</Descriptions.Item>
          <Descriptions.Item label="预算金额">{fmtMoney(c.budgetAmount)}</Descriptions.Item>
          <Descriptions.Item label="商机金额">{fmtMoney(c.opportunityAmount)}</Descriptions.Item>
          <Descriptions.Item label="线索等级">{c.clueLevel || '-'}</Descriptions.Item>
          <Descriptions.Item label="线索状态">{ST_LONG[c.clueStatus] || c.clueStatus || '-'}</Descriptions.Item>
          <Descriptions.Item label="评审状态">{c.reviewStatus || '-'}</Descriptions.Item>
          <Descriptions.Item label="接触日期">{c.contactDate || '-'}</Descriptions.Item>
          <Descriptions.Item label="提案日期">{c.proposalDate || '-'}</Descriptions.Item>
          <Descriptions.Item label="需求描述" span={2}>{c.requirementDesc || '-'}</Descriptions.Item>
          {c.clueEvaluation && (
            <Descriptions.Item label="线索评价" span={2}>{c.clueEvaluation}</Descriptions.Item>
          )}
          {c.remark && (
            <Descriptions.Item label="备注" span={2}>{c.remark}</Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* 操作日志 */}
      <Card title="操作日志" size="small" style={{ borderRadius: 10 }}>
        <Table size="small" rowKey="id" dataSource={logs} pagination={{ pageSize: 10 }}
          columns={[
            { title: '时间', dataIndex: 'create_time', width: 150 },
            { title: '操作人', dataIndex: 'user_name', width: 80 },
            { title: '操作', dataIndex: 'action', width: 100 },
            { title: '详情', dataIndex: 'detail', ellipsis: true },
          ]}
          locale={{ emptyText: '暂无操作日志' }}
        />
      </Card>

      {/* 添加跟进弹窗 */}
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
              options={['接触', '沟通', '提案', '承接', '延期', '丢失'].map(s => ({ value: s, label: ST_LONG[s] || s }))} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
