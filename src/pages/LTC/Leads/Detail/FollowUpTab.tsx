import { useState, useEffect, useCallback } from 'react';
import { Timeline, Button, Modal, Form, Input, Select, DatePicker, message, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { createFollow, fetchFollowList, type ClueFollowVO } from '../../../../api/clue';
import dayjs from 'dayjs';

/** 跟进类型颜色映射 */
const TYPE_COLORS: Record<string, string> = {
  '初次沟通': 'blue', '二次沟通': 'cyan', '三次沟通': 'geekblue',
  '日常跟进': 'green', '状态变更': 'orange',
};

/** 线索状态列表（用于新增跟进时同步修改状态） */
const CLUE_STATUS_LIST = ['线索接触', '沟通提案', '执行测试', '已承接', '已丢失', '已延期'];

interface FollowFormValues {
  followType: string;
  coreConclusion: string;
  detailContent?: string;
  nextPlan?: string;
  nextDeadline?: dayjs.Dayjs;
  newStatus?: string;
}

interface Props {
  clueId: number;
  isTerminalLocked: boolean;
  onFollowCreated: () => void;
}

export default function FollowUpTab({ clueId, isTerminalLocked, onFollowCreated }: Props) {
  const [records, setRecords] = useState<ClueFollowVO[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<FollowFormValues>();

  /** 加载跟进记录 */
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchFollowList(clueId);
      setRecords(data);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [clueId]);

  useEffect(() => { load(); }, [load]);

  /** 新增跟进 */
  const handleAdd = async () => {
    try {
      const vals = await form.validateFields();
      setSubmitting(true);
      await createFollow({
        clueId,
        followType: vals.followType,
        coreConclusion: vals.coreConclusion,
        detailContent: vals.detailContent || '',
        nextPlan: vals.nextPlan || '',
        nextDeadline: vals.nextDeadline ? vals.nextDeadline.format('YYYY-MM-DD') : undefined,
        newStatus: vals.newStatus || undefined,
      });
      message.success('跟进记录已添加');
      setModalOpen(false);
      form.resetFields();
      // 重新拉取跟进列表 & 通知父级刷新详情（状态可能变更）
      await load();
      onFollowCreated();
    } catch (err) {
      if (err && typeof err === 'object' && 'errorFields' in err) return; // 表单校验失败
    } finally {
      setSubmitting(false);
    }
  };

  /** 格式化跟进日期 */
  const formatDate = (d: string) => dayjs(d).format('YYYY-MM-DD HH:mm');

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        {isTerminalLocked ? (
          <Button icon={<PlusOutlined />} disabled title="已转项目的线索不可新增跟进">
            新增跟进
          </Button>
        ) : (
          <Button type="primary" icon={<PlusOutlined />}
            onClick={() => { form.resetFields(); form.setFieldsValue({ followType: '日常跟进' }); setModalOpen(true); }}>
            新增跟进
          </Button>
        )}
        <span style={{ marginLeft: 12, color: '#999', fontSize: 12 }}>
          {loading ? '加载中…' : `共 ${records.length} 条记录`}
        </span>
      </div>

      {!loading && records.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无跟进记录</div>
      ) : (
        <Timeline
          pending={loading ? '加载中…' : undefined}
          items={records.map(r => ({
            color: TYPE_COLORS[r.followType] || 'gray',
            children: (
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <Tag color={TYPE_COLORS[r.followType]}>{r.followType}</Tag>
                  <span style={{ color: '#999', fontSize: 12 }}>{formatDate(r.followDate)}</span>
                  <span style={{ fontSize: 12, color: '#666' }}>操作人: {r.followUserName}</span>
                  {r.newStatus && (
                    <Tag color="orange" style={{ fontSize: 11 }}>
                      状态变更 → {r.newStatus}
                    </Tag>
                  )}
                </div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{r.coreConclusion}</div>
                {r.detailContent && <div style={{ color: '#666', fontSize: 13, marginBottom: 4 }}>{r.detailContent}</div>}
                {r.nextPlan && <div style={{ color: '#6366f1', fontSize: 12 }}>📌 下一步: {r.nextPlan}</div>}
                {r.nextDeadline && <div style={{ color: '#999', fontSize: 11, marginTop: 2 }}>截止: {r.nextDeadline}</div>}
              </div>
            ),
          }))}
        />
      )}

      {/* 新增跟进弹窗 */}
      <Modal
        title="新增跟进记录"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleAdd}
        destroyOnClose
        width={600}
        confirmLoading={submitting}
      >
        <Form form={form} layout="vertical" initialValues={{ followType: '日常跟进' }}>
          <Form.Item name="followType" label="跟进类型" rules={[{ required: true, message: '请选择跟进类型' }]}>
            <Select
              options={[
                { value: '初次沟通', label: '初次沟通' },
                { value: '二次沟通', label: '二次沟通' },
                { value: '三次沟通', label: '三次沟通' },
                { value: '日常跟进', label: '日常跟进' },
                { value: '状态变更', label: '状态变更' },
              ]}
            />
          </Form.Item>
          <Form.Item name="coreConclusion" label="核心结论" rules={[{ required: true, message: '请输入核心结论' }]}>
            <Input placeholder="简要总结本次跟进的核心结论" />
          </Form.Item>
          <Form.Item name="detailContent" label="详细内容">
            <Input.TextArea rows={3} placeholder="详细沟通内容" />
          </Form.Item>
          <Form.Item name="nextPlan" label="下一步计划">
            <Input placeholder="后续行动计划" />
          </Form.Item>
          <Form.Item name="nextDeadline" label="下一步截止日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="newStatus" label="同步更新线索状态（可选）">
            <Select
              allowClear
              placeholder="选择新状态（不选则不改变）"
              options={CLUE_STATUS_LIST.map(s => ({ value: s, label: s }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
