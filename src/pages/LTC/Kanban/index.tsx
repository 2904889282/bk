import { Card, Tag, Progress, Row, Col, Button, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useDataStore } from '../../../store/useDataStore';
import { STAGE_MAP, STAGE_COLORS, type PipelineStage } from '../../../types';
import PipelineForm from '../Pipeline/Form';

const COLUMNS: { stages: PipelineStage[]; title: string; color: string; icon: string }[] = [
  { stages: ['lead', 'verify'], title: 'ML · 线索管理', color: '#6366f1', icon: '🟣' },
  { stages: ['opportunity'], title: 'MO · 机会点管理', color: '#f59e0b', icon: '🟠' },
  { stages: ['contract', 'delivery', 'cash'], title: 'MCE · 合同执行', color: '#10b981', icon: '🟢' },
];

export default function LtcKanban() {
  const { pipelines } = useDataStore();
  const [formOpen, setFormOpen] = React.useState(false);
  const [editItem, setEditItem] = React.useState<string | null>(null);

  return (
    <div>
      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditItem(null); setFormOpen(true); }}>新建管线</Button>
      </div>
      <Row gutter={[20, 20]}>
        {COLUMNS.map(col => {
          const items = pipelines.filter(p => col.stages.includes(p.stage));
          return (
            <Col xs={24} md={8} key={col.title}>
              <Card title={<span>{col.icon} {col.title} <Tag style={{ marginLeft: 8 }}>{items.length}</Tag></span>}
                size="small" style={{ background: '#fafafa', minHeight: 300 }}>
                {items.length === 0 ? <div style={{ textAlign: 'center', color: '#999', padding: 24 }}>暂无管线</div> :
                  items.map(p => (
                    <Card key={p.id} size="small" hoverable style={{ marginBottom: 12, borderLeft: `3px solid ${col.color}` }}
                      onClick={() => { setEditItem(p.id); setFormOpen(true); }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
                        {p.manager} · ¥{(p.amount || 0).toLocaleString()}万
                      </div>
                      <Space size={4}>
                        <Tag color={STAGE_COLORS[p.stage]}>{STAGE_MAP[p.stage]}</Tag>
                        {['contract', 'delivery', 'cash'].includes(p.stage) && (
                          <Progress percent={p.stage === 'cash' ? 100 : p.stage === 'delivery' ? 70 : 40}
                            size="small" style={{ width: 80, marginBottom: 0 }} />
                        )}
                      </Space>
                    </Card>
                  ))}
              </Card>
            </Col>
          );
        })}
      </Row>
      <PipelineForm open={formOpen} editId={editItem} onClose={() => setFormOpen(false)} />
    </div>
  );
}

import React from 'react';
