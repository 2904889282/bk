import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Typography, Skeleton, Button, Tag, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../../store/useDataStore';
import { useLeadStore, LEAD_STATUS_COLORS } from '../../store/useLeadStore';
import { FundOutlined, ProjectOutlined, PlusOutlined, RightOutlined } from '@ant-design/icons';
import Permission from '../../components/auth/Permission';
import LeadCreateModal from '../LTC/Leads/Detail/LeadCreateModal';
import ProjectForm from '../PM/Projects/Form';
import ProjectImportModal from '../PM/Projects/ImportModal';

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

  // Leads stats
  const { load: loadLeads } = useLeadStore();
  const [leadStats, setLeadStats] = useState({ total: 0, pending: 0, recentUpdates: [] as { id: string; name: string; date: string; status: string }[] });
  const refreshLeads = () => {
    const raw = localStorage.getItem('beike_leads');
    const leads = (raw ? JSON.parse(raw) : []).filter((l: { isDeleted?: boolean }) => !l.isDeleted);
    setLeadStats({
      total: leads.length,
      pending: leads.filter((l: { status: string }) => l.status === '待跟进').length,
      recentUpdates: leads
        .filter((l: { createdAt: string }) => l.createdAt)
        .sort((a: { createdAt: string }, b: { createdAt: string }) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 3)
        .map((l: { id: string; name: string; createdAt: string; status: string }) => ({
          id: l.id, name: l.name, date: l.createdAt, status: l.status,
        })),
    });
  };

  useEffect(() => { loadLeads(); refreshLeads(); }, []);

  // Lead modal states
  const [leadCreateOpen, setLeadCreateOpen] = useState(false);

  // Project modal states
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [projectImportOpen, setProjectImportOpen] = useState(false);

  useEffect(() => { const t = setTimeout(() => setLoaded(true), 200); return () => clearTimeout(t); }, []);

  const statCards = [
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
          {/* 线索管理动态卡（占据半宽） */}
          <Col xs={24} sm={12}>
            <Card
              style={{ borderLeft: '4px solid #6366f1', height: '100%' }}
              bodyStyle={{ padding: '18px 20px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ color: '#999', fontSize: 13, marginBottom: 2 }}>线索管理</div>
                  <Space align="baseline" size={8}>
                    <span style={{ fontSize: 36, fontWeight: 800, color: '#6366f1', lineHeight: 1 }}>
                      <CountUp end={leadStats.total} />
                    </span>
                    <span style={{ color: '#999', fontSize: 14 }}>条线索</span>
                    {leadStats.pending > 0 && (
                      <Tag color="orange" style={{ marginLeft: 4 }}>待跟进 {leadStats.pending}</Tag>
                    )}
                  </Space>
                </div>
              </div>

              {/* 最近更新 */}
              <div style={{ marginTop: 16, borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
                {leadStats.recentUpdates.length === 0 ? (
                  <span style={{ color: '#ccc', fontSize: 12 }}>暂无线索</span>
                ) : (
                  leadStats.recentUpdates.map((u, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, marginBottom: i < 2 ? 8 : 0,
                        fontSize: 12, cursor: 'pointer',
                      }}
                      onClick={() => navigate(`/ltc/leads/${u.id}`)}
                    >
                      <span style={{ color: '#6366f1', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
                        {u.name}
                      </span>
                      <span style={{ color: '#bbb', flexShrink: 0 }}>·</span>
                      <span style={{ color: '#999', flexShrink: 0 }}>{u.date}</span>
                      {u.status && <Tag color={LEAD_STATUS_COLORS[u.status]} style={{ fontSize: 10, lineHeight: '16px', marginInlineEnd: 0, flexShrink: 0 }}>{u.status}</Tag>}
                    </div>
                  ))
                )}
              </div>

              {/* 底部入口 */}
              <div style={{ marginTop: 12, textAlign: 'right' }}>
                <Button type="link" size="small" onClick={() => navigate('/ltc/leads')} style={{ padding: 0 }}>
                  查看全部线索 <RightOutlined style={{ fontSize: 10 }} />
                </Button>
              </div>
            </Card>
          </Col>

          {/* 剩余3个统计卡片 */}
          {statCards.map((c, i) => (
            <Col xs={12} sm={4} key={i}>
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
        {/* 左侧卡片：线索快速录入 */}
        <Col xs={24} md={12}>
          <Card style={{ borderTop: '3px solid #6366f1' }}>
            <Card.Meta
              avatar={<FundOutlined style={{ fontSize: 28, color: '#6366f1' }} />}
              title="线索快速录入"
              description="快速新增线索，数据实时同步至线索管理模块。"
            />
            <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
              <Permission code="pipeline:create">
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setLeadCreateOpen(true)}>
                  新建线索
                </Button>
              </Permission>
              <Permission code="pipeline:import">
                <Button onClick={() => navigate('/ltc/leads')}>
                  查看全部线索
                </Button>
              </Permission>
            </div>
          </Card>
        </Col>

        {/* 右侧卡片：项目快速录入 */}
        <Col xs={24} md={12}>
          <Card style={{ borderTop: '3px solid #06b6d4' }}>
            <Card.Meta
              avatar={<ProjectOutlined style={{ fontSize: 28, color: '#06b6d4' }} />}
              title="项目快速录入"
              description="快速新建项目或批量导入 Excel，数据实时同步至项目管理模块。"
            />
            <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
              <Permission code="project:create">
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setProjectFormOpen(true)}>
                  新建项目
                </Button>
              </Permission>
              <Permission code="project:import">
                <Button icon={<span>📥</span>} onClick={() => setProjectImportOpen(true)}>
                  批量导入
                </Button>
              </Permission>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 线索新建弹窗 */}
      <LeadCreateModal
        open={leadCreateOpen}
        onClose={() => setLeadCreateOpen(false)}
        onCreated={() => refreshLeads()}
      />

      {/* 项目新建表单 */}
      <ProjectForm
        open={projectFormOpen}
        editId={null}
        onClose={() => setProjectFormOpen(false)}
      />

      {/* 项目 Excel 导入 */}
      <ProjectImportModal
        open={projectImportOpen}
        onClose={() => setProjectImportOpen(false)}
        onImported={() => {}}
      />
    </div>
  );
}
