import { Modal, Form, Input, Select, DatePicker, message } from 'antd';
import { useLeadStore, LEAD_FIELDS, type Lead } from '../../../../store/useLeadStore';
import dayjs from 'dayjs';

interface Props { open: boolean; onClose: () => void; onCreated: () => void; }

export default function LeadCreateModal({ open, onClose, onCreated }: Props) {
  const [form] = Form.useForm();
  const { add } = useLeadStore();

  const handleOk = async () => {
    try {
      const vals = await form.validateFields();
      const data: Omit<Lead, 'id'> = {
        name: vals.name || '',
        company: vals.company || '',
        department: vals.department || '',
        contact: vals.contact || '',
        owner: vals.owner || '',
        budget: vals.budget || '',
        requirements: vals.requirements || '',
        status: '待跟进',
        contactDate: vals.contactDate ? dayjs(vals.contactDate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        proposalDate: '',
        evaluation: vals.evaluation || '',
        projectLevel: vals.projectLevel || '',
        notes: vals.notes || '',
        dept: vals.dept || '',
        reviewStatus: '待评审',
        confirmedBiz: '',
        commRecord1: '', commRecord2: '', commRecord3: '', commRecord4: '',
        createdAt: dayjs().format('YYYY-MM-DD'),
        relation1: '', relation2: '', relation3: '',
      };
      add(data);
      message.success('线索已创建');
      form.resetFields();
      onCreated();
      onClose();
    } catch {}
  };

  return (
    <Modal title="新建线索" open={open} onCancel={() => { form.resetFields(); onClose(); }}
      onOk={handleOk} width={640} destroyOnClose>
      <Form form={form} layout="vertical">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <Form.Item name="name" label="线索名称" rules={[{ required: true, message: '请输入线索名称' }]}>
            <Input placeholder="输入线索名称" />
          </Form.Item>
          <Form.Item name="company" label="甲方公司" rules={[{ required: true, message: '请输入甲方公司' }]}>
            <Input placeholder="甲方公司名称" />
          </Form.Item>
          <Form.Item name="department" label="甲方部门">
            <Input placeholder="甲方部门" />
          </Form.Item>
          <Form.Item name="contact" label="甲方对接人">
            <Input placeholder="对接人姓名" />
          </Form.Item>
          <Form.Item name="owner" label="承接人" rules={[{ required: true, message: '请输入承接人' }]}>
            <Input placeholder="承接人姓名" />
          </Form.Item>
          <Form.Item name="dept" label="承接部门">
            <Input placeholder="承接部门" />
          </Form.Item>
          <Form.Item name="budget" label="预算量级">
            <Select options={(LEAD_FIELDS.find((f: { key: string }) => f.key === 'budget')?.options || []).map((v: string) => ({ value: v, label: v }))} placeholder="选择预算" />
          </Form.Item>
          <Form.Item name="projectLevel" label="项目等级">
            <Select options={['S', 'A', 'B', 'C'].map(v => ({ value: v, label: v }))} placeholder="选择等级" />
          </Form.Item>
          <Form.Item name="evaluation" label="线索评价">
            <Select options={['高价值', '中等价值', '低价值'].map(v => ({ value: v, label: v }))} placeholder="选择评价" />
          </Form.Item>
          <Form.Item name="contactDate" label="接触日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </div>
        <Form.Item name="requirements" label="需求说明">
          <Input.TextArea rows={3} placeholder="描述线索需求详情" />
        </Form.Item>
        <Form.Item name="notes" label="备注">
          <Input.TextArea rows={2} placeholder="其他备注信息" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
