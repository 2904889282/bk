import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Typography, Skeleton } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../../store/useDataStore';
import { FundOutlined, ProjectOutlined, TeamOutlined, AlertOutlined, RightOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

function CountUp({ end }: { end: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const step = Math.max(Math.ceil(end / 40), 1);
    const timer = setInterval(() => setVal(c => { const n = c + step; return n >= end ? end : n; }), 25);
    return () => clearInterval(timer);
  }, [end]);
  return <span>{val}</span>;
}

export default function PortalPage() {
  const { stats, user } = useDataStore();
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { const t = setTimeout(() => setLoaded(true), 200); return () => clearTimeout(t); }, []);

  const cards = [
    { title: 'LTC 活跃管线', value: stats.activePipelines, color: '#6366f1', path: '/ltc/kanban' },
    { title: '重点项目', value: stats.projectsTotal, color: '#8b5cf6', path: '/pm/kanban' },
    { title: '人才资源', value: stats.talentTotal, color: '#10b981', path: '/pm/talent' },
    { title: '预警待处理', value: stats.openAlerts, color: '#f59e0b', path: '/ltc/alerts', pulse: true },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 0' }}>
      <div style={{ marginBottom: 40 }}>
        <Title level={2} style={{ marginBottom: 4 }}>👋 欢迎回来，{user?.name}</Title>
        <Paragraph type="secondary">LTC 管线管理与重点项目管理系统双轮驱动 · 数据填报入口</Paragraph>
      </div>

      {!loaded ? (
        <Row gutter={[20, 20]} style={{ marginBottom: 48 }}>
          {[1,2,3,4].map(i => <Col xs={12} sm={6} key={i}><Card><Skeleton active paragraph={{ rows: 1 }} /></Card></Col>)}
        </Row>
      ) : (
        <Row gutter={[18, 18]} style={{ marginBottom: 48 }}>
          {cards.map((c, i) => (
            <Col xs={12} sm={6} key={i}>
              <Card hoverable onClick={() => navigate(c.path)}
                style={{ cursor: 'pointer', animation: c.pulse ? 'pulse 2s infinite' : undefined }}>
                <Statistic title={c.title}
                  valueRender={() => <span style={{ fontSize: 36, fontWeight: 800, color: c.color }}><CountUp end={c.value} /></span>} />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Title level={4} style={{ marginBottom: 20 }}>⚡ 快捷入口</Title>
      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card hoverable onClick={() => navigate('/ltc/kanban')}
            style={{ cursor: 'pointer', borderTop: '3px solid #6366f1' }}
            actions={[<RightOutlined key="go" style={{ color: '#6366f1' }} />]}>
            <Card.Meta avatar={<FundOutlined style={{ fontSize: 28, color: '#6366f1' }} />}
              title="LTC 管线管理"
              description="从线索到回款全链路管理。6阶段追踪（线索→验证→机会点→合同→交付→回款），铁三角驱动，数据填报实时生效。" />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card hoverable onClick={() => navigate('/pm/kanban')}
            style={{ cursor: 'pointer', borderTop: '3px solid #06b6d4' }}
            actions={[<RightOutlined key="go" style={{ color: '#06b6d4' }} />]}>
            <Card.Meta avatar={<ProjectOutlined style={{ fontSize: 28, color: '#06b6d4' }} />}
              title="重点项目管理系统"
              description="项目全生命周期管理。立项→WBS分解→风险管控→变更管理→项目总结，人才池共享，支持完整CRUD操作。" />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
