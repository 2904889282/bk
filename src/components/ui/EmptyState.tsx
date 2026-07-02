import { Empty, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

interface Props {
  description?: string;
  showCreate?: boolean;
  onCreate?: () => void;
  createText?: string;
}

/** 统一空状态组件 */
export default function EmptyState({ description = '暂无数据', showCreate, onCreate, createText = '新建' }: Props) {
  return (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={<span style={{ color: '#bfbfbf' }}>{description}</span>}
      style={{ padding: '60px 0' }}
    >
      {showCreate && onCreate && (
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>{createText}</Button>
      )}
    </Empty>
  );
}
