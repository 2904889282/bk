import { useState } from 'react';
import {
  Row, Col, Typography, Space, Tag, Button, Modal, Form, Input,
  Select, DatePicker, App,
} from 'antd';
import {
  AimOutlined, ProjectOutlined, FolderOpenOutlined, TeamOutlined,
  ArrowRightOutlined, PlusOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../store/useTheme';
import { createClue, type ClueSaveDTO } from '../../api/clue';
import { createProject } from '../../api/project';

const { Text } = Typography;

// ============================================================
// STATS 静态占位数据 — TODO: replace with API data
// ============================================================
const STATS = {
  leads: { pending: 12, following: 8, signed: 5 },
  projects: { active: 36, newThisMonth: 12 },
  resources: { docs: 256, templates: 48 },
  talent: { idle: 15, inProject: 28, borrowable: 5 },
} as const;

// ============================================================
// 卡片配置
// ============================================================
interface CardConfig {
  icon: React.ReactNode;
  title: string;
  color: string;
  path: string;
  description: string;
  tags: { label: string; color: string }[];
}

const CARDS: CardConfig[] = [
  {
    icon: <AimOutlined />, title: '线索管理', color: '#1677ff', path: '/ltc/leads',
    description: '从发现到签约，全生命周期追踪',
    tags: [
      { label: `待跟进 ${STATS.leads.pending}`, color: 'blue' },
      { label: `跟进中 ${STATS.leads.following}`, color: 'orange' },
      { label: `已签约 ${STATS.leads.signed}`, color: 'green' },
    ],
  },
  {
    icon: <ProjectOutlined />, title: '项目管理', color: '#52c41a', path: '/pm/projects',
    description: '项目看板、甘特图、里程碑',
    tags: [
      { label: `进行中 ${STATS.projects.active}`, color: 'green' },
      { label: `本月新立项 ${STATS.projects.newThisMonth}`, color: 'cyan' },
    ],
  },
  {
    icon: <FolderOpenOutlined />, title: '资源库', color: '#faad14', path: '/resources',
    description: '知识库、案例库、文档模板',
    tags: [
      { label: `文档 ${STATS.resources.docs}`, color: 'gold' },
      { label: `模板 ${STATS.resources.templates}`, color: 'orange' },
    ],
  },
  {
    icon: <TeamOutlined />, title: '人才库', color: '#722ed1', path: '/pm/talent',
    description: '内部人才盘点与技能图谱',
    tags: [
      { label: `空闲 ${STATS.talent.idle}`, color: 'green' },
      { label: `项目中 ${STATS.talent.inProject}`, color: 'blue' },
      { label: `可借调 ${STATS.talent.borrowable}`, color: 'purple' },
    ],
  },
];

// ============================================================
// ModuleCard — 可点击入口卡片
// ============================================================
function ModuleCard({ config, isDark, index }: { config: CardConfig; isDark: boolean; index: number }) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();

  const bg = isDark ? '#1e293b' : '#fff';
  const border = isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)';

  return (
    <div
      onClick={() => navigate(config.path)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '28px 32px',
        borderRadius: 12,
        border,
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        boxShadow: hovered ? (isDark ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.08)') : 'none',
        background: bg,
        height: 168,
        display: 'flex',
        flexDirection: 'column',
        animation: `portalCardIn 400ms ease-out ${index * 80}ms forwards`,
        ...(hovered ? { transform: 'translateY(-2px)' } : {}),
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `${config.color}15`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 17, color: config.color,
          }}>
            {config.icon}
          </div>
          <Text strong style={{ fontSize: 15 }}>{config.title}</Text>
        </div>
        <span style={{ transition: 'transform 0.2s ease', transform: hovered ? 'translateX(4px)' : 'none' }}>
          <ArrowRightOutlined style={{ color: isDark ? '#64748b' : '#bfbfbf', fontSize: 12 }} />
        </span>
      </div>
      <Text type="secondary" style={{ fontSize: 12, marginTop: 8, flex: 'none' }}>
        {config.description}
      </Text>
      <div style={{ height: 1, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', margin: '16px 0 12px' }} />
      <Space size={4} wrap>
        {config.tags.map(t => (
          <Tag key={t.label} color={t.color} style={{ fontSize: 12, margin: 0 }}>
            {t.label}
          </Tag>
        ))}
      </Space>
    </div>
  );
}

// ============================================================
// QuickAddClueModal
// ============================================================
function QuickAddClueModal({
  open, onClose,
}: {
  open: boolean; onClose: () => void;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const dto: ClueSaveDTO = {
        clueName: values.clueName,
        clientCompany: values.clientCompany,
        clientContact: values.clientContact,
        beikeOwner: values.beikeOwner,
        budget: values.budget,
        clueLevel: values.clueLevel,
        clueStatus: values.clueStatus || '待跟进',
        deptBelong: values.deptBelong || '技术部',
        requirementDesc: values.requirementDesc,
        createDate: values.createDate ? values.createDate.format('YYYY-MM-DD') : undefined,
      };
      await createClue(dto);
      message.success('线索已提交，可在线索管理中查看');
      form.resetFields();
      onClose();
    } catch { /* validation failed */ }
    finally { setSubmitting(false); }
  };

  return (
    <Modal title="新增业务线索" open={open} onCancel={onClose}
      onOk={handleSubmit} confirmLoading={submitting} width={640} destroyOnClose
      okText="提交" cancelText="取消">
      <Form form={form} layout="vertical">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <Form.Item name="clueName" label="线索名称" rules={[{ required: true, message: '请输入线索名称' }]}>
            <Input placeholder="如：XX公司AI内容生产项目" />
          </Form.Item>
          <Form.Item name="clientCompany" label="甲方公司" rules={[{ required: true, message: '请输入甲方公司' }]}>
            <Input placeholder="如：腾讯科技" />
          </Form.Item>
          <Form.Item name="clientContact" label="甲方对接人">
            <Input placeholder="联系人姓名" />
          </Form.Item>
          <Form.Item name="beikeOwner" label="乙方承接人" rules={[{ required: true, message: '请输入承接人' }]}>
            <Input placeholder="如：张明" />
          </Form.Item>
          <Form.Item name="clueLevel" label="预计项目等级" initialValue="B">
            <Select options={[
              { value: 'S', label: 'S 级' }, { value: 'A', label: 'A 级' },
              { value: 'B', label: 'B 级' }, { value: 'C', label: 'C 级' },
            ]} />
          </Form.Item>
          <Form.Item name="clueStatus" label="线索状态" initialValue="待跟进">
            <Select options={[
              { value: '待跟进', label: '待跟进' }, { value: '跟进中', label: '跟进中' },
              { value: '已提案', label: '已提案' }, { value: '已签约', label: '已签约' },
            ]} />
          </Form.Item>
          <Form.Item name="budget" label="预算量级">
            <Select placeholder="选择预算范围" options={[
              { value: '＜10万', label: '＜10万' }, { value: '10-50万', label: '10-50万' },
              { value: '50-100万', label: '50-100万' }, { value: '100-500万', label: '100-500万' },
              { value: '＞500万', label: '＞500万' },
            ]} />
          </Form.Item>
          <Form.Item name="deptBelong" label="承接部门" initialValue="技术部">
            <Input placeholder="如：技术部" />
          </Form.Item>
          <Form.Item name="createDate" label="留痕日期">
            <DatePicker style={{ width: '100%' }} placeholder="选择日期" />
          </Form.Item>
        </div>
        <Form.Item name="requirementDesc" label="需求说明">
          <Input.TextArea rows={3} placeholder="简要描述线索需求..." />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ============================================================
// QuickAddProjectModal
// ============================================================
const BUDGET_AMOUNT_MAP: Record<string, number> = {
  '＜10万': 50000,
  '10-50万': 300000,
  '50-100万': 750000,
  '100-500万': 3000000,
  '＞500万': 5000000,
};

function QuickAddProjectModal({
  open, onClose,
}: {
  open: boolean; onClose: () => void;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await createProject({
        projectName: values.projectName,
        clientCompany: values.clientCompany,
        projectManager: values.projectManager,
        projectAmount: BUDGET_AMOUNT_MAP[values.budget] || 0,
        projectLevel: 'B',
        projectStatus: '进行中',
        deptBelong: '技术部',
        startDate: values.startDate ? values.startDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        remark: values.remark,
      });
      message.success('项目已创建，可在项目列表中查看');
      form.resetFields();
      onClose();
    } catch { /* validation failed */ }
    finally { setSubmitting(false); }
  };

  return (
    <Modal title="新建项目" open={open} onCancel={onClose}
      onOk={handleSubmit} confirmLoading={submitting} width={640} destroyOnClose
      okText="提交" cancelText="取消">
      <Form form={form} layout="vertical">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <Form.Item name="projectName" label="项目名称" rules={[{ required: true, message: '请输入项目名称' }]}>
            <Input placeholder="如：贝壳CRM升级项目" />
          </Form.Item>
          <Form.Item name="clientCompany" label="甲方公司" rules={[{ required: true, message: '请输入甲方公司' }]}>
            <Input placeholder="如：腾讯科技" />
          </Form.Item>
          <Form.Item name="budget" label="项目预算">
            <Select placeholder="选择预算范围" options={[
              { value: '＜10万', label: '＜10万' }, { value: '10-50万', label: '10-50万' },
              { value: '50-100万', label: '50-100万' }, { value: '100-500万', label: '100-500万' },
              { value: '＞500万', label: '＞500万' },
            ]} />
          </Form.Item>
          <Form.Item name="projectManager" label="负责人" rules={[{ required: true, message: '请输入负责人' }]}>
            <Input placeholder="如：张明" />
          </Form.Item>
          <Form.Item name="startDate" label="开始日期">
            <DatePicker style={{ width: '100%' }} placeholder="选择日期" />
          </Form.Item>
        </div>
        <Form.Item name="remark" label="项目描述">
          <Input.TextArea rows={3} placeholder="简要描述项目背景与目标..." />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ============================================================
// 操作按钮
// ============================================================
function ActionButton({
  label, color, onClick,
}: {
  label: string; color: string; onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Button
      block
      type="dashed"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        height: 56,
        fontSize: 14,
        borderColor: hovered ? color : undefined,
        borderStyle: hovered ? 'solid' : 'dashed',
        background: hovered ? `${color}14` : undefined,
        transition: 'border-color 0.2s ease, border-style 0.2s ease, background 0.2s ease',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}
    >
      <span style={{
        width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0,
      }} />
      <PlusOutlined />
      {label}
    </Button>
  );
}

// ============================================================
// PortalPage — 主组件
// ============================================================
export default function PortalPage() {
  const user = useAuth(s => s.user);
  const isDark = useTheme(s => s.isDark);
  const [clueModalOpen, setClueModalOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 4px' }}>
      <style>{`
        @keyframes portalCardIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {/* 页头 */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 28,
      }}>
        <Text strong style={{ fontSize: 16 }}>欢迎回来，{user?.name || ''}</Text>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {dayjs().format('YYYY年MM月DD日 dddd')}
        </Text>
      </div>

      {/* 模块卡片 2×2 网格 */}
      <Row gutter={[16, 16]}>
        {CARDS.map((card, i) => (
          <Col xs={24} sm={12} key={card.path}>
            <ModuleCard config={card} isDark={isDark} index={i} />
          </Col>
        ))}
      </Row>

      {/* 操作按钮 */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12}>
          <ActionButton label="快速添加线索" color="#1677ff" onClick={() => setClueModalOpen(true)} />
        </Col>
        <Col xs={24} sm={12}>
          <ActionButton label="新建项目" color="#52c41a" onClick={() => setProjectModalOpen(true)} />
        </Col>
      </Row>

      {/* Modal */}
      <QuickAddClueModal open={clueModalOpen} onClose={() => setClueModalOpen(false)} />
      <QuickAddProjectModal open={projectModalOpen} onClose={() => setProjectModalOpen(false)} />
    </div>
  );
}
