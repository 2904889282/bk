import { useEffect, useState } from 'react';
import { Card, Tag, Progress, Row, Col, Button, Space, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import PipelineForm from '../../../features/pipeline/PipelineForm';
import type { Pipeline } from '../../../api/pipeline';
import { fetchPipelineList } from '../../../api/pipeline';
import {
  getPipelineStageColor,
  getPipelineStageLabel,
  getPipelineStageProgress,
  normalizePipelineStage,
  type PipelineStage,
} from '../../../utils/stageMapping';

const { Title } = Typography;

interface KanbanColumn {
  stages: PipelineStage[];
  title: string;
  color: string;
  icon: string;
}

const COLUMNS: KanbanColumn[] = [
  {
    stages: ['lead', 'verify'],
    title: 'ML · 线索管理',
    color: '#6366f1',
    icon: '🟣',
  },
  {
    stages: ['opportunity'],
    title: 'MO · 机会点管理',
    color: '#f59e0b',
    icon: '🟠',
  },
  {
    stages: ['contract', 'delivery', 'cash'],
    title: 'MCE · 合同执行',
    color: '#10b981',
    icon: '🟢',
  },
];

export default function LtcKanban() {
  const [list, setList] = useState<Pipeline[]>([]);
  const [, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Pipeline | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchPipelineList();
      setList(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getColumnItems = (stages: PipelineStage[]) =>
    list.filter((p) => stages.includes(normalizePipelineStage(p.stage)));

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={5} style={{ margin: 0 }}>
          线索 {list.length > 0 ? <Tag style={{ marginLeft: 8 }}>{list.length}</Tag> : null}
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditItem(null);
            setFormOpen(true);
          }}
        >
          新建线索
        </Button>
      </div>

      <Row gutter={[20, 20]}>
        {COLUMNS.map((col) => {
          const items = getColumnItems(col.stages);
          return (
            <Col xs={24} md={8} key={col.title}>
              <Card
                title={
                  <span>
                    {col.icon} {col.title}
                    <Tag style={{ marginLeft: 8 }}>{items.length}</Tag>
                  </span>
                }
                size="small"
                style={{ background: '#fafafa', minHeight: 300 }}
              >
                {items.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#999', padding: 24 }}>
                    暂无线索
                  </div>
                ) : (
                  items.map((p) => (
                    <Card
                      key={p.id}
                      size="small"
                      hoverable
                      style={{
                        marginBottom: 12,
                        borderLeft: `3px solid ${col.color}`,
                      }}
                      onClick={() => {
                        setEditItem(p);
                        setFormOpen(true);
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>
                        {p.name}
                      </div>
                      <div
                        style={{ fontSize: 12, color: '#888', marginBottom: 8 }}
                      >
                        {p.manager} · ¥{(p.amount || 0).toLocaleString()}万
                      </div>
                      <Space size={4}>
                        <Tag color={getPipelineStageColor(p.stage)}>
                          {getPipelineStageLabel(p.stage)}
                        </Tag>
                        <Progress
                          percent={getPipelineStageProgress(p.stage)}
                          size="small"
                          style={{ width: 80, margin: 0 }}
                        />
                      </Space>
                    </Card>
                  ))
                )}
              </Card>
            </Col>
          );
        })}
      </Row>

      <PipelineForm
        open={formOpen}
        editItem={editItem}
        onClose={() => setFormOpen(false)}
        onSuccess={() => {
          setFormOpen(false);
          loadData();
        }}
      />
    </div>
  );
}
