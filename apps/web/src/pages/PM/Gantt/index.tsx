import React, { useEffect, useState, useMemo } from 'react';
import { Card, Row, Col, Select, Statistic, Space, Typography, Tag, Segmented } from 'antd';
import { ReloadOutlined, ProjectOutlined, CheckCircleOutlined } from '@ant-design/icons';
import GanttChart, { type GanttTask } from '../../../components/charts/GanttChart';
import { fetchProjectPage, type ProjectVO } from '../../../api/project';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const STATUS_OPTIONS = ['全部', '进行中', '已完成', '已暂停'];

export default function PmGantt() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectVO[]>([]);
  const [statusFilter, setStatusFilter] = useState('全部');
  const [timeMode, setTimeMode] = useState<string>('月');

  useEffect(() => {
    setLoading(true);
    fetchProjectPage({ pageNum: 1, pageSize: 200 })
      .then(res => setProjects(res.list || []))
      .finally(() => setLoading(false));
  }, []);

  const ganttData: GanttTask[] = useMemo(() => {
    let filtered = projects;
    if (statusFilter !== '全部') {
      filtered = projects.filter(p => p.projectStatus === statusFilter);
    }
    return filtered.map(p => ({
      id: p.id,
      name: p.projectName,
      start: p.startDate || dayjs().format('YYYY-MM-DD'),
      end: p.expectEndDate || dayjs().add(30, 'day').format('YYYY-MM-DD'),
      progress: p.progress || 0,
      owner: p.projectManager || '未知',
      status: p.projectStatus,
    }));
  }, [projects, statusFilter]);

  const stats = useMemo(() => ({
    total: projects.length,
    active: projects.filter(p => p.projectStatus === '进行中').length,
    completed: projects.filter(p => p.projectStatus === '已完成').length,
    avgProgress: projects.length ? Math.round(projects.reduce((s, p) => s + (p.progress || 0), 0) / projects.length) : 0,
  }), [projects]);

  const chartHeight = Math.max(300, ganttData.length * 36 + 60);

  return (
    <div style={{ padding: 24, background: 'inherit' }}>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col flex="auto">
          <Title level={4} style={{ margin: 0 }}>项目甘特图</Title>
        </Col>
        <Col>
          <Space>
            <Segmented
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={v => setStatusFilter(v as string)}
            />
            <Select
              value={timeMode}
              onChange={setTimeMode}
              style={{ width: 100 }}
              options={[
                { value: '月', label: '月度视图' },
                { value: '季', label: '季度视图' },
                { value: '年', label: '年度视图' },
              ]}
            />
          </Space>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card size="small"><Statistic title="项目总数" value={stats.total} prefix={<ProjectOutlined />} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="进行中" value={stats.active} valueStyle={{ color: '#2563eb' }} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="已完成" value={stats.completed} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="平均进度" value={stats.avgProgress} suffix="%" /></Card></Col>
      </Row>

      <Card styles={{ body: { padding: '16px 8px 4px' } }}>
        <GanttChart
          data={ganttData}
          loading={loading}
          height={chartHeight}
        />
      </Card>
    </div>
  );
}
