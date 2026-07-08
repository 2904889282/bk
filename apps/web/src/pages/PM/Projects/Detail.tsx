import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Tabs, Table, Button, Modal, Form, Input, InputNumber, Select, DatePicker, Space, message, Row, Col, Typography, Progress } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ArrowLeftOutlined, WarningOutlined, DollarOutlined, TeamOutlined, FlagOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { fetchProjectDetail, fetchPeriods, savePeriod, deletePeriod, type ProjectVO, type ProjectPeriod } from '../../../api/project';

const STATUS_COLORS: Record<string, string> = { '进行中': 'blue', '暂停': 'orange', '已交付': 'green', '已终止': 'default' };
const LEVEL_COLORS: Record<string, string> = { S: 'red', A: 'orange', B: 'blue', C: 'default' };

const WEEK_DAYS = ['第一周', '第二周', '第三周', '第四周'];

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projectId = Number(id);

  const [project, setProject] = useState<ProjectVO | null>(null);
  const [periods, setPeriods] = useState<ProjectPeriod[]>([]);
  const [activeMonth, setActiveMonth] = useState<string>('');
  const [editModal, setEditModal] = useState(false);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    const p = await fetchProjectDetail(projectId);
    setProject(p);
    const list = await fetchPeriods(projectId);
    setPeriods(list);
    if (!activeMonth && list.length > 0) setActiveMonth(list[0].periodMonth);
  }, [projectId, activeMonth]);

  useEffect(() => { load(); }, [load]);

  const curPeriod = periods.find(p => p.periodMonth === activeMonth);

  const openEdit = (month?: string) => {
    const existing = periods.find(p => p.periodMonth === month);
    form.setFieldsValue({
      ...existing,
      periodMonth: month || dayjs().format('YYYY-MM'),
      projectId,
    });
    setEditModal(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    await savePeriod({ ...values, projectId });
    message.success('已保存');
    setEditModal(false);
    load();
  };

  const handleDelete = async (periodId: number) => {
    await deletePeriod(periodId);
    message.success('已删除');
    load();
  };

  const parseProgress = (v?: string) => {
    if (!v) return 0;
    const n = parseFloat(v.replace('%', ''));
    return isNaN(n) ? 0 : n;
  };

  const parseJson = (v?: string) => {
    try { return v ? JSON.parse(v) : []; } catch { return []; }
  };

  if (!project) return <div style={{ padding: 40, textAlign: 'center' }}>加载中...</div>;

  return (
    <div style={{ paddingBottom: 40 }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/projects')}>返回列表</Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openEdit()}>新增月度数据</Button>
      </Space>

      {/* 项目基础信息 */}
      <Card style={{ marginBottom: 16 }}>
        <Descriptions title="项目信息" column={4} size="small" bordered>
          <Descriptions.Item label="项目名称">{project.projectName}</Descriptions.Item>
          <Descriptions.Item label="项目编号">{project.projectNumber || '-'}</Descriptions.Item>
          <Descriptions.Item label="项目等级"><Tag color={LEVEL_COLORS[project.projectLevel]}>{project.projectLevel}</Tag></Descriptions.Item>
          <Descriptions.Item label="项目状态"><Tag color={STATUS_COLORS[project.projectStatus]}>{project.projectStatus}</Tag></Descriptions.Item>
          <Descriptions.Item label="客户公司">{project.clientName}</Descriptions.Item>
          <Descriptions.Item label="甲方对接人">{project.clientContact || '-'}</Descriptions.Item>
          <Descriptions.Item label="一条龙经理">{project.projectManager}</Descriptions.Item>
          <Descriptions.Item label="交付经理">{project.deliveryManager || '-'}</Descriptions.Item>
          <Descriptions.Item label="产品经理">{project.productManager || '-'}</Descriptions.Item>
          <Descriptions.Item label="合同金额"><strong>¥{project.projectAmount?.toLocaleString()}</strong></Descriptions.Item>
          <Descriptions.Item label="所属部门">{project.deptBelong}</Descriptions.Item>
          <Descriptions.Item label="开始日期">{project.startDate}</Descriptions.Item>
          <Descriptions.Item label="预计结束">{project.expectEndDate || '-'}</Descriptions.Item>
          <Descriptions.Item label="供应商">{project.supplier || '-'}</Descriptions.Item>
          <Descriptions.Item label="风险评估" span={2}>{project.riskAssessment || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 月份 Tabs */}
      {periods.length === 0 ? (
        <Card><Typography.Text type="secondary">暂无月度数据，点击上方"新增月度数据"开始录入</Typography.Text></Card>
      ) : (
        <Tabs
          activeKey={activeMonth}
          onChange={setActiveMonth}
          type="card"
          items={periods.map(p => ({
            key: p.periodMonth,
            label: `${p.periodMonth}月`,
            children: curPeriod ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* 操作按钮 */}
                <Space>
                  <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(p.periodMonth)}>编辑本月</Button>
                  <Button size="small" danger icon={<DeleteOutlined />} onClick={() => { if (p.id) handleDelete(p.id); }}>删除</Button>
                </Space>

                {/* 营收 */}
                <Card title={<><DollarOutlined /> 营收信息</>} size="small">
                  <Row gutter={16}>
                    <Col span={12}>
                      <Table size="small" pagination={false} rowKey="key" columns={[
                        { title: '项目', dataIndex: 'label', width: 120 },
                        { title: '金额', dataIndex: 'value', align: 'right' },
                      ]} dataSource={[
                        { key: '1', label: '预计营收', value: `¥${curPeriod.estimatedRevenue?.toLocaleString() || 0}` },
                        { key: '2', label: '预期毛利', value: `¥${curPeriod.estimatedProfit?.toLocaleString() || 0}` },
                        { key: '3', label: '毛利率预估', value: curPeriod.estimatedProfitRate || '-' },
                        { key: '4', label: '执行成本预估', value: `¥${curPeriod.estimatedCost?.toLocaleString() || 0}` },
                        { key: '5', label: '人员成本预估', value: `¥${curPeriod.estimatedLaborCost?.toLocaleString() || 0}` },
                      ]} />
                    </Col>
                    <Col span={12}>
                      <Table size="small" pagination={false} rowKey="key" columns={[
                        { title: '项目', dataIndex: 'label', width: 120 },
                        { title: '金额', dataIndex: 'value', align: 'right' },
                      ]} dataSource={[
                        { key: '6', label: '实际营收', value: `¥${curPeriod.actualRevenue?.toLocaleString() || 0}` },
                        { key: '7', label: '实际净毛利', value: `¥${curPeriod.actualProfit?.toLocaleString() || 0}` },
                        { key: '8', label: '实际毛利率', value: curPeriod.actualProfitRate || '-' },
                        { key: '9', label: '实际执行成本', value: `¥${curPeriod.actualCost?.toLocaleString() || 0}` },
                        { key: '10', label: '毛利达成度', value: curPeriod.profitAchievementRate || '-' },
                      ]} />
                    </Col>
                  </Row>
                </Card>

                {/* 关键目标 + 周进度 */}
                <Card title={<><FlagOutlined /> 关键目标与进度</>} size="small">
                  <Descriptions column={2} size="small">
                    <Descriptions.Item label="目标说明">{curPeriod.goalDescription || '-'}</Descriptions.Item>
                    <Descriptions.Item label="月目标">{curPeriod.monthlyTarget || '-'}</Descriptions.Item>
                  </Descriptions>
                  <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
                    {WEEK_DAYS.map((week, i) => {
                      const targets = [
                        { t: curPeriod.w1Target, a: curPeriod.w1Actual, p: curPeriod.w1Progress },
                        { t: curPeriod.w2Target, a: curPeriod.w2Actual, p: curPeriod.w2Progress },
                        { t: curPeriod.w3Target, a: curPeriod.w3Actual, p: curPeriod.w3Progress },
                        { t: curPeriod.w4Target, a: curPeriod.w4Actual, p: curPeriod.w4Progress },
                      ];
                      const d = targets[i];
                      const pg = parseProgress(d.p);
                      return (
                        <Col span={6} key={week}>
                          <Card size="small" title={week} style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: 12, color: '#999' }}>目标: {d.t || '-'}</p>
                            <p style={{ fontSize: 12, color: '#666' }}>实际: {d.a || '-'}</p>
                            <Progress percent={pg} size="small" status={pg >= 80 ? 'success' : pg >= 60 ? 'active' : 'exception'} />
                          </Card>
                        </Col>
                      );
                    })}
                  </Row>
                </Card>

                {/* 人员 */}
                <Card title={<><TeamOutlined /> 人员分配</>} size="small">
                  <Table size="small" pagination={false} rowKey="name" dataSource={parseJson(curPeriod.personnel)}
                    columns={[
                      { title: '人员', dataIndex: 'name' },
                      { title: '职能', dataIndex: 'role' },
                      { title: '重要性', dataIndex: 'importanceWeight', render: (v: number) => v ? `${(v * 100).toFixed(0)}%` : '-' },
                      { title: '能效', dataIndex: 'efficiencyCalc', render: (v: string) => v || '-' },
                    ]}
                    locale={{ emptyText: '暂无人员分配' }} />
                </Card>

                {/* 里程碑 */}
                <Card title="里程碑" size="small">
                  <Table size="small" pagination={false} rowKey="description" dataSource={parseJson(curPeriod.milestones)}
                    columns={[
                      { title: '里程碑', dataIndex: 'description' },
                      { title: '奖励金额', dataIndex: 'rewardAmount' },
                      { title: '完成状态', dataIndex: 'completed', render: (v: string) => <Tag color={v === '是' ? 'green' : 'orange'}>{v || '-'}</Tag> },
                      { title: '发放状态', dataIndex: 'paid', render: (v: string) => <Tag color={v === '是' ? 'green' : 'default'}>{v || '-'}</Tag> },
                    ]}
                    locale={{ emptyText: '暂无里程碑' }} />
                  <div style={{ marginTop: 8 }}>
                    <Tag>过程奖: {curPeriod.processBonus || '-'}</Tag>
                    <Tag>结果奖: {curPeriod.resultBonus || '-'}</Tag>
                  </div>
                </Card>

                {/* 预警 */}
                {curPeriod.alertText && (
                  <Card size="small" style={{ borderColor: '#ff4d4f' }}>
                    <Space><WarningOutlined style={{ color: '#ff4d4f' }} /><strong>预警提醒</strong></Space>
                    <p style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{curPeriod.alertText}</p>
                    {curPeriod.progressInterpretation && <p style={{ color: '#666' }}>解读: {curPeriod.progressInterpretation}</p>}
                    {curPeriod.monthlyProfitExpectation && <p>月毛利完成预期: {curPeriod.monthlyProfitExpectation}</p>}
                  </Card>
                )}
              </div>
            ) : null,
          }))}
        />
      )}

      {/* 编辑月度数据弹窗 */}
      <Modal
        title="编辑月度数据"
        open={editModal}
        onCancel={() => setEditModal(false)}
        onOk={handleSave}
        width={900}
        destroyOnHidden
        okText="保存"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Space style={{ marginBottom: 12 }}>
            <Form.Item name="periodMonth" label="月份" rules={[{ required: true }]}>
              <DatePicker picker="month" format="YYYY-MM" />
            </Form.Item>
            <Form.Item name="periodStatus" label="状态">
              <Select style={{ width: 120 }} options={['正式执行', '规划中', '已结束'].map(v => ({ value: v, label: v }))} />
            </Form.Item>
          </Space>
          <Tabs size="small" items={[
            { key: 'revenue', label: '营收', children: <Row gutter={16}>
              {['estimatedRevenue', 'estimatedProfit', 'estimatedCost', 'estimatedLaborCost', 'actualRevenue', 'actualProfit', 'actualCost', 'actualLaborCost'].map(f => (
                <Col span={6} key={f}><Form.Item name={f} label={f.replace('estimated','预计').replace('actual','实际').replace('Revenue','营收').replace('Profit','毛利').replace('Cost','成本').replace('LaborCost','人员成本')}><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
              ))}
            </Row> },
            { key: 'goal', label: '目标', children: <Row gutter={16}>
              <Col span={12}><Form.Item name="goalDescription" label="目标说明"><Input.TextArea rows={2} /></Form.Item></Col>
              <Col span={12}><Form.Item name="monthlyTarget" label="月目标"><Input /></Form.Item>
              <Form.Item name="goalSummary" label="执行总结"><Input.TextArea rows={2} /></Form.Item></Col>
              {[0,1,2,3].map(i => <Col span={6} key={i}><Card size="small" title={WEEK_DAYS[i]}>
                <Form.Item name={`w${i+1}Target`} label="目标"><Input /></Form.Item>
                <Form.Item name={`w${i+1}Actual`} label="实际"><Input /></Form.Item>
                <Form.Item name={`w${i+1}Progress`} label="进度"><Input placeholder="如 80%" /></Form.Item>
              </Card></Col>)}
            </Row> },
            { key: 'personnel', label: '人员', children: <Form.Item name="personnel" label="人员(JSON)"><Input.TextArea rows={4} placeholder='[{"name":"张三","role":"经理","importanceWeight":0.8,"efficiencyCalc":"100%"}]' /></Form.Item> },
            { key: 'milestone', label: '里程碑', children: <Form.Item name="milestones" label="里程碑(JSON)"><Input.TextArea rows={4} placeholder='[{"description":"需求确认","rewardAmount":"5000","completed":"是","paid":"否","participants":"张三,李四"}]' /></Form.Item> },
            { key: 'alert', label: '预警', children: <>
              <Form.Item name="alertText" label="预警提醒"><Input.TextArea rows={2} /></Form.Item>
              <Form.Item name="progressInterpretation" label="进展解读"><Input.TextArea rows={2} /></Form.Item>
              <Form.Item name="monthlyProfitExpectation" label="月毛利预期"><Input /></Form.Item>
            </> },
          ]} />
        </Form>
      </Modal>
    </div>
  );
}
