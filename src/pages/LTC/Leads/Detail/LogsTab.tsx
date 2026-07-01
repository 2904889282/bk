import { useState, useEffect } from 'react';
import { Table, Select, Space, Tag } from 'antd';
import type { OperationLogItem } from '../../../../store/useLeadStore';
import { LS_LOGS, loadLS } from '../../../../store/useLeadStore';

const ACTION_COLORS: Record<string, string> = {
  '创建': 'green', '编辑': 'blue', '状态变更': 'orange',
  '新增跟进': 'purple', '上传附件': 'cyan', '转为项目': 'red',
  '删除附件': 'default',
};

interface Props { leadId: string; }

export default function LogsTab({ leadId }: Props) {
  const [logs, setLogs] = useState<OperationLogItem[]>([]);
  const [typeFilter, setTypeFilter] = useState('all');

  const load = () => {
    const all = loadLS<OperationLogItem[]>(LS_LOGS, []).filter(l => l.leadId === leadId).sort((a, b) => b.time.localeCompare(a.time));
    setLogs(all);
  };
  useEffect(() => { load(); }, [leadId]);

  const filtered = typeFilter === 'all' ? logs : logs.filter(l => l.actionType === typeFilter);
  const actionTypes = [...new Set(logs.map(l => l.actionType))];

  const columns = [
    { title: '时间', dataIndex: 'time', width: 160, render: (v: string) => <span style={{ fontSize: 12, color: '#666' }}>{v}</span> },
    {
      title: '操作类型', dataIndex: 'actionType', width: 100,
      render: (v: string) => <Tag color={ACTION_COLORS[v] || 'default'}>{v}</Tag>,
    },
    { title: '操作人', dataIndex: 'operator', width: 100 },
    { title: '详情', dataIndex: 'detail', render: (v: string) => v || '-' },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Select value={typeFilter} onChange={setTypeFilter} style={{ width: 140 }}
          options={[{ value: 'all', label: '全部类型' }, ...actionTypes.map(t => ({ value: t, label: t }))]} />
        <span style={{ color: '#999', fontSize: 12 }}>共 {filtered.length} 条记录</span>
      </Space>
      <Table columns={columns} dataSource={filtered} rowKey="id" size="small" pagination={{ pageSize: 15 }} />
    </div>
  );
}
