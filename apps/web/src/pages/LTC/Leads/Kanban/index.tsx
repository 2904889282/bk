import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Space, Typography, Select, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import {
  AimOutlined, WarningOutlined, RiseOutlined, ThunderboltOutlined, PlusOutlined,
} from '@ant-design/icons';
import {
  fetchCluePage, fetchClueStats, fetchCampaigns, fetchCampaignDashboard,
  type ClueVO, type ClueStats, type CampaignItem, type CampaignDashboardVO,
} from '../../../../api/clue';

const { Text, Title } = Typography;

function CountUp({ end }: { end: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      setVal(c => { const n = c + Math.max(Math.ceil(end / 30), 1); return n >= end ? end : n; });
    }, 30);
    return () => clearInterval(t);
  }, [end]);
  return <span>{val}</span>;
}

const STATUS_COLORS: Record<string, string> = {
  '接触': 'blue', '沟通': 'orange', '提案': 'purple', '承接': 'green', '延期': 'warning', '丢失': 'default',
};

const CIRCLE_COLORS: Record<string, string> = {
  '第一圈层': '#ff4d4f', '第二圈层': '#fa8c16', '第三圈层': '#1677ff', '第四圈层': '#8c8c8c',
};

const HEALTH_COLORS: Record<string, string> = { normal: 'green', yellow: 'gold', red: 'red' };

export default function LeadsKanban() {
  const navigate = useNavigate();
  const [list, setList] = useState<ClueVO[]>([]);
  const [stats, setStats] = useState<ClueStats>({ total: 0, pending: 0, accepted: 0, converted: 0 });
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [dashboard, setDashboard] = useState<CampaignDashboardVO | null>(null);
  const [activeCampaignId, setActiveCampaignId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      fetchCluePage({ pageNum: 1, pageSize: 200 }),
      fetchClueStats(),
      fetchCampaigns(),
    ]).then(([page, s, campaigns]) => {
      setList(page.records || []);
      setStats(s);
      setCampaigns(campaigns || []);
      if (campaigns?.length) {
        const active = campaigns.find(c => c.status === 'ACTIVE');
        if (active) {
          setActiveCampaignId(active.id);
          fetchCampaignDashboard(active.id).then(setDashboard).catch(() => {});
        }
      }
    }).catch(() => {});
  }, []);

  // 战役看板
  const campaignName = campaigns.find(c => c.id === activeCampaignId)?.name;

  // 状态分布
  const statusData = ['接触', '沟通', '提案', '承接', '延期', '丢失'].map(s => ({
    name: s, value: list.filter(l => l.clueStatus === s).length,
  })).filter(d => d.value > 0);

  const statusChartOption = {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, type: 'scroll' },
    series: [{
      type: 'pie', radius: ['40%', '65%'], data: statusData,
      label: { formatter: '{b}: {c}' },
      color: ['#6366f1', '#f59e0b', '#8b5cf6', '#10b981', '#facc15', '#94a3b8'],
    }],
  };

  // 圈层分布
  const circleData = ['第一圈层', '第二圈层', '第三圈层', '第四圈层'].map(c => ({
    name: c, value: list.filter(l => l.clientCircle === c).length,
  })).filter(d => d.value > 0);

  const circleChartOption = {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, type: 'scroll' },
    series: [{
      type: 'pie', radius: ['40%', '65%'], data: circleData,
      label: { formatter: '{b}: {c}' },
      color: ['#ff4d4f', '#fa8c16', '#1677ff', '#8c8c8c'],
    }],
  };

  const highValue = list.filter(l => l.clueLevel === 'S' || l.clueLevel === 'A').length;
  const warningCount = list.filter(l => l.healthStatus === 'yellow' || l.healthStatus === 'red').length;
  const recentList = [...list].sort((a, b) =>
    (b.createTime || '').localeCompare(a.createTime || '')
  ).slice(0, 5);

  return (
    <div>
      {/* 顶部操作栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={5} style={{ margin: 0 }}>线索作战看板</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/ltc/leads?create=1')}>
          新建线索
        </Button>
      </div>

      {/* 核心统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { title: '线索总量', value: stats.total, color: '#6366f1', icon: <RiseOutlined />, path: '/ltc/leads' },
          { title: '待跟进', value: stats.pending, color: '#f59e0b', icon: <WarningOutlined />, path: '/ltc/leads?status=接触' },
          { title: '高价值(S/A)', value: highValue, color: '#ef4444', icon: <ThunderboltOutlined />, path: '/ltc/leads?level=S' },
          { title: '已转化商机', value: stats.converted, color: '#10b981', icon: <RiseOutlined />, path: '/ltc/leads?status=承接' },
          { title: '超期预警', value: warningCount, color: '#f97316', icon: <WarningOutlined />, path: '/ltc/leads?healthStatus=red' },
        ].map((c, i) => (
          <Col xs={12} sm={8} md={Math.floor(24 / 5)} key={i}>
            <Card hoverable onClick={() => navigate(c.path)} style={{ cursor: 'pointer', borderTop: `3px solid ${c.color}`, borderRadius: 8 }}>
              <Statistic
                title={<Space>{c.icon}<Text>{c.title}</Text></Space>}
                valueRender={() => (
                  <span style={{ fontSize: 28, fontWeight: 800, color: c.color }}>
                    <CountUp end={c.value} />
                  </span>
                )}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* 战役看板 */}
      {dashboard && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={24}>
            <Card title={<Space><AimOutlined />战役作战看板 {campaignName && <Tag color="blue">{campaignName}</Tag>}</Space>}
              style={{ borderRadius: 8 }}
              extra={<Select size="small" value={activeCampaignId} style={{ width: 200 }}
                onChange={(v) => { setActiveCampaignId(v); fetchCampaignDashboard(v!).then(setDashboard).catch(() => {}); }}
                options={campaigns.map(c => ({ value: c.id, label: c.name }))} />}>
              <Row gutter={[16, 16]}>
                {[
                  { title: '目标线索数', value: dashboard.targetCount, suffix: '条', color: '#6366f1' },
                  { title: '已新增线索', value: dashboard.addedCount, suffix: '条', color: '#1677ff' },
                  { title: '有效线索率', value: dashboard.validRate, suffix: '%', color: '#52c41a', precision: 1 },
                  { title: '商机转化率', value: dashboard.conversionRate, suffix: '%', color: '#722ed1', precision: 1 },
                  { title: '待评审', value: dashboard.pendingReviewCount, suffix: '条', color: '#fa8c16' },
                  { title: '超期预警', value: dashboard.yellowWarningCount + (dashboard.redWarningCount || 0), suffix: '条', color: '#ff4d4f' },
                ].map((d, i) => (
                  <Col xs={12} sm={8} md={4} key={i}>
                    <Statistic
                      title={d.title}
                      value={d.value}
                      suffix={d.suffix}
                      precision={d.precision}
                      styles={{ content: { color: d.color, fontSize: 22, fontWeight: 700 } }}
                    />
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
        </Row>
      )}

      {/* 图表区 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={10}>
          <Card title="线索状态分布" style={{ borderRadius: 8 }}>
            <ReactECharts option={statusChartOption} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col xs={24} md={14}>
          <Card title="最近创建线索" style={{ borderRadius: 8 }}>
            <Table dataSource={recentList} rowKey="id" size="small" pagination={false}
              columns={[
                {
                  title: '线索编号', dataIndex: 'clueNumber', width: 140,
                  render: (v: string) => <Text code>{v}</Text>,
                },
                { title: '客户公司', dataIndex: 'clientCompany', width: 120,
                  render: (v: string, r: ClueVO) => <a onClick={() => navigate(`/ltc/leads/${r.id}`)}>{v}</a> },
                {
                  title: '圈层', dataIndex: 'clientCircle', width: 90,
                  render: (v: string) => v ? <Tag color={CIRCLE_COLORS[v]}>{v}</Tag> : '-',
                },
                {
                  title: '状态', dataIndex: 'clueStatus', width: 80,
                  render: (v: string) => <Tag color={STATUS_COLORS[v] || 'default'}>{v}</Tag>,
                },
                {
                  title: '健康度', dataIndex: 'healthStatus', width: 80,
                  render: (v: string) => v ? <Tag color={HEALTH_COLORS[v]}>{v === 'yellow' ? '黄灯' : v === 'red' ? '红灯' : '正常'}</Tag> : '-',
                },
                { title: '留痕日期', dataIndex: 'createDate', width: 100 },
              ]}
            />
          </Card>
        </Col>
      </Row>

      {/* 圈层分布 */}
      {circleData.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col xs={24} md={10}>
            <Card title="客户圈层分布" style={{ borderRadius: 8 }}>
              <ReactECharts option={circleChartOption} style={{ height: 280 }} />
            </Card>
          </Col>
          <Col xs={24} md={14}>
            <Card title="圈层对标策略" style={{ borderRadius: 8 }}>
              <Row gutter={[16, 16]}>
                {[
                  { name: '第一圈层（传统大厂）', desc: '北京、上海头部互联网公司，全力All in', color: '#ff4d4f', count: list.filter(l => l.clientCircle === '第一圈层').length },
                  { name: '第二圈层（AI大厂）', desc: '杭州及二线AI公司，高层拜访+方案攻坚', color: '#fa8c16', count: list.filter(l => l.clientCircle === '第二圈层').length },
                  { name: '第三圈层（腰部中厂）', desc: '腰部互联网企业，标品+轻量化定制', color: '#1677ff', count: list.filter(l => l.clientCircle === '第三圈层').length },
                  { name: '第四圈层（大G）', desc: '政府/国企/央企，关系经营+资质先行', color: '#8c8c8c', count: list.filter(l => l.clientCircle === '第四圈层').length },
                ].map((c, i) => (
                  <Col span={6} key={i}>
                    <Card size="small" style={{ borderTop: `3px solid ${c.color}`, borderRadius: 8 }}>
                      <Statistic title={c.name} value={c.count} suffix="条" styles={{ content: { color: c.color } }} />
                      <Text type="secondary" style={{ fontSize: 12 }}>{c.desc}</Text>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
}
