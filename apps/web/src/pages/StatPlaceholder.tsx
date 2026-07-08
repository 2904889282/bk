import { Typography, Empty } from 'antd';
import { useSearchParams } from 'react-router-dom';

const { Title, Text } = Typography;

export default function StatPlaceholder() {
  const [params] = useSearchParams();
  const title = params.get('title') || '数据详情';

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
      <Empty
        description={
          <div>
            <Title level={5} type="secondary">{title}</Title>
            <Text type="secondary">此页面暂未开放，敬请期待</Text>
          </div>
        }
      />
    </div>
  );
}
