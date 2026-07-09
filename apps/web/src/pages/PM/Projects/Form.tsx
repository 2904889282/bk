import { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, InputNumber, DatePicker, message, Button, Row, Col, Collapse, Space } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  fetchProjectDetail,
  createProject,
  updateProject,
  saveMilestones,
  saveTeam,
  type ProjectSaveDTO,
} from '../../../api/project';

interface Props {
  open: boolean;
  editId: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

const LEVEL_OPTIONS = ['S', 'A', 'B', 'C'];
const STATUS_OPTIONS = ['进行中', '暂停', '已交付', '已终止'];
const RESP_OPTIONS = ['R', 'As', 'I', 'Ap'];

export default function ProjectForm({ open, editId, onClose, onSuccess }: Props) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) { form.resetFields(); return; }
    if (editId) {
      fetchProjectDetail(editId).then(data => {
        form.setFieldsValue({
          ...data,
          startDate: data.startDate ? dayjs(data.startDate) : null,
          expectEndDate: data.expectEndDate ? dayjs(data.expectEndDate) : null,
        });
      }).catch(() => { message.error('获取项目详情失败'); onClose(); });
    } else {
      form.setFieldsValue({
        projectAmount: 0, progress: 0, projectStatus: '进行中',
        projectLevel: 'B', startDate: dayjs(), deptBelong: '平台',
        milestones: [], team: [],
      });
    }
  }, [open, editId, form, onClose]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const dto: ProjectSaveDTO = {
        projectName: values.projectName,
        projectNumber: values.projectNumber,
        clientName: values.clientName,
        clientContact: values.clientContact,
        projectManager: values.projectManager,
        deliveryManager: values.deliveryManager,
        productManager: values.productManager,
        projectAmount: values.projectAmount,
        projectLevel: values.projectLevel,
        projectStatus: values.projectStatus,
        deptBelong: values.deptBelong,
        startDate: values.startDate ? dayjs(values.startDate).format('YYYY-MM-DD') : '',
        expectEndDate: values.expectEndDate ? dayjs(values.expectEndDate).format('YYYY-MM-DD') : undefined,
        progress: values.progress,
        supplier: values.supplier,
        riskAssessment: values.riskAssessment,
        remark: values.remark,
        description: values.description,
      };

      setSubmitting(true);
      if (editId) {
        await updateProject(editId, dto);
        // 保存里程碑和团队
        if (values.milestones?.length) await saveMilestones(editId, values.milestones);
        if (values.team?.length) await saveTeam(editId, values.team);
        message.success('项目已更新');
      } else {
        const created = await createProject(dto);
        const projectId = created?.id || created?.projectId || editId;
        if (projectId) {
          if (values.milestones?.length) await saveMilestones(projectId, values.milestones);
          if (values.team?.length) await saveTeam(projectId, values.team);
        }
        message.success('项目已创建');
      }
      onSuccess();
    } catch { /* ignore */ }
    finally { setSubmitting(false); }
  };

  return (
    <Modal title={editId ? '编辑项目' : '新建项目'} open={open} onCancel={onClose}
      footer={<Button type="primary" loading={submitting} onClick={handleSubmit}>{editId ? '保存修改' : '确认创建'}</Button>}
      width={720} destroyOnHidden>
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <Form.Item name="projectName" label="项目名称" rules={[{ required: true, message: '请输入' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="clientName" label="客户公司" rules={[{ required: true, message: '请输入' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="projectManager" label="一条龙经理" rules={[{ required: true, message: '请输入' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="deliveryManager" label="交付经理">
            <Input />
          </Form.Item>
          <Form.Item name="productManager" label="产品经理">
            <Input />
          </Form.Item>
          <Form.Item name="clientContact" label="甲方对接人">
            <Input />
          </Form.Item>
          <Form.Item name="projectAmount" label="合同金额" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="projectLevel" label="项目等级" rules={[{ required: true }]}>
            <Select options={LEVEL_OPTIONS.map(v => ({ value: v, label: v }))} />
          </Form.Item>
          <Form.Item name="projectStatus" label="项目状态" rules={[{ required: true }]}>
            <Select options={STATUS_OPTIONS.map(v => ({ value: v, label: v }))} />
          </Form.Item>
          <Form.Item name="deptBelong" label="所属部门" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="startDate" label="开始日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="expectEndDate" label="预计完成日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="supplier" label="供应商">
            <Input />
          </Form.Item>
          <Form.Item name="projectNumber" label="项目编号">
            <Input />
          </Form.Item>
        </div>
        <Form.Item name="riskAssessment" label="风险评估">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={2} />
        </Form.Item>

        {/* 折叠区：里程碑 + 团队 */}
        <Collapse ghost style={{ marginTop: 8 }} items={[
          {
            key: 'milestones',
            label: '🎯 里程碑计划（可选）',
            children: (
              <Form.List name="milestones">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...rest }) => (
                      <Row key={key} gutter={8} align="middle" style={{ marginBottom: 8 }}>
                        <Col span={6}>
                          <Form.Item {...rest} name={[name, 'stage']} noStyle>
                            <Input placeholder="阶段(如:立项阶段)" />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item {...rest} name={[name, 'milestone']} noStyle>
                            <Input placeholder="里程碑(如:需求确认完成)" />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item {...rest} name={[name, 'plannedDate']} noStyle>
                            <Input placeholder="计划日期(YYYY-MM-DD)" />
                          </Form.Item>
                        </Col>
                        <Col span={3}>
                          <Form.Item {...rest} name={[name, 'status']} noStyle initialValue="pending">
                            <Select options={[
                              { value: 'pending', label: '待开始' },
                              { value: 'in_progress', label: '进行中' },
                              { value: 'completed', label: '完成' },
                            ]} />
                          </Form.Item>
                        </Col>
                        <Col span={1}>
                          <DeleteOutlined onClick={() => remove(name)} style={{ color: '#ff4d4f', cursor: 'pointer' }} />
                        </Col>
                      </Row>
                    ))}
                    <Button type="dashed" icon={<PlusOutlined />} onClick={() => add()} block>
                      添加里程碑
                    </Button>
                  </>
                )}
              </Form.List>
            ),
          },
          {
            key: 'team',
            label: '👥 项目团队（可选）',
            children: (
              <Form.List name="team">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...rest }) => (
                      <Row key={key} gutter={8} align="middle" style={{ marginBottom: 8 }}>
                        <Col span={5}>
                          <Form.Item {...rest} name={[name, 'name']} noStyle rules={[{ required: true, message: '必填' }]}>
                            <Input placeholder="姓名" />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item {...rest} name={[name, 'role']} noStyle>
                            <Input placeholder="职务" />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item {...rest} name={[name, 'dept']} noStyle initialValue="平台">
                            <Input placeholder="部门" />
                          </Form.Item>
                        </Col>
                        <Col span={5}>
                          <Form.Item {...rest} name={[name, 'responsibility']} noStyle>
                            <Select placeholder="责任" options={RESP_OPTIONS.map(v => ({ value: v, label: v }))} />
                          </Form.Item>
                        </Col>
                        <Col span={2}>
                          <DeleteOutlined onClick={() => remove(name)} style={{ color: '#ff4d4f', cursor: 'pointer' }} />
                        </Col>
                      </Row>
                    ))}
                    <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ dept: '平台' })} block>
                      添加成员
                    </Button>
                  </>
                )}
              </Form.List>
            ),
          },
        ]} />
      </Form>
    </Modal>
  );
}
