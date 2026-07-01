import { Modal, Form, Input, Select, InputNumber, DatePicker, message } from 'antd';
import { useEffect } from 'react';
import { useDataStore } from '../../../store/useDataStore';
import { PM_STAGE_MAP, type Project } from '../../../types';
import dayjs from 'dayjs';

interface Props { open: boolean; editId: string | null; onClose: () => void; }

export default function ProjectForm({ open, editId, onClose }: Props) {
  const [form] = Form.useForm();
  const { projects, addProject, updateProject } = useDataStore();

  useEffect(() => {
    if (!open) { form.resetFields(); return; }
    if (editId) {
      const p = projects.find(x => x.id === editId);
      if (p) form.setFieldsValue({ ...p, startDate: p.startDate ? dayjs(p.startDate) : null, expectedEnd: p.expectedEnd ? dayjs(p.expectedEnd) : null });
    } else {
      form.setFieldsValue({ stage: 'initiation', amount: 0, progress: 0, status: 'active', startDate: dayjs() });
    }
  }, [open, editId]);

  const onFinish = (values: Record<string, unknown>) => {
    const data = { ...values, startDate: values.startDate ? dayjs(values.startDate as string).format('YYYY-MM-DD') : '', expectedEnd: values.expectedEnd ? dayjs(values.expectedEnd as string).format('YYYY-MM-DD') : '' };
    if (editId) { updateProject(editId, data as Partial<Project>); message.success('项目已更新'); }
    else { addProject(data as unknown as Omit<Project, 'id'>); message.success('项目已创建'); }
    onClose();
  };

  return (
    <Modal title={editId ? '编辑项目' : '新建项目'} open={open} onCancel={onClose}
      onOk={async () => {
        try { const values = await form.validateFields(); onFinish(values); } catch {}
      }} width={640} destroyOnClose>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <Form.Item name="name" label="项目名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="manager" label="项目经理"><Input /></Form.Item>
          <Form.Item name="client" label="客户"><Input /></Form.Item>
          <Form.Item name="amount" label="金额(万)"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="progress" label="进度(%)"><InputNumber min={0} max={100} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="stage" label="阶段"><Select options={Object.entries(PM_STAGE_MAP).map(([k, v]) => ({ value: k, label: v }))} /></Form.Item>
          <Form.Item name="startDate" label="开始日期"><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="expectedEnd" label="预计完成"><DatePicker style={{ width: '100%' }} /></Form.Item>
        </div>
        <Form.Item name="description" label="描述"><Input.TextArea rows={2} /></Form.Item>
      </Form>
    </Modal>
  );
}
