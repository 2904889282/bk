import { useEffect, useState } from 'react';
import { Card, Tag, Progress, Row, Col, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import ProjectForm from '../Projects/Form';
import { fetchProjectPage, type ProjectVO } from '../../../api/project';

const STAGE_GROUPS: { key: string; title: string; color: string; statuses: string[] }[] = [
  { key: 'active', title: '进行中', color: '#10b981', statuses: ['进行中', '暂停'] },
  { key: 'delivered', title: '已交付', color: '#6366f1', statuses: ['已交付'] },
  { key: 'closed', title: '已终止', color: '#6b7280', statuses: ['已终止'] },
];

export default function PmKanban() {
  const [projects, setProjects] = useState<ProjectVO[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchProjectPage({ pageNum: 1, pageSize: 200 });
      setProjects(res.list || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => { setEditId(null); setFormOpen(true); }}
        >
          新建项目
        </Button>
      </div>
      <Row gutter={[20, 20]}>
        {STAGE_GROUPS.map((col) => {
          const items = projects.filter((p) => col.statuses.includes(p.projectStatus));
          return (
            <Col xs={24} md={8} key={col.key}>
              <Card
                title={
                  <span>{col.title} <Tag>{items.length}</Tag></span>
                }
                size="small"
                style={{ background: '#fafafa', minHeight: 300 }}
              >
                {items.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#999', padding: 24 }}>
                    暂无项目
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
                      onClick={() => { setEditId(p.id); setFormOpen(true); }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{p.projectName}</div>
                      <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
                        {p.projectManager} · ¥{(p.projectAmount || 0).toLocaleString()}万
                      </div>
                      <Progress
                        percent={p.progress ?? 0}
                        size="small"
                        style={{ width: 80 }}
                      />
                    </Card>
                  ))
                )}
              </Card>
            </Col>
          );
        })}
      </Row>
      <ProjectForm
        open={formOpen}
        editId={editId}
        onClose={() => setFormOpen(false)}
        onSuccess={() => {
          setFormOpen(false);
          loadData();
        }}
      />
    </div>
  );
}
