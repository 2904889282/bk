import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { fetchCluePage, fetchClueStats, type ClueVO, type ClueStats } from '../../../../api/clue';

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
  '待跟进': 'blue', '跟进中': 'orange', '已提案': 'purple',
  '已签约': 'green', '已关闭': 'default',
};

export default function LeadsKanban() {
  const navigate = useNavigate();
  const [list, setList] = useState<ClueVO[]>([]);
  const [stats, setStats] = useState<ClueStats>({ total: 0, pending: 0, accepted: 0, converted: 0 });

  useEffect(() => {
    Promise.all([fetchCluePage({ pageNum: 1, pageSize: 200 }), fetchClueStats()])
      .then(([page, s]) => { setList(page.records || []); setStats(s); })
      .catch(() => {});
  }, []);

  const statusData = ['待跟进', '跟进中', '已提案', '已签约', '已关闭'].map(s => ({
    name: s,
    value: list.filter(l => l.clueStatus === s).length,
  }));

  const chartOption = {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie', radius: ['45%', '70%'], data: statusData,
      label: { formatter: '{b}: {c}' },
      color: ['#6366f1', '#f59e0b', '#8b5cf6', '#10b981', '#94a3b8'],
    }],
  };

  const highValue = list.filter(l => l.clueEvaluation === '高价值').length;
  const recentList = [...list].sort((a, b) => (b.createTime || '').localeCompare(a.createTime || '')).slice(0, 5);

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { title: '线索总量', value: stats.total, color: '#6366f1', path: '/ltc/leads' },
          { title: '待跟进', value: stats.pending, color: '#f59e0b', path: '/ltc/leads?status=待跟进' },
          { title: '高价值', value: highValue, color: '#ef4444', path: '/ltc/leads?level=S' },
          { title: '已签约商机', value: stats.converted, color: '#10b981', path: '/ltc/leads?status=已签约' },
        ].map((c, i) => (
          <Col xs={12} md={6} key={i}>
            <Card hoverable onClick={() => navigate(c.path)} style={{ cursor: 'pointer' }}>
              <Statistic title={c.title} valueRender={() => <span style={{ fontSize: 32, fontWeight: 800, color: c.color }}><CountUp end={c.value} /></span>} />
            </Card>
          </Col>
        ))}
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={10}>
          <Card title="📊 状态分布"><ReactECharts option={chartOption} style={{ height: 260 }} /></Card>
        </Col>
        <Col xs={24} md={14}>
          <Card title="📋 最近创建">
            <Table dataSource={recentList} rowKey="id" size="small" pagination={false}
              columns={[
                { title: '线索名称', dataIndex: 'clueName', render: (v: string, r: ClueVO) => <a onClick={() => navigate(`/ltc/leads/${r.id}`)}>{v}</a> },
                { title: '公司', dataIndex: 'clientCompany' },
                { title: '状态', dataIndex: 'clueStatus', render: (v: string) => <Tag color={STATUS_COLORS[v]}>{v}</Tag> },
                { title: '留痕日期', dataIndex: 'createDate' },
              ]} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
