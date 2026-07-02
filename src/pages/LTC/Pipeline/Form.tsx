import { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, InputNumber, message, Button, Space } from 'antd';
import { STAGE_MAP, STAGE_ORDER, PRODUCT_MAP, INDUSTRY_MAP } from '../../../types';
import {
  createPipeline,
  updatePipeline,
  type Pipeline,
  type PipelineSaveDTO,
} from '../../../api/pipeline';

interface Props {
  open: boolean;
  editItem: Pipeline | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PipelineForm({ open, editItem, onClose, onSuccess }: Props) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const isEdit = !!editItem;

  useEffect(() => {
    if (!open) {
      form.resetFields();
      return;
    }
    if (editItem) {
      form.setFieldsValue(editItem);
    } else {
      form.setFieldsValue({
        stage: 'lead',
        product: 'ai_content',
        industry: 'tech',
        amount: 0,
        winRate: 30,
        priority: 'normal',
        source: '主动拓展',
      });
    }
  }, [open, editItem, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const dto: PipelineSaveDTO = {
        name: values.name,
        stage: values.stage,
        client: values.client,
        product: values.product,
        industry: values.industry,
        amount: values.amount,
        winRate: values.winRate,
        priority: values.priority,
        manager: values.manager,
        source: values.source,
        description: values.description || '',
        nextAction: values.nextAction || '',
      };

      setSubmitting(true);
      if (editItem) {
        await updatePipeline(editItem.id, dto);
        message.success('管线已更新');
      } else {
        await createPipeline(dto);
        message.success('管线已创建');
      }
      onSuccess();
    } catch {
      // 表单校验失败或接口报错，统一走全局拦截器
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={isEdit ? '编辑管线' : '新建管线'}
      open={open}
      onCancel={onClose}
      width={720}
      destroyOnHidden
      footer={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" loading={submitting} onClick={handleSubmit}>
            {isEdit ? '保存修改' : '确认创建'}
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0 16px',
          }}
        >
          <Form.Item
            name="name"
            label="管线名称"
            rules={[{ required: true, message: '请输入管线名称' }]}
          >
            <Input placeholder="输入管线名称" />
          </Form.Item>

          <Form.Item name="client" label="客户">
            <Input placeholder="客户名称" />
          </Form.Item>

          <Form.Item name="product" label="产品线">
            <Select
              options={Object.entries(PRODUCT_MAP).map(([k, v]) => ({
                value: k,
                label: v,
              }))}
            />
          </Form.Item>

          <Form.Item name="industry" label="行业">
            <Select
              options={Object.entries(INDUSTRY_MAP).map(([k, v]) => ({
                value: k,
                label: v,
              }))}
            />
          </Form.Item>

          <Form.Item name="stage" label="阶段">
            <Select
              options={STAGE_ORDER.filter((s) => s !== 'closed').map((s) => ({
                value: s,
                label: STAGE_MAP[s],
              }))}
            />
          </Form.Item>

          <Form.Item name="amount" label="金额(万)">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="winRate" label="赢单率(%)">
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="priority" label="优先级">
            <Select
              options={[
                { value: 'urgent', label: '紧急' },
                { value: 'high', label: '高' },
                { value: 'normal', label: '正常' },
                { value: 'low', label: '低' },
              ]}
            />
          </Form.Item>

          <Form.Item name="manager" label="负责人">
            <Input placeholder="负责人姓名" />
          </Form.Item>

          <Form.Item name="source" label="来源">
            <Select
              options={[
                { value: '主动拓展', label: '主动拓展' },
                { value: '老客户续签', label: '老客户续签' },
                { value: '招投标', label: '招投标' },
                { value: '合作伙伴推荐', label: '合作伙伴推荐' },
              ]}
            />
          </Form.Item>
        </div>

        <Form.Item name="description" label="描述">
          <Input.TextArea rows={2} placeholder="管线描述" />
        </Form.Item>

        <Form.Item name="nextAction" label="下一步行动">
          <Input placeholder="下一步行动计划" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
