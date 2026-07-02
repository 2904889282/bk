import { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, InputNumber, DatePicker, message, Button } from 'antd';
import dayjs from 'dayjs';
import {
  fetchProjectDetail,
  createProject,
  updateProject,
  type ProjectSaveDTO,
  type ProjectVO,
} from '../../../api/project';

interface Props {
  open: boolean;
  editId: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

const LEVEL_OPTIONS = ['S', 'A', 'B', 'C'];
const STATUS_OPTIONS = ['进行中', '暂停', '已交付', '已终止'];

export default function ProjectForm({ open, editId, onClose, onSuccess }: Props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 打开弹窗时：编辑模式回显数据，新建模式设置默认值
  useEffect(() => {
    if (!open) {
      form.resetFields();
      return;
    }

    if (editId) {
      setLoading(true);
      fetchProjectDetail(editId)
        .then((data: ProjectVO) => {
          form.setFieldsValue({
            ...data,
            startDate: data.startDate ? dayjs(data.startDate) : null,
            expectEndDate: data.expectEndDate ? dayjs(data.expectEndDate) : null,
          });
        })
        .catch(() => {
          message.error('获取项目详情失败');
          onClose();
        })
        .finally(() => setLoading(false));
    } else {
      form.setFieldsValue({
        projectAmount: 0,
        progress: 0,
        projectStatus: '进行中',
        projectLevel: 'B',
        startDate: dayjs(),
      });
    }
  }, [open, editId, form, onClose]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const dto: ProjectSaveDTO = {
        ...values,
        startDate: values.startDate
          ? dayjs(values.startDate).format('YYYY-MM-DD')
          : '',
        expectEndDate: values.expectEndDate
          ? dayjs(values.expectEndDate).format('YYYY-MM-DD')
          : undefined,
      };

      setSubmitting(true);
      if (editId) {
        await updateProject(editId, dto);
        message.success('项目已更新');
      } else {
        await createProject(dto);
        message.success('项目已创建');
      }
      onSuccess();
    } catch {
      // 表单校验失败或接口报错
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={editId ? '编辑项目' : '新建项目'}
      open={open}
      onCancel={onClose}
      footer={
        <Button type="primary" loading={submitting} onClick={handleSubmit}>
          {editId ? '保存修改' : '确认创建'}
        </Button>
      }
      width={640}
      destroyOnHidden
      confirmLoading={submitting}
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
            name="projectName"
            label="项目名称"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input placeholder="请输入项目名称" />
          </Form.Item>

          <Form.Item
            name="clientCompany"
            label="客户公司"
            rules={[{ required: true, message: '请输入客户公司' }]}
          >
            <Input placeholder="请输入客户公司" />
          </Form.Item>

          <Form.Item name="clientContact" label="客户联系人">
            <Input placeholder="可选" />
          </Form.Item>

          <Form.Item
            name="projectManager"
            label="项目经理"
            rules={[{ required: true, message: '请输入项目经理' }]}
          >
            <Input placeholder="请输入项目经理" />
          </Form.Item>

          <Form.Item
            name="projectAmount"
            label="合同金额"
            rules={[{ required: true, message: '请输入合同金额' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入金额" />
          </Form.Item>

          <Form.Item
            name="projectLevel"
            label="项目等级"
            rules={[{ required: true }]}
          >
            <Select
              options={LEVEL_OPTIONS.map((v) => ({ value: v, label: v }))}
            />
          </Form.Item>

          <Form.Item
            name="projectStatus"
            label="项目状态"
            rules={[{ required: true }]}
          >
            <Select
              options={STATUS_OPTIONS.map((v) => ({ value: v, label: v }))}
            />
          </Form.Item>

          <Form.Item
            name="deptBelong"
            label="所属部门"
            rules={[{ required: true, message: '请输入所属部门' }]}
          >
            <Input placeholder="请输入所属部门" />
          </Form.Item>

          <Form.Item
            name="startDate"
            label="开始日期"
            rules={[{ required: true, message: '请选择开始日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="expectEndDate" label="预计完成日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </div>

        <Form.Item name="remark" label="备注说明">
          <Input.TextArea rows={2} placeholder="可选" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
