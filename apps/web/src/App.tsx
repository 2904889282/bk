import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, lazy, Suspense, useState } from 'react';
import { App as AntdApp, ConfigProvider, theme, Spin } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './store/useTheme';
import PermissionGuard from './components/auth/PermissionGuard';
import { setMessageApi } from './utils/request';
import { initStageMapping } from './utils/stageMapping';
import BasicLayout from './layouts/BasicLayout';

const LoginPage = lazy(() => import('./pages/Login'));
const PortalPage = lazy(() => import('./pages/Portal'));
const LtcKanban = lazy(() => import('./pages/LTC/Kanban'));
const LtcAlerts = lazy(() => import('./pages/LTC/Alerts'));
const LtcAnalysis = lazy(() => import('./pages/LTC/Analysis'));
const LeadsList = lazy(() => import('./pages/LTC/Leads/List'));
const LeadsDetail = lazy(() => import('./pages/LTC/Leads/Detail'));
const PipelineList = lazy(() => import('./pages/Pipeline/List'));
const PmKanban = lazy(() => import('./pages/PM/Kanban'));
const PmProjects = lazy(() => import('./pages/PM/Projects'));
const PmRisks = lazy(() => import('./pages/PM/Risks'));
const PmTalent = lazy(() => import('./pages/PM/Talent'));
const PmGantt = lazy(() => import('./pages/PM/Gantt'));
const AdminUsers = lazy(() => import('./pages/Admin/Users'));
const RecycleBin = lazy(() => import('./pages/Admin/RecycleBin'));
const DevicesPage = lazy(() => import('./pages/Account/Devices'));
const ResourcesPage = lazy(() => import('./pages/Resources'));
const StatPlaceholder = lazy(() => import('./pages/StatPlaceholder'));

function PageLoading() {
  return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
}

function withSuspense(page: React.ReactNode) {
  return <Suspense fallback={<PageLoading />}>{page}</Suspense>;
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuth(s => s.token);
  const isLoggedIn = useAuth(s => s.isLoggedIn);
  const location = useLocation();
  if (!isLoggedIn && !token) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

/** 将 antd v6 的 message API 注入到 request.ts，消除静态调用警告 */
function MessageInjector() {
  const { message } = AntdApp.useApp();
  useEffect(() => { setMessageApi(message); }, [message]);
  return null;
}

function AppInit() {
  const { token, isLoggedIn, fetchUserInfo, logout } = useAuth();
  const navigate = useNavigate();
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    // mock 令牌检测：后端在线则自动清除，强制重新登录获取真实 JWT
    if (!token || transitioning) return;
    if (!token.startsWith('mock_')) { setTransitioning(true); return; }
    
    // mock 令牌 + 尝试检测后端
    fetch('/api/health')
      .then(resp => {
        if (resp.ok) {
          // 后端在线 → 清除 mock 令牌 → 跳转登录页获取真实 JWT
          logout();
          setTimeout(() => { navigate('/login', { replace: true }); }, 100);
        }
      })
      .catch(() => { /* 后端不可用，mock 模式 */ });
    setTransitioning(true);
  }, [token, transitioning]);

  useEffect(() => {
    if (token && !isLoggedIn && !token.startsWith('mock_')) fetchUserInfo();
  }, [token, isLoggedIn, fetchUserInfo]);
  useEffect(() => {
    initStageMapping();
  }, []);
  return null;
}

function AppContent() {
  const { isDark } = useTheme();
  const location = useLocation();
  const isRoot = location.pathname === '/';

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#2563eb',
          colorInfo: '#2563eb',
          colorSuccess: '#059669',
          colorWarning: '#d97706',
          colorError: '#dc2626',
          borderRadius: 8,
          borderRadiusLG: 12,
          borderRadiusSM: 6,
          colorBgContainer: isDark ? '#0f172a' : '#ffffff',
          colorBgElevated: isDark ? '#1e293b' : '#ffffff',
          colorBgLayout: isDark ? '#0a0f1a' : '#f1f5f9',
          colorBorder: isDark ? '#1e293b' : '#e2e8f0',
          colorBorderSecondary: isDark ? '#0f172a' : '#f1f5f9',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
          fontSize: 14,
          fontSizeHeading1: 30,
          fontSizeHeading2: 24,
          fontSizeHeading3: 20,
          fontSizeHeading4: 16,
          fontSizeHeading5: 14,
          lineHeight: 1.5714,
          controlHeight: 36,
          controlHeightLG: 42,
          controlHeightSM: 30,
          padding: 16,
          paddingLG: 24,
          paddingXS: 8,
          paddingSM: 12,
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06), 0 1px 4px rgba(15, 23, 42, 0.04)',
          boxShadowSecondary: '0 1px 3px rgba(15, 23, 42, 0.06)',
          motionDurationSlow: '0.3s',
          motionDurationMid: '0.2s',
          motionDurationFast: '0.1s',
          motionEaseInOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
        },
        components: {
          Menu: {
            itemBorderRadius: 6,
            itemMarginInline: 8,
            subMenuItemBg: 'transparent',
            itemActiveBg: isDark ? '#1e3a5f' : '#eff6ff',
            itemSelectedBg: isDark ? '#1e3a5f' : '#eff6ff',
            itemSelectedColor: '#2563eb',
            itemHeight: 40,
            iconSize: 16,
          },
          Card: {
            borderRadiusLG: 12,
            paddingLG: 24,
          },
          Table: {
            borderRadius: 8,
            headerBg: isDark ? '#1e293b' : '#f8fafc',
            headerColor: isDark ? '#94a3b8' : '#475569',
            rowHoverBg: isDark ? '#1e293b' : '#f8fafc',
          },
          Button: {
            borderRadius: 8,
            borderRadiusLG: 10,
            borderRadiusSM: 6,
            controlHeight: 36,
            controlHeightLG: 42,
            controlHeightSM: 30,
            paddingInline: 16,
            paddingInlineLG: 20,
            paddingInlineSM: 12,
            fontWeight: 500,
          },
          Input: {
            borderRadius: 8,
            borderRadiusLG: 10,
            borderRadiusSM: 6,
            controlHeight: 36,
            controlHeightLG: 42,
            controlHeightSM: 30,
            paddingInline: 12,
            colorBgContainer: isDark ? '#0f172a' : '#ffffff',
          },
          Modal: {
            borderRadiusLG: 12,
            paddingLG: 24,
          },
          Tag: {
            borderRadiusSM: 4,
          },
          Tabs: {
            borderRadius: 8,
          },
        },
      }}
    >
      <AntdApp>
        <MessageInjector />
        <AppInit />
        {isRoot ? (
          // 闪屏首页 — 在 <Routes> 外部渲染，零路由冲突
          <PrivateRoute>{withSuspense(<PortalPage />)}</PrivateRoute>
        ) : (
          <Routes>
            <Route path="/login" element={withSuspense(<LoginPage />)} />
            {/* 业务模块 — 共用 BasicLayout 导航栏 */}
            <Route path="/*" element={<PrivateRoute><BasicLayout /></PrivateRoute>}>
              <Route path="ltc/kanban" element={withSuspense(<PermissionGuard permCode="pipeline:list"><LtcKanban /></PermissionGuard>)} />
              <Route path="ltc/pipeline" element={withSuspense(<PermissionGuard permCode="pipeline:list"><PipelineList /></PermissionGuard>)} />
              <Route path="ltc/alerts" element={withSuspense(<PermissionGuard permCode="alert:list"><LtcAlerts /></PermissionGuard>)} />
              <Route path="ltc/analysis" element={withSuspense(<PermissionGuard permCode="pipeline:list"><LtcAnalysis /></PermissionGuard>)} />
              <Route path="ltc/leads" element={withSuspense(<PermissionGuard permCode="clue:list"><LeadsList /></PermissionGuard>)} />
              <Route path="ltc/leads/:id" element={withSuspense(<PermissionGuard permCode="clue:list"><LeadsDetail /></PermissionGuard>)} />
              <Route path="pm/kanban" element={withSuspense(<PermissionGuard permCode="project:list"><PmKanban /></PermissionGuard>)} />
              <Route path="pm/projects" element={withSuspense(<PermissionGuard permCode="project:list"><PmProjects /></PermissionGuard>)} />
              <Route path="pm/risks" element={withSuspense(<PermissionGuard permCode="risk:list"><PmRisks /></PermissionGuard>)} />
              <Route path="pm/talent" element={withSuspense(<PermissionGuard permCode="talent:list"><PmTalent /></PermissionGuard>)} />
              <Route path="pm/gantt" element={withSuspense(<PermissionGuard permCode="project:list"><PmGantt /></PermissionGuard>)} />
              <Route path="admin/users" element={withSuspense(<PermissionGuard permCode="system:user:list"><AdminUsers /></PermissionGuard>)} />
              <Route path="admin/recycle" element={withSuspense(<PermissionGuard permCode="recycle:list"><RecycleBin /></PermissionGuard>)} />
              <Route path="account/devices" element={withSuspense(<DevicesPage />)} />
              <Route path="resources" element={withSuspense(<ResourcesPage />)} />
              <Route path="stats/:type" element={withSuspense(<StatPlaceholder />)} />
            </Route>
            {/* 未知路径回退 → 也是 BasicLayout */}
            <Route path="*" element={<Navigate to="/ltc/kanban" replace />} />
          </Routes>
        )}
      </AntdApp>
    </ConfigProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
