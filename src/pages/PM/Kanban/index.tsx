import { Card, Tag, Progress, Row, Col, Button, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useDataStore } from '../../../store/useDataStore';
import { PM_STAGE_MAP, type ProjectStage } from '../../../types';
import { useState } from 'react';
import ProjectForm from '../Projects/Form';

const COLUMNS: { stage: ProjectStage; title: string; color: string }[] = [
  { stage: 'execution', title: '🟢 进行中', color: '#10b981' },
  { stage: 'initiation', title: '🔵 立项中', color: '#6366f1' },
  { stage: 'closing', title: '✅ 已完成', color: '#6b7280' },
];

export default function PmKanban() {
  const { projects } = useDataStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  return (
    <div>
      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditId(null); setFormOpen(true); }}>新建项目</Button>
      </div>
      <Row gutter={[20, 20]}>
        {COLUMNS.map(col => {
          const items = projects.filter(p => p.stage === col.stage);
          return (
            <Col xs={24} md={8} key={col.stage}>
              <Card title={<span>{col.title} <Tag>{items.length}</Tag></span>} size="small" style={{ background: '#fafafa', minHeight: 300 }}>
                {items.length === 0 ? <div style={{ textAlign: 'center', color: '#999', padding: 24 }}>暂无项目</div> :
                  items.map(p => (
                    <Card key={p.id} size="small" hoverable style={{ marginBottom: 12, borderLeft: `3px solid ${col.color}` }}
                      onClick={() => { setEditId(p.id); setFormOpen(true); }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
                        {p.manager} · ¥{(p.amount || 0).toLocaleString()}万
                      </div>
                      <Space size={4}>
                        <Tag color={p.status === 'active' ? 'green' : p.status === 'completed' ? 'default' : 'blue'}>
                          {p.status === 'active' ? '进行中' : p.status === 'completed' ? '已完成' : p.status}
                        </Tag>
                        {p.stage === 'execution' && (
                          <>
                            <Progress percent={p.progress} size="small" style={{ width: 80 }} />
                            <span style={{ fontSize: 11, color: '#999' }}>{p.expectedEnd} 完成</span>
                          </>
                        )}
                      </Space>
                    </Card>
                  ))}
              </Card>
            </Col>
          );
        })}
      </Row>
      <ProjectForm open={formOpen} editId={editId} onClose={() => setFormOpen(false)} />
    </div>
  );
}
