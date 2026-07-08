import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Result, Button, Spin } from 'antd';

/**
 * 路由级权限守卫
 * 
 * 权限来源：前端 Zustand store 的 permissions 数组
 * 后端对应：Spring Security @PreAuthorize 注解
 * 
 * 正常模式下两者使用同一数据源（数据库），一致性好。
 * 演示模式（mock_xxx token）下：前端硬编码权限可能与后端不一致，
 * 此时 PermissionGuard 放行但 BasicLayout 会展示全局演示横幅提醒用户。
 * 
 * @param permCode 需要的权限码，如 'pipeline:create'。不传则仅检查登录态。
 * @param children 通过权限检查后渲染的内容
 */
export default function PermissionGuard({
  permCode,
  children,
}: {
  permCode?: string;
  children: React.ReactNode;
}) {
  const { token, isLoggedIn, hasPermission, hasRole, isMockMode } = useAuth();

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

  // 演示模式下不拦截：前端权限与后端可能不一致，交给 BasicLayout 全局横幅和 API 拦截器处理
  if (isMockMode()) {
    return <>{children}</>;
  }

  // 真实后端模式：权限不足
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
