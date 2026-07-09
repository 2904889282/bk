import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Tabs, Table, Button, Modal, Form, Input, Select, Space, message, Row, Col, Progress, Collapse, Timeline, Empty, Statistic } from 'antd';
import { EditOutlined, ArrowLeftOutlined, WarningOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { fetchDashboard, saveWeekly, type ProjectDashboard } from '../../../api/project';

const { TextArea } = Input;

const STATUS_COLORS: Record<string, string> = { '进行中': 'blue', '暂停': 'orange', '已交付': 'green', '已终止': 'default' };
const LEVEL_COLORS: Record<string, string> = { S: 'red', A: 'orange', B: 'blue', C: 'default' };
const SEVERITY_COLORS: Record<string, string> = { normal: 'default', warning: 'orange', critical: 'red' };
const MILESTONE_COLORS: Record<string, string> = { pending: 'default', in_progress: 'blue', completed: 'green', delayed: 'red' };

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projectId = Number(id);

  const [data, setData] = useState<ProjectDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [weeklyModal, setWeeklyModal] = useState(false);
  const [weeklyForm] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetchDashboard(projectId);
      setData(d);
    } catch { message.error('加载失败'); }
    finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const handleSaveWeekly = async () => {
    const values = await weeklyForm.validateFields();
    await saveWeekly(projectId, {
      ...values,
      periodMonth: dayjs().format('YYYY-MM'),
      weekNumber: Math.ceil(dayjs().date() / 7),
    });
    message.success('周报已保存');
    setWeeklyModal(false);
    weeklyForm.resetFields();
    load();
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>加载中...</div>;
  if (!data || !data.project) return <Empty description="项目不存在" />;

  const p = data.project;
  const currentMonth = dayjs().format('YYYY-MM');
  const curPeriod = data.periods.find(pp => pp.periodMonth === currentMonth);
  const curWeeklies = data.weeklies.filter(w => w.periodMonth === currentMonth);
  const activeRisks = data.risks.filter((r: any) => r.status === 'open');
  const totalProgress = p.progress || 0;

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* 顶部栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/pm/projects')}>返回</Button>
          <h2 style={{ margin: 0 }}>{p.projectName}</h2>
          <Tag color={LEVEL_COLORS[p.projectLevel]}>{p.projectLevel}</Tag>
          <Tag color={STATUS_COLORS[p.projectStatus]}>{p.projectStatus}</Tag>
        </Space>
        <Button type="primary" icon={<EditOutlined />} onClick={() => {
          const weekNum = Math.ceil(dayjs().date() / 7);
          const existing = curWeeklies.find((w: any) => w.weekNumber === weekNum);
          if (existing) weeklyForm.setFieldsValue({
            completedWork: existing.completedWork,
            issues: existing.issues,
            issueSeverity: existing.issueSeverity,
            nextWeekPlan: existing.nextWeekPlan,
          });
          setWeeklyModal(true);
        }}>本周更新</Button>
      </div>

      {/* 第一层：一眼全貌 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic title="整体进度" value={totalProgress} suffix="%" />
            <Progress percent={totalProgress} size="small" status={totalProgress >= 80 ? 'success' : 'active'} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="本月营收目标" value={curPeriod?.estimatedRevenue || 0} prefix="¥" />
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
              实际: ¥{curPeriod?.actualRevenue?.toLocaleString() || 0}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="本周报数" value={curWeeklies.length} suffix={`/ ${Math.ceil(dayjs().date()/7)}周`} />
            <div style={{ fontSize: 12, color: curWeeklies.length > 0 ? '#52c41a' : '#ff4d4f', marginTop: 4 }}>
              {curWeeklies.length > 0 ? '已更新' : '待更新'}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="活跃风险" value={activeRisks.length} prefix={<WarningOutlined style={{ color: activeRisks.length > 0 ? '#ff4d4f' : '#52c41a' }} />} />
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
              {activeRisks.length > 0 ? '需关注' : '无风险'}
            </div>
          </Card>
        </Col>
      </Row>

      {/* 本周进度条 */}
      {curWeeklies.length > 0 && (
        <Card title="本月周进度" size="small" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            {[1, 2, 3, 4].map(week => {
              const w = curWeeklies.find((ww: any) => ww.weekNumber === week);
              const hasIssue = w && w.issues && w.issues.trim();
              return (
                <Col span={6} key={week}>
                  <Card size="small" title={`第${week}周`} styles={{ body: { padding: 12 } }}>
                    {w ? (
                      <>
                        <p style={{ fontSize: 12, margin: 0, color: '#666' }}>{w.completedWork?.slice(0, 50) || '无记录'}...</p>
                        {hasIssue && <Tag color={SEVERITY_COLORS[w.issueSeverity] || 'default'} style={{ marginTop: 4 }}>{w.issueSeverity === 'critical' ? '紧急' : w.issueSeverity === 'warning' ? '注意' : '正常'}</Tag>}
                      </>
                    ) : (
                      <span style={{ color: '#ccc' }}>未更新</span>
                    )}
                  </Card>
                </Col>
              );
            })}
          </Row>
        </Card>
      )}

      {/* 当前风险（有则显示红色卡片） */}
      {activeRisks.length > 0 && (
        <Card size="small" style={{ marginBottom: 16, borderColor: '#ff4d4f' }}>
          <Space><WarningOutlined style={{ color: '#ff4d4f' }} /><strong>当前风险（{activeRisks.length}项）</strong></Space>
          <div style={{ marginTop: 8 }}>
            {activeRisks.map((r: any) => (
              <Tag key={r.id} color={r.level === 'high' ? 'red' : r.level === 'medium' ? 'orange' : 'default'} style={{ marginBottom: 4 }}>
                {r.type}: {r.description?.slice(0, 40)}
              </Tag>
            ))}
          </div>
        </Card>
      )}

      {/* 第二层：Tab 切换 */}
      <Tabs
        defaultActiveKey="weekly"
        items={[
          {
            key: 'weekly',
            label: '📋 周报记录',
            children: (
              <Table size="small" rowKey="id" dataSource={data.weeklies} pagination={{ pageSize: 10 }}
                columns={[
                  { title: '月份', dataIndex: 'periodMonth', width: 80 },
                  { title: '周次', dataIndex: 'weekNumber', width: 60, render: (v: number) => `第${v}周` },
                  { title: '完成工作', dataIndex: 'completedWork', ellipsis: true },
                  { title: '问题', dataIndex: 'issues', ellipsis: true,
                    render: (v: string, r: any) => v ? <Tag color={SEVERITY_COLORS[r.issueSeverity]}>{v.slice(0,30)}</Tag> : '-' },
                  { title: '下周计划', dataIndex: 'nextWeekPlan', ellipsis: true },
                ]}
                locale={{ emptyText: '暂无周报，点击右上角"本周更新"开始记录' }}
              />
            ),
          },
          {
            key: 'monthly',
            label: '📊 月度数据',
            children: (
              <Table size="small" rowKey="id" dataSource={data.periods} pagination={false}
                columns={[
                  { title: '月份', dataIndex: 'periodMonth', width: 80 },
                  { title: '预计营收', dataIndex: 'estimatedRevenue', render: (v: number) => `¥${v?.toLocaleString() || 0}` },
                  { title: '实际营收', dataIndex: 'actualRevenue', render: (v: number) => `¥${v?.toLocaleString() || 0}` },
                  { title: '预期毛利', dataIndex: 'estimatedProfit', render: (v: number) => `¥${v?.toLocaleString() || 0}` },
                  { title: '实际毛利', dataIndex: 'actualProfit', render: (v: number) => `¥${v?.toLocaleString() || 0}` },
                  { title: '达成度', dataIndex: 'profitAchievementRate' },
                ]}
                locale={{ emptyText: '暂无月度数据' }}
              />
            ),
          },
          {
            key: 'milestones',
            label: '🎯 里程碑',
            children: data.milestones.length > 0 ? (
              <Timeline items={data.milestones.map((m: any) => ({
                color: MILESTONE_COLORS[m.status] === 'green' ? 'green' : MILESTONE_COLORS[m.status] === 'red' ? 'red' : 'blue',
                children: (
                  <div>
                    <strong>{m.milestone}</strong>
                    <div style={{ fontSize: 12, color: '#999' }}>
                      {m.stage} | 计划: {m.plannedDate || '-'} | 实际: {m.actualDate || '-'}
                    </div>
                    <Tag color={MILESTONE_COLORS[m.status]}>{m.status}</Tag>
                  </div>
                ),
              }))} />
            ) : <Empty description="暂无里程碑" />,
          },
          {
            key: 'team',
            label: '👥 团队',
            children: (
              <Table size="small" rowKey="id" dataSource={data.team} pagination={false}
                columns={[
                  { title: '姓名', dataIndex: 'name', width: 80 },
                  { title: '部门', dataIndex: 'dept', width: 100 },
                  { title: '职务', dataIndex: 'role', width: 100 },
                  { title: '责任', dataIndex: 'responsibility', width: 60,
                    render: (v: string) => v ? <Tag>{v}</Tag> : '-' },
                ]}
                locale={{ emptyText: '暂无团队成员' }}
              />
            ),
          },
        ]}
      />

      {/* 第三层：折叠区 */}
      <Collapse style={{ marginTop: 16 }} items={[
        {
          key: 'basic',
          label: '项目基本信息',
          children: (
            <Descriptions column={3} size="small" bordered>
              <Descriptions.Item label="项目名称">{p.projectName}</Descriptions.Item>
              <Descriptions.Item label="项目编号">{p.projectNumber || '-'}</Descriptions.Item>
              <Descriptions.Item label="客户公司">{p.clientName}</Descriptions.Item>
              <Descriptions.Item label="一条龙经理">{p.projectManager}</Descriptions.Item>
              <Descriptions.Item label="交付经理">{p.deliveryManager || '-'}</Descriptions.Item>
              <Descriptions.Item label="产品经理">{p.productManager || '-'}</Descriptions.Item>
              <Descriptions.Item label="开始日期">{p.startDate}</Descriptions.Item>
              <Descriptions.Item label="预计结束">{p.expectEndDate || '-'}</Descriptions.Item>
              <Descriptions.Item label="合同金额">¥{p.projectAmount?.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="所属部门">{p.deptBelong}</Descriptions.Item>
              <Descriptions.Item label="供应商">{p.supplier || '-'}</Descriptions.Item>
              <Descriptions.Item label="风险评估" span={3}>{p.riskAssessment || '-'}</Descriptions.Item>
            </Descriptions>
          ),
        },
        {
          key: 'wbs',
          label: 'WBS 工作分解',
          children: (
            <Table size="small" rowKey="id" dataSource={data.wbs} pagination={false} scroll={{ x: 1000 }}
              columns={[
                { title: '代码', dataIndex: 'code', width: 60 },
                { title: '任务', dataIndex: 'taskName', width: 150 },
                { title: '活动', dataIndex: 'activities', ellipsis: true },
                { title: '工时', dataIndex: 'workHours', width: 60 },
                { title: '费用', dataIndex: 'costEstimate', width: 80 },
                { title: '开始', dataIndex: 'startDate', width: 100 },
                { title: '结束', dataIndex: 'endDate', width: 100 },
                { title: '交付件', dataIndex: 'deliverable', width: 120 },
                { title: '状态', dataIndex: 'status', width: 80, render: (v: string) => <Tag color={v === 'completed' ? 'green' : 'blue'}>{v}</Tag> },
              ]}
              locale={{ emptyText: '暂无WBS数据' }}
            />
          ),
        },
        {
          key: 'risks',
          label: '风险管理',
          children: (
            <Table size="small" rowKey="id" dataSource={data.risks} pagination={false}
              columns={[
                { title: '类型', dataIndex: 'type', width: 100 },
                { title: '描述', dataIndex: 'description', ellipsis: true },
                { title: '等级', dataIndex: 'level', width: 80, render: (v: string) => <Tag color={v === 'high' ? 'red' : v === 'medium' ? 'orange' : 'default'}>{v}</Tag> },
                { title: '负责人', dataIndex: 'owner', width: 80 },
                { title: '状态', dataIndex: 'status', width: 80, render: (v: string) => <Tag color={v === 'open' ? 'orange' : 'green'}>{v}</Tag> },
              ]}
              locale={{ emptyText: '暂无风险' }}
            />
          ),
        },
        {
          key: 'changes',
          label: '变更记录',
          children: (
            <Table size="small" rowKey="id" dataSource={data.changes} pagination={false}
              columns={[
                { title: '日期', dataIndex: 'changeDate', width: 100 },
                { title: '涉及任务', dataIndex: 'affectedTask', width: 150 },
                { title: '变更要点', dataIndex: 'changeSummary', ellipsis: true },
                { title: '申请人', dataIndex: 'applicant', width: 80 },
                { title: '审批人', dataIndex: 'approver', width: 80 },
              ]}
              locale={{ emptyText: '暂无变更' }}
            />
          ),
        },
      ]} />

      {/* 本周更新弹窗 */}
      <Modal title={`本周更新 - ${dayjs().format('YYYY年MM月')}第${Math.ceil(dayjs().date()/7)}周`}
        open={weeklyModal} onCancel={() => setWeeklyModal(false)} onOk={handleSaveWeekly}
        width={600} okText="保存" destroyOnHidden>
        <Form form={weeklyForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="completedWork" label="本周完成了什么" rules={[{ required: true, message: '请输入' }]}>
            <TextArea rows={3} placeholder="如：完成美团项目需求调研，交付了PRD文档..." />
          </Form.Item>
          <Form.Item name="issues" label="遇到的问题">
            <TextArea rows={2} placeholder="如：客户反馈延迟，需协调资源..." />
          </Form.Item>
          <Form.Item name="issueSeverity" label="问题紧急程度" initialValue="normal">
            <Select options={[
              { value: 'normal', label: '正常' },
              { value: 'warning', label: '需注意' },
              { value: 'critical', label: '紧急' },
            ]} />
          </Form.Item>
          <Form.Item name="nextWeekPlan" label="下周计划">
            <TextArea rows={2} placeholder="如：完成原型设计，启动开发..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
