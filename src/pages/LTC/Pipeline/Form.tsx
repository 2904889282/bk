import { Modal, Form, Input, Select, InputNumber, message, Button, Space } from 'antd';
import { useEffect } from 'react';
import { useDataStore } from '../../../store/useDataStore';
import { STAGE_MAP, STAGE_ORDER, PRODUCT_MAP, INDUSTRY_MAP, type Pipeline } from '../../../types';
import Permission from '../../../components/auth/Permission';

interface Props { open: boolean; editId: string | null; onClose: () => void; onImportClick?: () => void; }

export default function PipelineForm({ open, editId, onClose, onImportClick }: Props) {
  const [form] = Form.useForm();
  const { pipelines, addPipeline, updatePipeline } = useDataStore();

  useEffect(() => {
    if (!open) { form.resetFields(); return; }
    if (editId) {
      const p = pipelines.find(x => x.id === editId);
      if (p) form.setFieldsValue(p);
    } else {
      form.setFieldsValue({ stage: 'lead', product: 'ai_content', industry: 'tech', amount: 0, winRate: 30, priority: 'normal', source: '主动拓展' });
    }
  }, [open, editId]);

  const onFinish = (values: Record<string, unknown>) => {
    if (editId) { updatePipeline(editId, values as Partial<Pipeline>); message.success('管线已更新'); }
    else { addPipeline(values as unknown as Omit<Pipeline, 'id' | 'createdAt' | 'updatedAt'>); message.success('管线已创建'); }
    onClose();
  };

  const handleOk = async () => {
    try { const values = await form.validateFields(); onFinish(values); } catch {}
  };

  return (
    <Modal title={editId ? '编辑管线' : '新建管线'} open={open} onCancel={onClose}
      width={720} destroyOnClose
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {!editId && (
              <Permission code="pipeline:import">
                <Button type="link" icon={<span>📥</span>} onClick={() => { onClose(); onImportClick?.(); }}>
                  批量导入Excel
                </Button>
              </Permission>
            )}
          </div>
          <Space>
            <Button onClick={onClose}>取消</Button>
            <Button type="primary" onClick={handleOk}>确定</Button>
          </Space>
        </div>
      }>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <Form.Item name="name" label="项目名称" rules={[{ required: true, message: '请输入' }]}>
            <Input placeholder="输入项目名称" />
          </Form.Item>
          <Form.Item name="client" label="客户"><Input placeholder="客户名称" /></Form.Item>
          <Form.Item name="product" label="产品线"><Select options={Object.entries(PRODUCT_MAP).map(([k, v]) => ({ value: k, label: v }))} /></Form.Item>
          <Form.Item name="industry" label="行业"><Select options={Object.entries(INDUSTRY_MAP).map(([k, v]) => ({ value: k, label: v }))} /></Form.Item>
          <Form.Item name="stage" label="阶段"><Select options={STAGE_ORDER.filter(s => s !== 'closed').map(s => ({ value: s, label: STAGE_MAP[s] }))} /></Form.Item>
          <Form.Item name="amount" label="金额(万)"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="winRate" label="赢单率(%)"><InputNumber min={0} max={100} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="priority" label="优先级"><Select options={[{ value: 'urgent', label: '🔴 紧急' }, { value: 'high', label: '🟠 高' }, { value: 'normal', label: '🟢 正常' }, { value: 'low', label: '⚪ 低' }]} /></Form.Item>
          <Form.Item name="manager" label="负责人"><Input placeholder="负责人姓名" /></Form.Item>
          <Form.Item name="source" label="来源"><Select options={['主动拓展', '老客户续签', '招投标', '合作伙伴推荐'].map(v => ({ value: v, label: v }))} /></Form.Item>
        </div>
        <Form.Item name="description" label="描述"><Input.TextArea rows={2} placeholder="项目描述" /></Form.Item>
        <Form.Item name="nextAction" label="下一步行动"><Input placeholder="下一步行动计划" /></Form.Item>
      </Form>
    </Modal>
  );
}
