import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Tabs, Table, Button, Modal, Form, Input, Select, Space, message, Row, Col, Collapse, Empty, Statistic, Timeline } from 'antd';
import { ArrowLeftOutlined, EditOutlined, PhoneOutlined, HeartOutlined, MessageOutlined } from '@ant-design/icons';
import { fetchClueDashboard, createClueFollow, type FollowSaveDTO } from '../../../../api/clue';

const { TextArea } = Input;

const LEVEL_COLORS: Record<string, string> = { A: 'red', B: 'orange', C: 'blue', D: 'default' };
const STATUS_COLORS: Record<string, string> = { '接触': 'blue', '沟通': 'cyan', '方案': 'gold', '谈判': 'orange', '成交': 'green', '流失': 'default' };
const HEALTH_COLORS: Record<string, string> = { normal: 'green', yellow: 'gold', red: 'red' };

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

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>加载中...</div>;
  if (!data || !data.clue) return <Empty description="线索不存在" />;

  const c = data.clue;
  const follows = data.follows || [];
  const logs = data.logs || [];
  const recentFollows = follows.slice(0, 3);

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* 顶部栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/ltc/leads')}>返回</Button>
          <h2 style={{ margin: 0 }}>{c.clueName}</h2>
          {c.clueLevel && <Tag color={LEVEL_COLORS[c.clueLevel]}>{c.clueLevel}级</Tag>}
          <Tag color={STATUS_COLORS[c.clueStatus] || 'default'}>{c.clueStatus}</Tag>
          {c.healthStatus && <Tag color={HEALTH_COLORS[c.healthStatus]}>{c.healthStatus === 'normal' ? '健康' : c.healthStatus === 'yellow' ? '需关注' : '风险'}</Tag>}
        </Space>
        <Button type="primary" icon={<EditOutlined />} onClick={() => setFollowModal(true)}>添加跟进</Button>
      </div>

      {/* 第一层：一眼全貌 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic title="线索等级" value={c.clueLevel || '-'} prefix={<HeartOutlined />} />
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{c.clientCompany}</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="预估金额" value={c.opportunityAmount || c.budgetAmount || 0} prefix="¥" />
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>预算: {c.budget || '-'}</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="跟进次数" value={follows.length} prefix={<MessageOutlined />} />
            <div style={{ fontSize: 12, color: follows.length > 0 ? '#52c41a' : '#ff4d4f', marginTop: 4 }}>
              {follows.length > 0 ? `最近: ${follows[0]?.follow_date || '-'}` : '未跟进'}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="负责人" value={c.beikeOwner || '-'} prefix={<PhoneOutlined />} />
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>客户: {c.clientContact || '-'}</div>
          </Card>
        </Col>
      </Row>

      {/* 最近跟进 */}
      {recentFollows.length > 0 && (
        <Card title="最近跟进" size="small" style={{ marginBottom: 16 }}>
          <Timeline items={recentFollows.map((f: any) => ({
            color: 'blue',
            children: (
              <div>
                <strong>{f.follow_date}</strong> - {f.follow_type || '跟进'}
                <p style={{ margin: '4px 0', color: '#666' }}>{f.content?.slice(0, 80)}</p>
              </div>
            ),
          }))} />
        </Card>
      )}

      {/* 第二层：Tab 切换 */}
      <Tabs
        defaultActiveKey="follows"
        items={[
          {
            key: 'follows',
            label: '📋 跟进记录',
            children: (
              <Table size="small" rowKey="id" dataSource={follows} pagination={{ pageSize: 10 }}
                columns={[
                  { title: '日期', dataIndex: 'follow_date', width: 100 },
                  { title: '类型', dataIndex: 'follow_type', width: 80 },
                  { title: '核心结论', dataIndex: 'core_conclusion', ellipsis: true },
                  { title: '下一步计划', dataIndex: 'next_plan', ellipsis: true, width: 150 },
                  { title: '跟进人', dataIndex: 'follow_user_name', width: 80 },
                ]}
                locale={{ emptyText: '暂无跟进记录，点击右上角"添加跟进"开始记录' }}
              />
            ),
          },
          {
            key: 'detail',
            label: '📊 线索详情',
            children: (
              <Descriptions column={2} size="small" bordered>
                <Descriptions.Item label="线索名称">{c.clueName}</Descriptions.Item>
                <Descriptions.Item label="客户公司">{c.clientCompany}</Descriptions.Item>
                <Descriptions.Item label="客户部门">{c.clientDept || '-'}</Descriptions.Item>
                <Descriptions.Item label="客户联系人">{c.clientContact || '-'}</Descriptions.Item>
                <Descriptions.Item label="贝壳负责人">{c.beikeOwner || '-'}</Descriptions.Item>
                <Descriptions.Item label="预算">{c.budget || '-'}</Descriptions.Item>
                <Descriptions.Item label="预算金额">¥{c.budgetAmount?.toLocaleString() || 0}</Descriptions.Item>
                <Descriptions.Item label="商机金额">¥{c.opportunityAmount?.toLocaleString() || 0}</Descriptions.Item>
                <Descriptions.Item label="线索等级">{c.clueLevel || '-'}</Descriptions.Item>
                <Descriptions.Item label="线索状态">{c.clueStatus || '-'}</Descriptions.Item>
                <Descriptions.Item label="评审状态">{c.reviewStatus || '-'}</Descriptions.Item>
                <Descriptions.Item label="来源类型">{c.sourceType || '-'}</Descriptions.Item>
                <Descriptions.Item label="客户圈层">{c.clientCircle || '-'}</Descriptions.Item>
                <Descriptions.Item label="行业">{c.industry || '-'}</Descriptions.Item>
                <Descriptions.Item label="价值象限">{c.valueQuadrant || '-'}</Descriptions.Item>
                <Descriptions.Item label="所属部门">{c.deptBelong || '-'}</Descriptions.Item>
                <Descriptions.Item label="需求描述" span={2}>{c.requirementDesc || '-'}</Descriptions.Item>
                <Descriptions.Item label="备注" span={2}>{c.remark || '-'}</Descriptions.Item>
              </Descriptions>
            ),
          },
          {
            key: 'logs',
            label: '📝 操作日志',
            children: (
              <Table size="small" rowKey="id" dataSource={logs} pagination={{ pageSize: 10 }}
                columns={[
                  { title: '时间', dataIndex: 'create_time', width: 150 },
                  { title: '操作人', dataIndex: 'user_name', width: 80 },
                  { title: '操作', dataIndex: 'action', width: 100 },
                  { title: '详情', dataIndex: 'detail', ellipsis: true },
                ]}
                locale={{ emptyText: '暂无操作日志' }}
              />
            ),
          },
        ]}
      />

      {/* 第三层：折叠区 */}
      <Collapse style={{ marginTop: 16 }} items={[
        {
          key: 'requirement',
          label: '需求与痛点',
          children: (
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="需求描述">{c.requirementDesc || '-'}</Descriptions.Item>
              <Descriptions.Item label="痛点">{c.painPoint || '-'}</Descriptions.Item>
              <Descriptions.Item label="预期目标">{c.expectedTarget || '-'}</Descriptions.Item>
            </Descriptions>
          ),
        },
      ]} />

      {/* 添加跟进弹窗 */}
      <Modal title="添加跟进记录" open={followModal} onCancel={() => setFollowModal(false)}
        onOk={async () => {
          try {
            const values = await followForm.validateFields();
            await createClueFollow({
              clueId,
              followType: values.followType,
              contactPerson: values.contactPerson,
              coreConclusion: values.coreConclusion,
              detailContent: values.detailContent,
              nextPlan: values.nextPlan,
              nextDeadline: values.nextDeadline,
              newStatus: values.newStatus,
            } as FollowSaveDTO);
            message.success('跟进记录已添加');
            setFollowModal(false);
            followForm.resetFields();
            load();
          } catch { /* ignore */ }
        }}
        width={560} okText="保存" destroyOnHidden>
        <Form form={followForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="followType" label="跟进类型" initialValue="电话">
            <Select options={[
              { value: '电话', label: '电话' }, { value: '拜访', label: '拜访' },
              { value: '微信', label: '微信' }, { value: '邮件', label: '邮件' },
              { value: '会议', label: '会议' },
            ]} />
          </Form.Item>
          <Form.Item name="contactPerson" label="联系人">
            <Input placeholder="跟进联系人" />
          </Form.Item>
          <Form.Item name="coreConclusion" label="核心结论" rules={[{ required: true, message: '请输入' }]}>
            <TextArea rows={2} placeholder="如：客户确认预算范围，需求基本明确..." />
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
            <Select allowClear placeholder="不改变" options={[
              { value: '接触', label: '接触' }, { value: '沟通', label: '沟通' },
              { value: '提案', label: '提案' }, { value: '谈判', label: '谈判' },
            ]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
