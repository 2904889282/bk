import { useEffect } from 'react';
import { Card, Row, Col, Statistic, Tag, Table } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useLeadStore, type Lead, LEAD_STATUS_COLORS } from '../../../../store/useLeadStore';
import ReactECharts from 'echarts-for-react';

function CountUp({ end }: { end: number }) {
  const [val, setVal] = React.useState(0);
  useEffect(() => { const t = setInterval(() => setVal(c => { const n = c + Math.max(Math.ceil(end / 30), 1); return n >= end ? end : n; }), 30); return () => clearInterval(t); }, [end]);
  return <span>{val}</span>;
}

import React from 'react';

export default function LeadsKanban() {
  const { leads, load } = useLeadStore();
  const navigate = useNavigate();
  useEffect(() => { load(); }, [load]);

  const total = leads.length;
  const pending = leads.filter(l => l.status === '待跟进').length;
  const highValue = leads.filter(l => l.evaluation === '高价值').length;
  const signed = leads.filter(l => l.status === '已签约').length;

  const statusData = ['待跟进','跟进中','已提案','已签约','已关闭'].map(s => ({ name: s, value: leads.filter(l => l.status === s).length }));
  const chartOption = {
    tooltip: { trigger: 'item' },
    series: [{ type: 'pie', radius: ['45%', '70%'], data: statusData, label: { formatter: '{b}: {c}' },
      color: ['#6366f1','#f59e0b','#8b5cf6','#10b981','#94a3b8'] }],
  };

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { title: '线索总量', value: total, color: '#6366f1', path: '/ltc/leads' },
          { title: '待跟进', value: pending, color: '#f59e0b', path: '/ltc/leads?status=待跟进' },
          { title: '高价值', value: highValue, color: '#ef4444', path: '/ltc/leads?eval=高价值' },
          { title: '已签约商机', value: signed, color: '#10b981', path: '/ltc/leads?status=已签约' },
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
            <Table dataSource={leads.slice(0, 5)} rowKey="id" size="small" pagination={false}
              columns={[
                { title: '线索名称', dataIndex: 'name', render: (v: string, r: Lead) => <a onClick={() => navigate(`/ltc/leads/${r.id}`)}>{v}</a> },
                { title: '公司', dataIndex: 'company' },
                { title: '状态', dataIndex: 'status', render: (v: string) => <Tag color={LEAD_STATUS_COLORS[v]}>{v}</Tag> },
                { title: '创建日期', dataIndex: 'createdAt' },
              ]} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
