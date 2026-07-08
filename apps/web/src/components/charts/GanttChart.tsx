import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import dayjs from 'dayjs';
import { Empty, Spin } from 'antd';

export interface GanttTask {
  id: number;
  name: string;
  start: string;      // YYYY-MM-DD
  end: string;         // YYYY-MM-DD
  progress: number;    // 0-100
  owner: string;
  status?: string;      // 进行中/已完成/已暂停
}

interface GanttChartProps {
  data: GanttTask[];
  loading?: boolean;
  height?: number;
}

/** 独立甘特图组件 — 可嵌入任意页面 */
const GanttChart: React.FC<GanttChartProps> = ({ data, loading, height = 400 }) => {
  const option: EChartsOption | null = useMemo(() => {
    if (!data.length) return null;

    const today = dayjs().valueOf();
    const allStart = data.map(d => dayjs(d.start).valueOf());
    const allEnd = data.map(d => dayjs(d.end).valueOf());
    const minDate = Math.min(...allStart);
    const maxDate = Math.max(...allEnd);
    const pad = (maxDate - minDate) * 0.08 || 86400000 * 7;

    const statusColor: Record<string, string> = {
      '进行中': '#2563eb',
      '已完成': '#52c41a',
      '已暂停': '#faad14',
      '已终止': '#ff4d4f',
    };

    const barData = data.map((d, i) => ({
      name: d.name,
      value: [i, dayjs(d.start).valueOf(), dayjs(d.end).valueOf(), d.progress],
      itemStyle: {
        color: statusColor[d.status || ''] || '#2563eb',
      },
    }));

    // 进度条（覆盖在主 bar 上的半透明进度指示）
    const progressData = data.map((d, i) => {
      const startTs = dayjs(d.start).valueOf();
      const endTs = dayjs(d.end).valueOf();
      const dur = Math.max(endTs - startTs, 1);
      const progEnd = startTs + (dur * (d.progress || 0)) / 100;
      return {
        name: d.name,
        value: [i, startTs, progEnd, d.progress],
        itemStyle: {
          color: statusColor[d.status || ''] || '#2563eb',
        },
      };
    });

    // 今天标记线
    const todayMark = data.map((_, i) => ({
      xAxis: today,
      symbol: 'none',
      lineStyle: { color: '#ff4d4f', type: 'dashed' as const, width: 1.5 },
      label: { show: i === 0, formatter: `今天 ${dayjs().format('MM-DD')}`, color: '#ff4d4f', fontSize: 10 },
    }));

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const idx = params.dataIndex;
          const d = data[idx];
          if (!d) return '';
          const dur = dayjs(d.end).diff(dayjs(d.start), 'day');
          return `<b>${d.name}</b><br/>
            📅 ${d.start} ~ ${d.end}（${dur}天）<br/>
            📊 进度: ${d.progress}%<br/>
            👤 ${d.owner}<br/>
            ${d.status ? '🏷 ' + d.status : ''}`;
        },
      },
      grid: { left: 160, right: 40, top: 30, bottom: 20 },
      xAxis: {
        type: 'value',
        min: minDate - pad,
        max: maxDate + pad,
        axisLabel: {
          formatter: (v: number) => dayjs(v).format('MM-DD'),
          fontSize: 11,
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'category',
        data: data.map(d => d.name),
        axisTick: { show: false },
        axisLine: { show: false },
        axisLabel: {
          fontSize: 12,
          width: 150,
          overflow: 'truncate',
        },
        inverse: true,
      },
      series: [
        // 主条形（工期）
        {
          type: 'custom',
          data: barData,
          encode: { x: [1, 2], y: 0 },
          renderItem: (_params: any, api: any) => {
            const idx = api.value(0);
            const sv = api.coord([api.value(1), idx]);
            const ev = api.coord([api.value(2), idx]);
            const h = api.size([0, 1])[1] * 0.55;
            return {
              type: 'group',
              children: [
                {
                  type: 'rect',
                  shape: {
                    x: sv[0], y: sv[1] - h / 2,
                    width: Math.max(ev[0] - sv[0], 4), height: h,
                  },
                  style: { fill: barData[idx]?.itemStyle?.color || '#2563eb', opacity: 0.15 },
                },
              ],
            };
          },
          markLine: {
            silent: true,
            symbol: 'none',
            data: todayMark,
          },
        },
        // 进度条
        {
          type: 'custom',
          data: progressData,
          encode: { x: [1, 2], y: 0 },
          z: 2,
          renderItem: (_params: any, api: any) => {
            const idx = api.value(0);
            const sv = api.coord([api.value(1), idx]);
            const pv = api.coord([api.value(2), idx]);
            const h = api.size([0, 1])[1] * 0.55;
            const color = progressData[idx]?.itemStyle?.color || '#2563eb';
            return {
              type: 'rect',
              shape: {
                x: sv[0], y: sv[1] - h / 2,
                width: Math.max(pv[0] - sv[0], 2), height: h,
              },
              style: {
                fill: color,
                opacity: 0.85,
              },
            };
          },
        },
      ],
    };
  }, [data]);

  if (loading) {
    return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spin /></div>;
  }

  if (!data.length) {
    return <Empty description="暂无项目数据" style={{ paddingTop: 40 }} />;
  }

  return (
    <ReactECharts
      option={option!}
      style={{ height, width: '100%' }}
      notMerge
      lazyUpdate
    />
  );
};

export default GanttChart;
