import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

export default function ResourcesPage() {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <Result
        icon={<span style={{ fontSize: 56 }}>🚧</span>}
        title="资源库建设中"
        subTitle="知识库、案例库、文档模板等资源中心即将上线，敬请期待。"
        extra={
          <Button type="primary" onClick={() => navigate('/')}>返回工作台</Button>
        }
      />
    </div>
  );
}
