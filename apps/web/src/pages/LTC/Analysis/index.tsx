import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, Row, Col, Statistic, Tag, Typography } from 'antd';
import { fetchCluePage, fetchClueStats } from '../../../api/clue';
import type { ClueVO } from '../../../api/clue';

const { Text } = Typography;

const BRAND = { 50: '#EEEDFE', 100: '#CECBF6', 500: '#7F77DD', 600: '#534AB7', 700: '#3C3489' };

const ST_SHORT = ['接触', '沟通', '提案', '承接', '延期', '丢失'];
const ST_LONG: Record<string, string> = {
  '接触': '线索接触', '沟通': '沟通提案', '提案': '执行测试',
  '承接': '已承接', '延期': '已延期', '丢失': '已丢失',
};

const STATUS_STYLE: Record<string, { bg: string; fill: string }> = {
  '接触': { bg: '#EFF6FF', fill: '#3B82F6' },
  '沟通': { bg: '#F5F3FF', fill: '#8B5CF6' },
  '提案': { bg: '#FFF7ED', fill: '#F59E0B' },
  '承接': { bg: '#ECFDF5', fill: '#10B981' },
  '延期': { bg: '#F9FAFB', fill: '#9CA3AF' },
  '丢失': { bg: '#FEF2F2', fill: '#EF4444' },
};

const GRADE_COLORS: Record<string, string> = { S: '#DC2626', A: '#DC2626', B: '#D97706', C: '#6B7280' };

function BarChart({ label, count, total, fill, bg }: { label: string; count: number; total: number; fill: string; bg: string }) {
  const pct = total > 0 ? Math.round(count / total * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <span style={{ width: 60, fontSize: 12, color: '#6B7280', textAlign: 'right', flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 28, background: bg, borderRadius: 6, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 6, width: `${Math.max(pct, 3)}%`, background: fill,
          display: 'flex', alignItems: 'center', paddingLeft: 10,
          transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
          minWidth: pct > 0 ? 48 : 0,
        }}>
          <span style={{ fontSize: 11, color: pct > 35 ? '#fff' : fill, fontWeight: 500 }}>{count} · {pct}%</span>
        </div>
      </div>
    </div>
  );
}

export default function LeadsAnalysis() {
  const [leads, setLeads] = useState<ClueVO[]>([]);
  const [stats, setStats] = useState<{ total: number; pending: number; accepted: number; converted: number }>(
    { total: 0, pending: 0, accepted: 0, converted: 0 }
  );

  const loadData = useCallback(async () => {
    try {
      const [res, s] = await Promise.all([
        fetchCluePage({ pageNum: 1, pageSize: 500 }),
        fetchClueStats().catch(() => null),
      ]);
      setLeads(res.records || []);
      if (s) setStats(s);
    } catch { }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const totalBudget = useMemo(() =>
    leads.reduce((s, l) => s + Number(l.opportunityAmount ?? l.budgetAmount ?? 0), 0),
    [leads]);

  /* 状态分布 */
  const statusData = useMemo(() =>
    ST_SHORT.map(status => ({
      status, label: ST_LONG[status],
      count: leads.filter(l => l.clueStatus === status).length,
    })), [leads]);

  /* 部门分布 */
  const deptData = useMemo(() => {
    const map: Record<string, number> = {};
    leads.forEach(l => { const d = l.deptBelong || '未分配'; map[d] = (map[d] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [leads]);

  /* 等级分布 */
  const gradeData = useMemo(() =>
    ['S', 'A', 'B', 'C'].map(grade => ({
      grade, count: leads.filter(l => l.clueLevel === grade).length,
    })), [leads]);

  /* 承接人 TOP8 */
  const ownerData = useMemo(() => {
    const map: Record<string, number> = {};
    leads.forEach(l => { if (l.beikeOwner) map[l.beikeOwner] = (map[l.beikeOwner] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8)
      .map(([name, count]) => ({ name, count }));
  }, [leads]);

  const maxDept = Math.max(...deptData.map(d => d.count), 1);
  const maxOwner = Math.max(...ownerData.map(o => o.count), 1);

  return (
    <div>
      <h2 style={{ margin: '0 0 20px', fontSize: 24, fontWeight: 600, color: '#111827' }}>统计分析</h2>

      {/* KPI 概览 */}
      <Row gutter={[14, 14]} style={{ marginBottom: 24 }}>
        {[
          { label: '线索总数', value: leads.length, sub: '条线索', color: '#3B82F6' },
          { label: '活跃线索', value: stats.pending || leads.filter(l => l.clueStatus !== '丢失' && l.clueStatus !== '延期').length, sub: '进行中', color: '#10B981' },
          { label: '预算总额', value: totalBudget >= 1e8 ? `${(totalBudget / 1e8).toFixed(2)}亿` : `${(totalBudget / 10000).toFixed(0)}万`, sub: `${leads.filter(l => l.opportunityAmount || l.budgetAmount).length}条已录入`, color: '#F59E0B' },
          { label: '已丢失', value: leads.filter(l => l.clueStatus === '丢失').length, sub: `${leads.length ? Math.round(leads.filter(l => l.clueStatus === '丢失').length / leads.length * 100) : 0}% 丢失率`, color: '#EF4444' },
        ].map((item, i) => (
          <Col xs={12} md={6} key={i}>
            <Card size="small" style={{ borderRadius: 10, borderLeft: `3px solid ${item.color}` }}
              styles={{ body: { padding: '18px 20px' } }}>
              <Statistic title={<Text style={{ fontSize: 12, color: '#9CA3AF' }}>{item.label}</Text>}
                value={item.value}
                valueStyle={{ fontSize: i === 2 ? 20 : 24, fontWeight: 600, color: '#111827' }} />
              <Text style={{ fontSize: 11, color: '#9CA3AF' }}>{item.sub}</Text>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 图表区域 */}
      <Row gutter={[16, 16]}>
        {/* 线索状态分布 */}
        <Col xs={24} lg={12}>
          <Card title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>线索状态分布</span>
              <Tag style={{ margin: 0, borderRadius: 999, fontSize: 11 }}>{leads.length} 条</Tag>
            </div>
          } styles={{ body: { padding: '16px 20px' } }} style={{ borderRadius: 12 }}>
            {statusData.map(item => {
              const st = STATUS_STYLE[item.status] || { bg: '#F3F4F6', fill: '#9CA3AF' };
              return <BarChart key={item.status} label={item.label} count={item.count} total={leads.length}
                fill={st.fill} bg={st.bg} />;
            })}
          </Card>
        </Col>

        {/* 部门线索分布 */}
        <Col xs={24} lg={12}>
          <Card title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>部门线索分布</span>
              <Tag style={{ margin: 0, borderRadius: 999, fontSize: 11 }}>{deptData.length} 个部门</Tag>
            </div>
          } styles={{ body: { padding: '16px 20px' } }} style={{ borderRadius: 12 }}>
            {deptData.slice(0, 6).map(item => (
              <BarChart key={item.name} label={item.name} count={item.count} total={maxDept}
                fill={BRAND[500]} bg={BRAND[50]} />
            ))}
          </Card>
        </Col>

        {/* 等级分布 */}
        <Col xs={24} lg={12}>
          <Card title={<span style={{ fontSize: 15, fontWeight: 600 }}>等级分布</span>}
            styles={{ body: { padding: '20px' } }} style={{ borderRadius: 12 }}>
            <div style={{ display: 'flex', gap: 16 }}>
              {gradeData.map(item => {
                const pct = leads.length ? Math.round(item.count / leads.length * 100) : 0;
                return (
                  <div key={item.grade} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 6, color: GRADE_COLORS[item.grade] || '#9CA3AF' }}>
                      {item.count}
                    </div>
                    <Tag color={item.grade === 'S' ? 'red' : item.grade === 'A' ? 'red' : item.grade === 'B' ? 'orange' : 'default'}
                      style={{ margin: 0, borderRadius: 999, fontSize: 12 }}>
                      {item.grade}级 · {pct}%
                    </Tag>
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>

        {/* 承接人 TOP8 */}
        <Col xs={24} lg={12}>
          <Card title={<span style={{ fontSize: 15, fontWeight: 600 }}>承接人 TOP8</span>}
            styles={{ body: { padding: '16px 20px' } }} style={{ borderRadius: 12 }}>
            {ownerData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 30, color: '#D1D5DB', fontSize: 13 }}>暂无数据</div>
            ) : ownerData.map(item => (
              <BarChart key={item.name} label={item.name} count={item.count} total={maxOwner}
                fill={BRAND[500]} bg={BRAND[50]} />
            ))}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
