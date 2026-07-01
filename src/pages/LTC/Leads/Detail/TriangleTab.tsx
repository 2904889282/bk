import { Card, Row, Col, Tag } from 'antd';
import type { ClueVO } from '../../../../api/clue';

const ROLE_CONFIG: Record<string, { title: string; color: string; icon: string; responsibility: string }> = {
  AR: { title: '客户经理 (AR)', color: '#6366f1', icon: '👤', responsibility: '负责客户关系维护、商务谈判、合同签订' },
  SR: { title: '方案经理 (SR)', color: '#10b981', icon: '📋', responsibility: '负责方案设计、技术选型、需求澄清' },
  FR: { title: '交付经理 (FR)', color: '#f59e0b', icon: '🚀', responsibility: '负责项目交付实施、进度管控、质量保障' },
};

interface Props {
  clueData: ClueVO;
}

/** 从 ClueVO 中读取 AR/SR/FR 的 userId（无名称时展示 ID） */
export default function TriangleTab({ clueData }: Props) {
  const members = [
    { role: 'AR' as const, userId: clueData.arUserId },
    { role: 'SR' as const, userId: clueData.srUserId },
    { role: 'FR' as const, userId: clueData.frUserId },
  ];

  return (
    <div>
      <Row gutter={[16, 16]}>
        {members.map(({ role, userId }) => {
          const cfg = ROLE_CONFIG[role];
          return (
            <Col xs={24} md={8} key={role}>
              <Card
                title={<span>{cfg.icon} {cfg.title}</span>}
                style={{ borderTop: `3px solid ${cfg.color}` }}
              >
                <div style={{ color: '#666', fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
                  {cfg.responsibility}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Tag color={cfg.color}>负责人</Tag>
                  <strong>{userId ? `用户 #${userId}` : '-'}</strong>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
}
