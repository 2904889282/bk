import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Typography, Skeleton, Modal, Form, Input, Select, DatePicker, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { FundOutlined, ProjectOutlined, TeamOutlined, AlertOutlined, RightOutlined, PlusOutlined } from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth';
import { fetchPipelineList } from '../../api/pipeline';
import { fetchProjectPage } from '../../api/project';
import { createClue, type ClueSaveDTO } from '../../api/clue';

const { Title, Paragraph } = Typography;

function CountUp({ end }: { end: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const step = Math.max(Math.ceil(end / 40), 1);
    const timer = setInterval(() => setVal(c => { const n = c + step; return n >= end ? end : n; }), 25);
    return () => clearInterval(timer);
  }, [end]);
  return <span>{val}</span>;
}

export default function PortalPage() {
  const user = useAuth(s => s.user);
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);
  const [activePipelines, setActivePipelines] = useState(0);
  const [projectsTotal, setProjectsTotal] = useState(0);

  // 线索填写模态框
  const [clueModalOpen, setClueModalOpen] = useState(false);
  const [clueSubmitting, setClueSubmitting] = useState(false);
  const [clueForm] = Form.useForm();

  const handleClueSubmit = async () => {
    try {
      const values = await clueForm.validateFields();
      setClueSubmitting(true);
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
      clueForm.resetFields();
      setClueModalOpen(false);
    } catch {
      /* validation failed */
    } finally {
      setClueSubmitting(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [pipeData, projData] = await Promise.all([
          fetchPipelineList(),
          fetchProjectPage({ pageNum: 1, pageSize: 1 }),
        ]);
        const pipes = Array.isArray(pipeData) ? pipeData : [];
        setActivePipelines(pipes.filter(p => !['closed'].includes(p.stage)).length);
        setProjectsTotal(projData.total ?? 0);
      } catch {
        // 接口不可用时保持为0
      }
      setTimeout(() => setLoaded(true), 200);
    };
    load();
  }, []);

  const cards = [
    { title: '线索管理', value: activePipelines, color: '#6366f1', path: '/ltc/kanban' },
    { title: '重点项目', value: projectsTotal, color: '#8b5cf6', path: '/pm/kanban' },
    { title: '人才资源', value: 0, color: '#10b981', path: '/pm/talent' },
    { title: '预警待处理', value: 0, color: '#f59e0b', path: '/ltc/alerts' },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 0' }}>
      <div style={{ marginBottom: 40 }}>
        <Title level={2} style={{ marginBottom: 4 }}>👋 欢迎回来，{user?.name}</Title>
        <Paragraph type="secondary">LTC 管线管理与重点项目管理系统双轮驱动 · 数据填报入口</Paragraph>
      </div>

      {!loaded ? (
        <Row gutter={[20, 20]} style={{ marginBottom: 48 }}>
          {[1,2,3,4].map(i => <Col xs={12} sm={6} key={i}><Card><Skeleton active paragraph={{ rows: 1 }} /></Card></Col>)}
        </Row>
      ) : (
        <Row gutter={[18, 18]} style={{ marginBottom: 48 }}>
          {cards.map((c, i) => (
            <Col xs={12} sm={6} key={i}>
              <Card hoverable onClick={() => navigate(c.path)}
                style={{ cursor: 'pointer' }}>
                <Statistic title={c.title}
                  valueRender={() => <span style={{ fontSize: 36, fontWeight: 800, color: c.color }}><CountUp end={c.value} /></span>} />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Title level={4} style={{ marginBottom: 20 }}>⚡ 快捷入口</Title>
      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card hoverable onClick={() => setClueModalOpen(true)}
            style={{ cursor: 'pointer', borderTop: '3px solid #6366f1' }}
            actions={[<PlusOutlined key="add" style={{ color: '#6366f1' }} />]}>
            <Card.Meta avatar={<FundOutlined style={{ fontSize: 28, color: '#6366f1' }} />}
              title="线索填写"
              description="快速录入新线索。填写后数据将自动进入线索管理，支持后续跟进与流转。" />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card hoverable onClick={() => navigate('/pm/kanban')}
            style={{ cursor: 'pointer', borderTop: '3px solid #06b6d4' }}
            actions={[<RightOutlined key="go" style={{ color: '#06b6d4' }} />]}>
            <Card.Meta avatar={<ProjectOutlined style={{ fontSize: 28, color: '#06b6d4' }} />}
              title="重点项目管理系统"
              description="项目全生命周期管理。立项→执行→交付，支持完整CRUD操作。" />
          </Card>
        </Col>
      </Row>

      <Modal title="新增线索" open={clueModalOpen} onCancel={() => setClueModalOpen(false)}
        onOk={handleClueSubmit} confirmLoading={clueSubmitting} width={640} destroyOnHidden
        okText="提交线索" cancelText="取消">
        <Form form={clueForm} layout="vertical">
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
    </div>
  );
}
