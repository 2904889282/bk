import { useState, useEffect } from 'react';
import { Timeline, Button, Modal, Form, Input, Select, message, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { FollowUpRecord } from '../../../../store/useLeadStore';
import { LS_FOLLOWUPS, loadLS, saveLS } from '../../../../store/useLeadStore';
import dayjs from 'dayjs';

const FOLLOWUP_TYPES = ['初次沟通', '二次沟通', '三次沟通', '日常跟进', '状态变更'];
const TYPE_COLORS: Record<string, string> = { '初次沟通': 'blue', '二次沟通': 'cyan', '三次沟通': 'geekblue', '日常跟进': 'green', '状态变更': 'orange' };

interface Props { leadId: string; operator: string; }

export default function FollowUpTab({ leadId, operator }: Props) {
  const [records, setRecords] = useState<FollowUpRecord[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const load = () => setRecords(loadLS<FollowUpRecord[]>(LS_FOLLOWUPS, []).filter(r => r.leadId === leadId).sort((a, b) => b.date.localeCompare(a.date)));
  useEffect(() => { load(); }, [leadId]);

  const handleAdd = () => {
    form.validateFields().then(vals => {
      const all = loadLS<FollowUpRecord[]>(LS_FOLLOWUPS, []);
      const record: FollowUpRecord = {
        id: 'FU' + Date.now(), leadId,
        type: vals.type, date: vals.date.format('YYYY-MM-DD HH:mm'),
        operator, summary: vals.summary, detail: vals.detail || '', nextPlan: vals.nextPlan || '',
      };
      all.push(record);
      saveLS(LS_FOLLOWUPS, all);
      message.success('跟进记录已添加');
      setModalOpen(false); form.resetFields(); load();
    }).catch(() => {});
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalOpen(true); }}>
          新增跟进
        </Button>
      </div>

      {records.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无跟进记录</div>
      ) : (
        <Timeline
          items={records.map(r => ({
            color: TYPE_COLORS[r.type] || 'gray',
            children: (
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Tag color={TYPE_COLORS[r.type]}>{r.type}</Tag>
                  <span style={{ color: '#999', fontSize: 12 }}>{r.date}</span>
                  <span style={{ fontSize: 12, color: '#666' }}>操作人: {r.operator}</span>
                </div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{r.summary}</div>
                {r.detail && <div style={{ color: '#666', fontSize: 13, marginBottom: 4 }}>{r.detail}</div>}
                {r.nextPlan && <div style={{ color: '#6366f1', fontSize: 12 }}>📌 下一步: {r.nextPlan}</div>}
              </div>
            ),
          }))}
        />
      )}

      <Modal title="新增跟进记录" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={handleAdd} destroyOnClose width={560}>
        <Form form={form} layout="vertical" initialValues={{ type: '日常跟进' }}>
          <Form.Item name="type" label="跟进类型" rules={[{ required: true }]}>
            <Select options={FOLLOWUP_TYPES.map(t => ({ value: t, label: t }))} />
          </Form.Item>
          <Form.Item name="date" label="跟进时间" rules={[{ required: true }]} initialValue={dayjs()}>
            <Select options={[...Array(24)].map((_, i) => {
              const d = dayjs().subtract(i * 2, 'hour');
              return { value: d, label: d.format('YYYY-MM-DD HH:mm') };
            })} />
          </Form.Item>
          <Form.Item name="summary" label="核心结论" rules={[{ required: true, message: '请输入核心结论' }]}>
            <Input placeholder="简要总结本次跟进的核心结论" />
          </Form.Item>
          <Form.Item name="detail" label="详细内容">
            <Input.TextArea rows={3} placeholder="详细沟通内容" />
          </Form.Item>
          <Form.Item name="nextPlan" label="下一步计划">
            <Input placeholder="后续行动计划" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
