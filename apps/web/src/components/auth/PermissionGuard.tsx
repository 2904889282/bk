import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Result, Button, Spin } from 'antd';

/**
 * 路由级权限守卫
 * 
 * @param permCode 需要的权限码，如 'pipeline:create'。不传则仅检查登录态。
 * @param children 通过权限检查后渲染的内容
 * 
 * 使用示例:
 *   <Route path="/admin/users" element={<PermissionGuard permCode="system:user:list"><UserPage /></PermissionGuard>} />
 */
export default function PermissionGuard({
  permCode,
  children,
}: {
  permCode?: string;
  children: React.ReactNode;
}) {
  const { token, isLoggedIn, hasPermission, hasRole } = useAuth();

  // 未登录
  if (!isLoggedIn) {
    if (token) {
      return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
    }
    return <Navigate to="/login" replace />;
  }

  // 不需要权限码 或 管理员权限 或 拥有指定权限 → 放行
  if (!permCode || hasRole('ROLE_ADMIN') || hasPermission(permCode)) {
    return <>{children}</>;
  }

  // 无权限
  return (
    <Result
      status="403"
      title="403"
      subTitle="抱歉，您没有访问此页面的权限。"
      extra={
        <Button type="primary" onClick={() => window.history.back()}>
          返回上一页
        </Button>
      }
    />
  );
}
