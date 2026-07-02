import { Card, Row, Col, Statistic } from 'antd';
import ReactECharts from 'echarts-for-react';
import { STAGE_MAP, STAGE_ORDER, PRODUCT_MAP, INDUSTRY_MAP, type PipelineStage } from '../../../types';
import { fetchPipelineList, type Pipeline } from '../../../api/pipeline';
import { useEffect, useMemo, useState } from 'react';

export default function LtcAnalysis() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);

  useEffect(() => {
    fetchPipelineList().then((data) => setPipelines(Array.isArray(data) ? data : []));
  }, []);

  const stats = useMemo(() => ({
    activePipelines: pipelines.filter(p => p.stage !== 'closed').length,
    totalAmount: pipelines
      .filter(p => !['lead', 'verify', 'closed'].includes(p.stage))
      .reduce((s, p) => s + (p.amount || 0), 0),
  }), [pipelines]);

  const stageOption = useMemo(() => {
    const stageCounts = STAGE_ORDER.slice(0, 6).map(s => pipelines.filter(p => p.stage === s).length);
    return {
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: STAGE_ORDER.slice(0, 6).map(s => STAGE_MAP[s]), axisLabel: { rotate: 15 } },
      yAxis: { type: 'value' },
      series: [{
        type: 'bar', data: stageCounts, itemStyle: { borderRadius: [6, 6, 0, 0] },
        color: (params: { dataIndex: number }) => ['#a5b4fc', '#c4b5fd', '#fcd34d', '#6ee7b7', '#67e8f9', '#7dd3fc'][params.dataIndex % 6],
      }],
    };
  }, [pipelines]);

  const productOption = useMemo(() => {
    const products = Object.keys(PRODUCT_MAP);
    const stages = ['lead', 'verify', 'opportunity', 'contract', 'delivery', 'cash'] as PipelineStage[];
    return {
      tooltip: { trigger: 'axis' },
      legend: { top: 10, data: ['线索/验证', '机会点', '合同/交付/回款'] },
      xAxis: { type: 'category', data: products.map(p => PRODUCT_MAP[p as keyof typeof PRODUCT_MAP]) },
      yAxis: { type: 'value' },
      series: [
        { name: '线索/验证', type: 'bar', stack: 'total', data: products.map(p => pipelines.filter(x => x.product === p && ['lead', 'verify'].includes(x.stage)).length), color: '#a5b4fc' },
        { name: '机会点', type: 'bar', stack: 'total', data: products.map(p => pipelines.filter(x => x.product === p && x.stage === 'opportunity').length), color: '#fcd34d' },
        { name: '合同/交付/回款', type: 'bar', stack: 'total', data: products.map(p => pipelines.filter(x => x.product === p && ['contract', 'delivery', 'cash'].includes(x.stage)).length), color: '#6ee7b7', itemStyle: { borderRadius: [6, 6, 0, 0] } },
      ],
    };
  }, [pipelines]);

  const industryOption = useMemo(() => {
    const industries = Object.keys(INDUSTRY_MAP);
    const amounts = industries.map(ind => pipelines.filter(p => p.industry === ind).reduce((s, p) => s + (p.amount || 0), 0));
    return {
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie', radius: ['40%', '70%'], data: industries.map((ind, i) => ({ name: INDUSTRY_MAP[ind as keyof typeof INDUSTRY_MAP], value: amounts[i] })),
        label: { formatter: '{b}: ¥{c}万' },
      }],
    };
  }, [pipelines]);

  const amountOption = useMemo(() => {
    const stagesAmt = STAGE_ORDER.slice(0, 6).map(s => pipelines.filter(p => p.stage === s).reduce((sm, p) => sm + (p.amount || 0), 0));
    return {
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: STAGE_ORDER.slice(0, 6).map(s => STAGE_MAP[s]) },
      yAxis: { type: 'value', axisLabel: { formatter: '{value}万' } },
      series: [{
        type: 'bar', data: stagesAmt, itemStyle: { borderRadius: [6, 6, 0, 0], color: '#6366f1' },
        label: { show: true, position: 'top', formatter: '{c}万' },
      }],
    };
  }, [pipelines]);

  const mlCount = pipelines.filter(p => ['lead', 'verify'].includes(p.stage)).length;
  const moCount = pipelines.filter(p => p.stage === 'opportunity').length;
  const mceCount = pipelines.filter(p => ['contract', 'delivery', 'cash'].includes(p.stage)).length;
  const conv1 = mlCount > 0 ? Math.round(moCount / mlCount * 100) : 0;
  const conv2 = moCount > 0 ? Math.round(mceCount / moCount * 100) : 0;

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}><Card><Statistic title="管线总数" value={stats.activePipelines} valueStyle={{ color: '#6366f1' }} /></Card></Col>
        <Col xs={12} md={6}><Card><Statistic title="ML→MO 转化率" value={conv1} suffix="%" valueStyle={{ color: '#8b5cf6' }} /></Card></Col>
        <Col xs={12} md={6}><Card><Statistic title="MO→MCE 转化率" value={conv2} suffix="%" valueStyle={{ color: '#10b981' }} /></Card></Col>
        <Col xs={12} md={6}><Card><Statistic title="管线总金额" value={stats.totalAmount} suffix="万" valueStyle={{ color: '#f59e0b' }} prefix="¥" /></Card></Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="📊 阶段管线分布"><ReactECharts option={stageOption} style={{ height: 300 }} /></Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="🍩 行业金额分布"><ReactECharts option={industryOption} style={{ height: 300 }} /></Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="📦 产品线阶段分布"><ReactECharts option={productOption} style={{ height: 300 }} /></Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="💰 各阶段金额"><ReactECharts option={amountOption} style={{ height: 300 }} /></Card>
        </Col>
      </Row>
    </div>
  );
}
