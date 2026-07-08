import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  App,
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  List,
  Modal,
  Progress,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Steps,
  Table,
  Tabs,
  Tag,
  Timeline,
  Tooltip,
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  AuditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  FlagOutlined,
  PlusOutlined,
  ProjectOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { isMockTokenError } from '../../../../utils/request';
import {
  createClueFollow,
  decideClueReview,
  deleteClue,
  fetchClueFullDetail,
  submitOpportunityReview,
  type ClueContactVO,
  type ClueFileVO,
  type ClueFullDetailVO,
  type ClueLogVO,
  type ClueSolutionVO,
  type FollowSaveDTO,
  type FollowVO,
  type OpportunityReviewDecisionDTO,
  type OpportunityReviewDTO,
  type OpportunityReviewVO,
} from '../../../../api/clue';

const { Text, Title, Paragraph } = Typography;

const STATUS_OPTIONS = ['接触', '沟通', '提案', '承接', '延期', '丢失'];
const STATUS_COLORS: Record<string, string> = {
  接触: 'blue',
  沟通: 'orange',
  提案: 'purple',
  承接: 'green',
  延期: 'gold',
  丢失: 'default',
  已转项目: 'success',
};
const HEALTH_LABELS: Record<string, string> = { normal: '正常', yellow: '黄灯', red: '红灯' };
const HEALTH_COLORS: Record<string, string> = { normal: 'green', yellow: 'gold', red: 'red' };
const CIRCLE_COLORS: Record<string, string> = {
  第一圈层: '#ff4d4f',
  第二圈层: '#fa8c16',
  第三圈层: '#1677ff',
  第四圈层: '#722ed1',
};
const CONTACT_LEVELS: Record<string, string> = {
  decision: '决策层',
  manager: '管理层',
  executor: '执行层',
};
const FOLLOW_TYPES = ['初次拜访', '二次沟通', '三次进攻', '日常跟进', '状态变更', '评审记录'];
const RESOURCE_LABELS: Record<string, string> = {
  executive: '高层支持',
  solution: '方案专家',
  market: '市场活动',
  gov: '政府资源',
  ecosystem: '生态资源',
};

function daysSince(value?: string) {
  if (!value) return null;
  return dayjs().diff(dayjs(value), 'day');
}

function healthText(detail?: ClueFullDetailVO) {
  const days = daysSince(detail?.lastFollowTime);
  if (days == null) return '暂无跟进记录，请尽快建立第一次有效沟通。';
  if (days >= 28) return `距上次跟进 ${days} 天，已触发红灯预警，请立即处理。`;
  if (days >= 14) return `距上次跟进 ${days} 天，已触发黄灯预警。`;
  return `距上次跟进 ${days} 天，距离黄灯预警还有 ${14 - days} 天。`;
}

function ltcStep(status?: string, reviewStatus?: string, converted?: boolean) {
  if (converted || status === '已转项目') return 4;
  if (reviewStatus === '评审中' || reviewStatus === '通过' || status === '承接') return 3;
  if (status === '提案') return 2;
  if (status === '沟通') return 1;
  return 0;
}

function pickArray<T>(value: T[] | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

export default function LeadsDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [followForm] = Form.useForm<FollowSaveDTO & { syncStatus?: boolean }>();
  const [reviewForm] = Form.useForm<OpportunityReviewDTO>();

  const [detail, setDetail] = useState<ClueFullDetailVO | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorCode, setErrorCode] = useState<number | 'mock' | null>(null);
  const [followOpen, setFollowOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const clueId = Number(id);
  const follows = pickArray<FollowVO>(detail?.followRecords);
  const contacts = pickArray<ClueContactVO>(detail?.contacts);
  const reviews = pickArray<OpportunityReviewVO>(detail?.opportunityReviews);
  const resources = pickArray<NonNullable<ClueFullDetailVO['resources']>[number]>(detail?.resources);
  const tasks = pickArray<NonNullable<ClueFullDetailVO['ironTriangleTasks']>[number]>(detail?.ironTriangleTasks);
  const solutions = pickArray<ClueSolutionVO>(detail?.solutions);
  const files = pickArray<ClueFileVO>(detail?.files);
  const logs = pickArray<ClueLogVO>(detail?.logs);

  const activeStep = useMemo(
    () => ltcStep(detail?.clueStatus, detail?.reviewStatus, detail?.isConverted),
    [detail?.clueStatus, detail?.reviewStatus, detail?.isConverted],
  );

  const loadDetail = async () => {
    if (!Number.isFinite(clueId)) return;
    setLoading(true);
    setErrorCode(null);
    try {
      const data = await fetchClueFullDetail(clueId);
      setDetail(data);
    } catch (err: unknown) {
      // mock 令牌拦截错误：拦截器已弹 toast，此处不再重复
      if (isMockTokenError(err)) {
        setErrorCode('mock');
      } else {
        // axios 错误对象结构：err.response.status = HTTP状态码，err.response.data.code = 业务错误码
        const axiosErr = err as { response?: { status?: number; data?: { code?: number } } };
        const httpStatus = axiosErr?.response?.status;
        const bizCode = axiosErr?.response?.data?.code;
        if (httpStatus === 403 || bizCode === 403) {
          setErrorCode(403);
        } else if (httpStatus === 404 || bizCode === 404) {
          setErrorCode(404);
        } else {
          setErrorCode(500);
          message.error('线索详情加载失败');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [clueId]);

  const handleDelete = () => {
    if (!detail) return;
    Modal.confirm({
      title: '确认删除线索',
      content: `删除后线索「${detail.clueName}」会进入回收站。`,
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteClue(detail.id);
        message.success('已移入回收站');
        navigate('/ltc/leads');
      },
    });
  };

  const handleFollowSubmit = async () => {
    const values = await followForm.validateFields();
    const nextDeadline = values.nextDeadline;
    const intervalDays = nextDeadline ? dayjs(nextDeadline).diff(dayjs(), 'day') : 0;
    const payload: FollowSaveDTO = {
      clueId,
      followType: values.followType,
      contactPerson: values.contactPerson,
      coreConclusion: values.coreConclusion,
      detailContent: values.detailContent,
      nextPlan: values.nextPlan,
      nextDeadline,
      weeklyReviewNotes: values.weeklyReviewNotes,
      newStatus: values.syncStatus ? values.newStatus : undefined,
      statusChangeReason: values.syncStatus ? values.statusChangeReason : undefined,
      confirmLongInterval: intervalDays > 14,
    };

    const submit = async () => {
      setSubmitting(true);
      try {
        await createClueFollow(payload);
        message.success('跟进已记录，健康度已刷新');
        setFollowOpen(false);
        followForm.resetFields();
        loadDetail();
      } finally {
        setSubmitting(false);
      }
    };

    if (intervalDays > 14) {
      Modal.confirm({
        title: '下次跟进超过两周',
        content: '纪要要求两周内必须有推进动作。确认仍按当前时间提交吗？',
        okText: '确认提交',
        cancelText: '返回修改',
        onOk: submit,
      });
      return;
    }
    await submit();
  };

  const handleReviewSubmit = async () => {
    const values = await reviewForm.validateFields();
    setSubmitting(true);
    try {
      await submitOpportunityReview(clueId, values);
      message.success('已发起商机评审');
      setReviewOpen(false);
      reviewForm.resetFields();
      loadDetail();
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewDecision = (review: OpportunityReviewVO, conclusion: OpportunityReviewDecisionDTO['conclusion']) => {
    if (!detail) return;

    const submitDecision = async (opinion?: string) => {
      setSubmitting(true);
      try {
        const result = await decideClueReview(clueId, review.id, { conclusion, opinion });
        if (conclusion === '通过') {
          message.success(`评审已通过，商机编号：${result.opportunityCode || '-'}`);
        } else {
          message.success(`评审已${conclusion}`);
        }
        loadDetail();
      } finally {
        setSubmitting(false);
      }
    };

    if (conclusion === '通过') {
      Modal.confirm({
        title: '确认通过评审',
        content: `通过后将自动创建「${detail.clueName}」的商机记录，并进入线索看板。`,
        okText: '通过并创建商机',
        cancelText: '取消',
        onOk: () => submitDecision(),
      });
      return;
    }

    let opinion = '';
    Modal.confirm({
      title: conclusion === '驳回' ? '驳回评审' : '要求补充材料',
      content: (
        <Input.TextArea
          rows={4}
          placeholder={conclusion === '驳回' ? '请填写驳回原因' : '请填写需要补充的材料或说明'}
          onChange={event => { opinion = event.target.value; }}
        />
      ),
      okText: '确认提交',
      cancelText: '取消',
      okButtonProps: { danger: conclusion === '驳回' },
      onOk: () => submitDecision(opinion),
    });
  };

  if (loading) {
    return <Card><Spin style={{ display: 'block', margin: '80px auto' }} /></Card>;
  }
  if (!detail) {
    if (errorCode === 403) {
      return (
        <div style={{ padding: 24, background: '#f5f7fb', minHeight: '100%' }}>
          <Card>
            <Empty
              description={
                <Space direction="vertical" size={8}>
                  <Text type="danger" strong>暂无该线索的访问权限</Text>
                  <Text type="secondary">你只能查看自己负责的线索，如需查看请联系管理员分配权限。</Text>
                  <Button type="primary" onClick={() => navigate('/ltc/leads')}>返回线索列表</Button>
                </Space>
              }
            />
          </Card>
        </div>
      );
    }
    if (errorCode === 'mock') {
      return (
        <div style={{ padding: 24, background: '#f5f7fb', minHeight: '100%' }}>
          <Card>
            <Empty
              description={
                <Space direction="vertical" size={8}>
                  <Text type="warning" strong>演示模式无法加载线索详情</Text>
                  <Text type="secondary">当前为前端演示模式，后端服务不可用。请启动后端服务（cd apps/api && mvn spring-boot:run）后使用真实账号重新登录。</Text>
                  <Button type="primary" onClick={() => navigate('/ltc/leads')}>返回线索列表</Button>
                </Space>
              }
            />
          </Card>
        </div>
      );
    }
    return <Card><Empty description="线索不存在或已被删除" /></Card>;
  }

  const health = detail.healthStatus || 'normal';
  const canOperate = !detail.isConverted && !['丢失', '已转项目'].includes(detail.clueStatus || '');

  return (
    <div style={{ padding: 24, background: '#f5f7fb', minHeight: '100%' }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/ltc/leads')}>返回列表</Button>
        <Button type="primary" icon={<PlusOutlined />} disabled={!canOperate} onClick={() => setFollowOpen(true)}>
          新增跟进
        </Button>
        <Button icon={<AuditOutlined />} disabled={!canOperate || detail.clueStatus !== '提案'} onClick={() => setReviewOpen(true)}>
          发起商机评审
        </Button>
        <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>删除</Button>
      </Space>

      <Card style={{ marginBottom: 16, borderRadius: 8 }}>
        <Row gutter={[20, 20]} align="middle">
          <Col xs={24} lg={9}>
            <Space direction="vertical" size={6}>
              <Space wrap>
                <Text copyable strong>{detail.clueNumber || `XS-${detail.id}`}</Text>
                {detail.clientCircle && <Tag color={CIRCLE_COLORS[detail.clientCircle]}>{detail.clientCircle}</Tag>}
                {detail.campaign?.name && <Tag color="purple" icon={<FlagOutlined />}>{detail.campaign.name}</Tag>}
                <Tag color={STATUS_COLORS[detail.clueStatus || ''] || 'default'}>{detail.clueStatus || '-'}</Tag>
              </Space>
              <Title level={3} style={{ margin: 0 }}>{detail.clientCompany}</Title>
              <Paragraph style={{ margin: 0, color: '#64748b' }}>{detail.requirementDesc || '暂无需求概要'}</Paragraph>
            </Space>
          </Col>
          <Col xs={24} lg={9}>
            <Steps
              size="small"
              current={activeStep}
              items={[
                { title: '线索登记' },
                { title: '有效性分析' },
                { title: '持续跟进' },
                { title: '商机评审' },
                { title: detail.isConverted ? '已转商机' : '转化/丢失' },
              ]}
            />
          </Col>
          <Col xs={24} lg={6}>
            <Card size="small" style={{ background: health === 'red' ? '#fff1f0' : health === 'yellow' ? '#fffbe6' : '#f6ffed' }}>
              <Space direction="vertical" size={4}>
                <Space>
                  <SafetyCertificateOutlined />
                  <Text strong>健康度</Text>
                  <Tag color={HEALTH_COLORS[health]}>{HEALTH_LABELS[health] || health}</Tag>
                </Space>
                <Text type={health === 'red' ? 'danger' : 'secondary'}>{healthText(detail)}</Text>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card hoverable onClick={() => navigate('/stats/expected-amount?title=预计商机金额')} style={{ borderLeft: '3px solid #1677ff' }}>
            <Statistic title="预计商机金额" value={Number(detail.opportunityAmount || detail.budgetAmount || 0)} suffix="万" />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card hoverable onClick={() => navigate('/stats/follow-records?title=跟进记录')} style={{ borderLeft: '3px solid #52c41a' }}>
            <Statistic title="跟进记录" value={follows.length} suffix="条" />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card hoverable onClick={() => navigate('/stats/contacts?title=决策人')} style={{ borderLeft: '3px solid #faad14' }}>
            <Statistic title="决策人" value={contacts.length} suffix="人" />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card hoverable onClick={() => navigate('/stats/tasks?title=协同任务')} style={{ borderLeft: '3px solid #722ed1' }}>
            <Statistic title="协同任务" value={tasks.length + resources.length} suffix="项" />
          </Card>
        </Col>
      </Row>

      <Tabs
        items={[
          {
            key: 'overview',
            label: '客户档案',
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={14}>
                  <Card title="客户基础画像" style={{ marginBottom: 16 }}>
                    <Descriptions column={2} bordered size="small">
                      <Descriptions.Item label="公司全称">{detail.clientCompany}</Descriptions.Item>
                      <Descriptions.Item label="甲方部门">{detail.clientDept || '-'}</Descriptions.Item>
                      <Descriptions.Item label="行业">{detail.industry || '-'}</Descriptions.Item>
                      <Descriptions.Item label="价值象限">{detail.valueQuadrant || '-'}</Descriptions.Item>
                      <Descriptions.Item label="线索来源">{detail.sourceType || '-'}</Descriptions.Item>
                      <Descriptions.Item label="来源活动">{detail.sourceActivityName || '-'}</Descriptions.Item>
                      <Descriptions.Item label="维护频率">{detail.maintenanceFreq ? `${detail.maintenanceFreq} 天/次` : '-'}</Descriptions.Item>
                      <Descriptions.Item label="下次维护">{detail.nextMaintenanceDate || '-'}</Descriptions.Item>
                      <Descriptions.Item label="客户痛点" span={2}>{detail.painPoint || '-'}</Descriptions.Item>
                      <Descriptions.Item label="预期目标" span={2}>{detail.expectedTarget || '-'}</Descriptions.Item>
                      <Descriptions.Item label="推荐产品" span={2}>{detail.recommendedProducts || detail.matchedProducts || '-'}</Descriptions.Item>
                    </Descriptions>
                  </Card>
                  <Card title="需求与方案">
                    <Descriptions column={1} bordered size="small">
                      <Descriptions.Item label="需求概要">{detail.requirementDesc || '-'}</Descriptions.Item>
                      <Descriptions.Item label="方案说明">{detail.recommendedProducts || '暂无推荐方案'}</Descriptions.Item>
                      <Descriptions.Item label="方案版本">
                        {solutions.length ? solutions.map(item => <Tag key={item.id}>{item.title} V{item.version || 1}</Tag>) : '暂无方案文件'}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>
                <Col xs={24} lg={10}>
                  <Card title="铁三角责任人" style={{ marginBottom: 16 }}>
                    <Row gutter={12}>
                      {[
                        { role: 'AR', name: detail.beikeOwner || '未指定', desc: '客户关系与推进' },
                        { role: 'SR', name: detail.srUserId ? `用户${detail.srUserId}` : '待配置', desc: '方案与技术支持' },
                        { role: 'FR', name: detail.frUserId ? `用户${detail.frUserId}` : '待配置', desc: '交付可行性评估' },
                      ].map(item => (
                        <Col span={8} key={item.role}>
                          <Card size="small">
                            <Space direction="vertical" align="center" style={{ width: '100%' }}>
                              <Avatar shape="square" icon={<UserOutlined />} />
                              <Text strong>{item.role}</Text>
                              <Text>{item.name}</Text>
                              <Text type="secondary" style={{ fontSize: 12 }}>{item.desc}</Text>
                            </Space>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </Card>
                  <Card title="决策链图谱">
                    <List
                      dataSource={contacts}
                      locale={{ emptyText: '暂无决策人，请在后续版本补充关系图谱维护入口' }}
                      renderItem={(item) => (
                        <List.Item>
                          <List.Item.Meta
                            avatar={<Avatar shape="square">{item.name?.slice(0, 1)}</Avatar>}
                            title={<Space><Text strong>{item.name}</Text><Tag>{CONTACT_LEVELS[item.level || ''] || item.level || '未分层'}</Tag><Tag color={item.attitude === '支持' ? 'green' : item.attitude === '反对' ? 'red' : 'default'}>{item.attitude || '中立'}</Tag></Space>}
                            description={<Text type="secondary">{item.position || '-'} · 影响力 {item.influenceWeight || 1}/5 · {item.personalFocus || item.remarks || '暂无关键言论'}</Text>}
                          />
                        </List.Item>
                      )}
                    />
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: 'follow',
            label: '跟进与健康度',
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={15}>
                  <Card title="跟进时间轴" extra={<Button type="primary" icon={<PlusOutlined />} disabled={!canOperate} onClick={() => setFollowOpen(true)}>新增跟进</Button>}>
                    {follows.length ? (
                      <Timeline
                        items={follows.map(item => ({
                          color: item.followType === '状态变更' ? 'gold' : item.followType === '评审记录' ? 'green' : 'blue',
                          children: (
                            <Card size="small">
                              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                <Space wrap>
                                  <Tag>{item.followType}</Tag>
                                  <Text type="secondary">{item.followDate ? dayjs(item.followDate).format('YYYY-MM-DD HH:mm') : '-'}</Text>
                                  <Text>对接人：{item.contactPerson || '-'}</Text>
                                  <Text>跟进人：{item.followUserName || '-'}</Text>
                                </Space>
                                <Text strong>{item.coreConclusion || '-'}</Text>
                                {item.detailContent && <Paragraph style={{ margin: 0 }}>{item.detailContent}</Paragraph>}
                                <Text type="secondary">下一步：{item.nextPlan || '-'} {item.nextDeadline ? ` · ${item.nextDeadline}` : ''}</Text>
                                {item.newStatus && <Tag color="purple">状态变更：{item.newStatus}</Tag>}
                              </Space>
                            </Card>
                          ),
                        }))}
                      />
                    ) : <Empty description="暂无跟进记录" />}
                  </Card>
                </Col>
                <Col xs={24} lg={9}>
                  <Card title="健康度规则" style={{ marginBottom: 16 }}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Tooltip title={healthText(detail)}>
                        <Progress
                          percent={health === 'red' ? 100 : health === 'yellow' ? 65 : 30}
                          status={health === 'red' ? 'exception' : health === 'yellow' ? 'active' : 'success'}
                        />
                      </Tooltip>
                      <Text>14 天无进展触发黄灯，28 天无进展触发红灯。</Text>
                      <Text type="secondary">新增跟进后自动刷新上次跟进时间，并重新计算健康度。</Text>
                    </Space>
                  </Card>
                  <Card title="周度评审提示">
                    <List
                      size="small"
                      dataSource={[
                        `当前状态：${detail.clueStatus || '-'}`,
                        `评审状态：${detail.reviewStatus || '未发起'}`,
                        `最近跟进：${detail.lastFollowTime ? dayjs(detail.lastFollowTime).format('YYYY-MM-DD HH:mm') : '暂无'}`,
                        `风险提示：${healthText(detail)}`,
                      ]}
                      renderItem={item => <List.Item>{item}</List.Item>}
                    />
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: 'review',
            label: '评审与协同',
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                  <Card title="商机评审" extra={<Button icon={<AuditOutlined />} disabled={!canOperate || detail.clueStatus !== '提案'} onClick={() => setReviewOpen(true)}>发起评审</Button>}>
                    <Table
                      size="small"
                      rowKey="id"
                      pagination={false}
                      dataSource={reviews}
                      columns={[
                        { title: '结论', dataIndex: 'conclusion', render: (v: string) => <Tag color={v === '通过' ? 'green' : v === '驳回' ? 'red' : 'gold'}>{v || '待预审'}</Tag> },
                        { title: '商机编号', dataIndex: 'opportunityCode', render: (v: string) => v || '-' },
                        { title: '周期', dataIndex: 'expectedDuration', render: (v: number) => v ? `${v} 天` : '-' },
                        { title: '意见', dataIndex: 'opinion', ellipsis: true },
                        {
                          title: '操作',
                          width: 180,
                          render: (_: unknown, record: OpportunityReviewVO) => {
                            const disabled = detail.isConverted || record.conclusion === '通过';
                            if (disabled) return <Text type="secondary">已处理</Text>;
                            return (
                              <Space size={4}>
                                <Button size="small" type="link" onClick={() => handleReviewDecision(record, '通过')}>通过</Button>
                                <Button size="small" type="link" onClick={() => handleReviewDecision(record, '待补充')}>补充</Button>
                                <Button size="small" type="link" danger onClick={() => handleReviewDecision(record, '驳回')}>驳回</Button>
                              </Space>
                            );
                          },
                        },
                      ]}
                    />
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card title="资源与铁三角任务">
                    <List
                      size="small"
                      dataSource={[
                        ...resources.map(item => ({ title: RESOURCE_LABELS[item.resourceType] || item.resourceType, desc: item.effectNotes || item.status || '资源申请待处理', icon: <ProjectOutlined /> })),
                        ...tasks.map(item => ({ title: `${item.role} · ${item.taskTitle}`, desc: `${item.status || 'TODO'} · 截止 ${item.deadline || '-'}`, icon: <TeamOutlined /> })),
                      ]}
                      locale={{ emptyText: '暂无协同记录' }}
                      renderItem={item => (
                        <List.Item>
                          <List.Item.Meta avatar={item.icon} title={item.title} description={item.desc} />
                        </List.Item>
                      )}
                    />
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: 'assets',
            label: '资料与追溯',
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                  <Card title="资料与方案沉淀">
                    <List
                      dataSource={[
                        ...solutions.map(item => ({ id: `s-${item.id}`, name: item.title, type: item.solutionType, desc: item.description || item.fileName || '方案资料', pool: item.isPool })),
                        ...files.map(item => ({ id: `f-${item.id}`, name: item.fileName, type: item.fileType, desc: item.description || item.fileUrl, pool: item.isPool })),
                      ]}
                      locale={{ emptyText: '暂无资料' }}
                      renderItem={item => (
                        <List.Item extra={item.pool ? <Tag color="green">已沉淀</Tag> : <Tag>线索资料</Tag>}>
                          <List.Item.Meta avatar={<FileTextOutlined />} title={item.name} description={`${item.type || '其他'} · ${item.desc || '-'}`} />
                        </List.Item>
                      )}
                    />
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card title="操作审计日志">
                    <Timeline
                      items={logs.slice(0, 20).map(item => ({
                        color: item.actionType === '删除' ? 'red' : item.actionType === '创建' ? 'green' : 'blue',
                        children: (
                          <Space direction="vertical" size={0}>
                            <Text strong>{item.actionType}</Text>
                            <Text>{item.actionSummary || '-'}</Text>
                            <Text type="secondary">{item.operatorName || '系统'} · {dayjs(item.createTime).format('YYYY-MM-DD HH:mm')}</Text>
                          </Space>
                        ),
                      }))}
                    />
                  </Card>
                </Col>
              </Row>
            ),
          },
        ]}
      />

      <Drawer
        title="新增跟进"
        size="large"
        open={followOpen}
        onClose={() => setFollowOpen(false)}
        extra={<Space><Button onClick={() => setFollowOpen(false)}>取消</Button><Button type="primary" loading={submitting} onClick={handleFollowSubmit}>提交</Button></Space>}
      >
        <Form
          form={followForm}
          layout="vertical"
          initialValues={{ followType: '日常跟进', syncStatus: false }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="followType" label="跟进类型" rules={[{ required: true }]}>
                <Select options={FOLLOW_TYPES.map(value => ({ value, label: value }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="contactPerson" label="对接人" rules={[{ required: true, message: '请输入客户对接人' }]}>
                <Input placeholder="客户姓名/角色" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="coreConclusion" label="核心结论" rules={[{ required: true, message: '请用一句话总结本次成果' }]}>
            <Input placeholder="例如：客户确认进入方案沟通阶段" />
          </Form.Item>
          <Form.Item name="detailContent" label="详细内容">
            <Input.TextArea rows={4} placeholder="记录沟通细节、关键言论、风险和客户反馈" />
          </Form.Item>
          <Form.Item name="nextPlan" label="下一步计划">
            <Input.TextArea rows={2} placeholder="明确动作、责任人和交付物" />
          </Form.Item>
          <Form.Item name="nextDeadline" label="下次跟进时间" rules={[{ required: true, message: '请选择下次跟进时间' }]}>
            <Input type="date" />
          </Form.Item>
          <Form.Item name="syncStatus" valuePropName="checked">
            <Select
              value={followForm.getFieldValue('syncStatus') ? 'yes' : 'no'}
              onChange={value => followForm.setFieldValue('syncStatus', value === 'yes')}
              options={[
                { value: 'no', label: '不变更线索状态' },
                { value: 'yes', label: '同步变更线索状态' },
              ]}
            />
          </Form.Item>
          <Form.Item shouldUpdate noStyle>
            {() => followForm.getFieldValue('syncStatus') ? (
              <>
                <Form.Item name="newStatus" label="目标状态" rules={[{ required: true, message: '请选择目标状态' }]}>
                  <Select options={STATUS_OPTIONS.map(value => ({ value, label: value }))} />
                </Form.Item>
                <Form.Item name="statusChangeReason" label="状态变更原因" rules={[{ required: true, message: '请填写状态变更原因' }]}>
                  <Input.TextArea rows={2} placeholder="说明为什么推进到该状态" />
                </Form.Item>
              </>
            ) : null}
          </Form.Item>
          <Form.Item name="weeklyReviewNotes" label="周度评审备注">
            <Input.TextArea rows={2} placeholder="可记录会上决议、待补充事项或主管意见" />
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        title="发起商机评审"
        size="large"
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        extra={<Space><Button onClick={() => setReviewOpen(false)}>取消</Button><Button type="primary" loading={submitting} onClick={handleReviewSubmit}>提交评审</Button></Space>}
      >
        <Form form={reviewForm} layout="vertical">
          <Form.Item name="opportunityAmount" label="预计商机金额（万）" rules={[{ required: true, message: '请输入预计金额' }]}>
            <Input type="number" placeholder="例如：300" />
          </Form.Item>
          <Form.Item name="expectedDuration" label="预计成交周期（天）" rules={[{ required: true, message: '请输入成交周期' }]}>
            <Input type="number" placeholder="例如：60" />
          </Form.Item>
          <Form.Item name="opinion" label="商机分析说明" rules={[{ required: true, message: '请填写客户痛点、优势、竞争态势和风险点' }]}>
            <Input.TextArea rows={6} placeholder="客户痛点 / 我方优势 / 竞争态势 / 风险点 / 需要的资源支持" />
          </Form.Item>
          <Card size="small" style={{ background: '#f8fafc' }}>
            <Space direction="vertical">
              <Text strong>自动带入材料</Text>
              <Text type="secondary">客户档案、跟进记录、方案资料、铁三角任务会在评审页统一展示。</Text>
            </Space>
          </Card>
        </Form>
      </Drawer>
    </div>
  );
}
