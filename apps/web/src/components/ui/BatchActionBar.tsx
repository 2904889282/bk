import { Button, Space, Modal, message } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import React from 'react';

interface BatchAction {
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  onClick: () => void;
}

interface Props {
  selectedCount: number;
  actions?: BatchAction[];
  defaultDelete?: {
    onDelete: () => Promise<void>;
    label?: string;        // 如 "线索"、"风险"
  };
  onClear: () => void;
}

/** 批量操作浮出栏 - 勾选数据后显示在表格上方 */
export default function BatchActionBar({ selectedCount, actions = [], defaultDelete, onClear }: Props) {
  if (selectedCount === 0) return null;

  const handleBatchDelete = () => {
    Modal.confirm({
      title: '批量删除确认',
      content: `确定删除选中的 ${selectedCount} 条${defaultDelete?.label || '记录'}？`,
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        await defaultDelete!.onDelete();
        message.success(`已批量删除 ${selectedCount} 条`);
        onClear();
      },
    });
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 16px', marginBottom: 8,
      background: '#e6f4ff', borderRadius: 8, border: '1px solid #91caff',
    }}>
      <span style={{ fontSize: 14, color: '#1677ff', fontWeight: 500 }}>
        已选择 <strong>{selectedCount}</strong> 项
      </span>
      <Space>
        {defaultDelete && (
          <Button icon={<DeleteOutlined />} danger onClick={handleBatchDelete}>
            批量删除
          </Button>
        )}
        {actions.map((a, i) => (
          <Button key={i} icon={a.icon} danger={a.danger} onClick={a.onClick}>{a.label}</Button>
        ))}
        <Button onClick={onClear}>取消选择</Button>
      </Space>
    </div>
  );
}
