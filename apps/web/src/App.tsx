import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { App as AntdApp, ConfigProvider, theme, Spin } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './store/useTheme';
import PermissionGuard from './components/auth/PermissionGuard';
import { setMessageApi } from './utils/request';
import { initStageMapping } from './utils/stageMapping';
import BasicLayout from './layouts/BasicLayout';
import ClueLayout from './layouts/ClueLayout';

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
const ProjectDetail = lazy(() => import('./pages/PM/Projects/Detail'));
const PmRisks = lazy(() => import('./pages/PM/Risks'));
const PmTalent = lazy(() => import('./pages/PM/Talent'));
const PmGantt = lazy(() => import('./pages/PM/Gantt'));
const AdminUsers = lazy(() => import('./pages/Admin/Users'));
const AdminDepts = lazy(() => import('./pages/Admin/Depts'));
const AdminPositions = lazy(() => import('./pages/Admin/Positions'));
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
  const { token, isLoggedIn, fetchUserInfo } = useAuth();

  useEffect(() => {
    if (token && !isLoggedIn) fetchUserInfo();
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
          /* ── Vercel Ink 墨水黑主色 ── */
          colorPrimary: isDark ? '#fafafa' : '#171717',
          colorInfo: '#0070f3',
          colorSuccess: '#0070f3',
          colorWarning: '#f5a623',
          colorError: '#ee0000',
          colorLink: '#0070f3',
          colorLinkHover: '#0761d1',
          colorLinkActive: '#0059c8',

          /* ── Vercel geist-radius: sm=6px ── */
          borderRadius: 6,
          borderRadiusLG: 12,
          borderRadiusSM: 4,

          /* ── Vercel 表面体系 ── */
          colorBgContainer: isDark ? '#0a0a0a' : '#ffffff',
          colorBgElevated: isDark ? '#141414' : '#ffffff',
          colorBgLayout: isDark ? '#0d0d0d' : '#fafafa',
          colorBgSpotlight: isDark ? '#1a1a1a' : '#f5f5f5',
          colorBorder: isDark ? '#2a2a2a' : '#ebebeb',
          colorBorderSecondary: isDark ? '#1a1a1a' : '#ebebeb',
          colorFillAlter: isDark ? '#141414' : '#f5f5f5',

          /* ── Vercel 文字体系 ── */
          colorText: isDark ? '#fafafa' : '#171717',
          colorTextSecondary: isDark ? '#a1a1a1' : '#4d4d4d',
          colorTextTertiary: isDark ? '#666666' : '#888888',
          colorTextQuaternary: isDark ? '#444444' : '#a1a1a1',

          /* ── 字体 — Inter 优先（Geist 开源替代）── */
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
          fontSize: 14,
          fontSizeHeading1: 30,
          fontSizeHeading2: 24,
          fontSizeHeading3: 20,
          fontSizeHeading4: 16,
          fontSizeHeading5: 14,
          lineHeight: 1.5714,

          /* ── 控件高度 ── */
          controlHeight: 36,
          controlHeightLG: 42,
          controlHeightSM: 30,

          /* ── 间距 ── */
          padding: 16,
          paddingLG: 24,
          paddingXS: 8,
          paddingSM: 12,

          /* ── Vercel 层叠阴影（L3 作为默认卡片阴影）── */
          boxShadow:
            isDark
              ? '0px 2px 4px rgba(0,0,0,0.3), 0px 8px 8px -8px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.06) inset'
              : '0px 2px 2px rgba(0,0,0,0.04), 0px 8px 8px -8px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.08) inset',
          boxShadowSecondary:
            isDark
              ? '0px 1px 2px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.06) inset'
              : '0px 1px 1px rgba(0,0,0,0.02), 0px 2px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.08) inset',

          /* ── 动效 ── */
          motionDurationSlow: '0.3s',
          motionDurationMid: '0.2s',
          motionDurationFast: '0.1s',
          motionEaseInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        },
        components: {
          Menu: {
            itemBorderRadius: 6,
            itemMarginInline: 8,
            subMenuItemBg: 'transparent',
            itemActiveBg: isDark ? '#1a1a1a' : '#f5f5f5',
            itemSelectedBg: isDark ? '#1a1a1a' : '#f5f5f5',
            itemSelectedColor: isDark ? '#fafafa' : '#171717',
            itemHeight: 40,
            iconSize: 16,
          },
          Card: {
            borderRadiusLG: 12,
            paddingLG: 24,
          },
          Table: {
            borderRadius: 8,
            headerBg: isDark ? '#141414' : '#fafafa',
            headerColor: isDark ? '#a1a1a1' : '#4d4d4d',
            headerSplitColor: isDark ? '#2a2a2a' : '#ebebeb',
            rowHoverBg: isDark ? '#1a1a1a' : '#fafafa',
            borderColor: isDark ? '#2a2a2a' : '#ebebeb',
          },
          Button: {
            borderRadius: 6,
            borderRadiusLG: 8,
            borderRadiusSM: 4,
            controlHeight: 36,
            controlHeightLG: 42,
            controlHeightSM: 30,
            paddingInline: 16,
            paddingInlineLG: 20,
            paddingInlineSM: 12,
            fontWeight: 500,
            primaryShadow: 'none',
            defaultShadow: 'none',
            dangerShadow: 'none',
          },
          Input: {
            borderRadius: 6,
            borderRadiusLG: 8,
            borderRadiusSM: 4,
            controlHeight: 36,
            controlHeightLG: 42,
            controlHeightSM: 30,
            paddingInline: 12,
            colorBgContainer: isDark ? '#0a0a0a' : '#ffffff',
            activeBorderColor: isDark ? '#fafafa' : '#171717',
            hoverBorderColor: isDark ? '#a1a1a1' : '#4d4d4d',
          },
          Modal: {
            borderRadiusLG: 12,
            paddingLG: 24,
          },
          Tag: {
            borderRadiusSM: 4,
          },
          Tabs: {
            borderRadius: 6,
            itemActiveColor: isDark ? '#fafafa' : '#171717',
            itemHoverColor: isDark ? '#a1a1a1' : '#4d4d4d',
            itemSelectedColor: isDark ? '#fafafa' : '#171717',
            inkBarColor: isDark ? '#fafafa' : '#171717',
          },
          Segmented: {
            borderRadius: 6,
            itemSelectedBg: isDark ? '#1a1a1a' : '#f5f5f5',
          },
          Select: {
            borderRadius: 6,
          },
          DatePicker: {
            borderRadius: 6,
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
            {/* 线索板块 — 统一使用 ClueLayout 侧边栏 */}
            <Route path="ltc" element={<PrivateRoute><ClueLayout /></PrivateRoute>}>
              <Route path="dashboard" element={withSuspense(<PermissionGuard permCode="clue:list"><LeadsList /></PermissionGuard>)} />
              <Route path="kanban" element={withSuspense(<PermissionGuard permCode="clue:list"><LtcKanban /></PermissionGuard>)} />
              <Route path="leads" element={withSuspense(<PermissionGuard permCode="clue:list"><LeadsList /></PermissionGuard>)} />
              <Route path="leads/:id" element={withSuspense(<PermissionGuard permCode="clue:list"><LeadsDetail /></PermissionGuard>)} />
              <Route path="pipeline" element={withSuspense(<PermissionGuard permCode="pipeline:list"><PipelineList /></PermissionGuard>)} />
              <Route path="alerts" element={withSuspense(<PermissionGuard permCode="alert:list"><LtcAlerts /></PermissionGuard>)} />
              <Route path="analysis" element={withSuspense(<PermissionGuard permCode="pipeline:list"><LtcAnalysis /></PermissionGuard>)} />
            </Route>
            {/* 项目/管理板块 — 通用 BasicLayout */}
            <Route path="/*" element={<PrivateRoute><BasicLayout /></PrivateRoute>}>
              <Route path="pm/kanban" element={withSuspense(<PermissionGuard permCode="project:list"><PmKanban /></PermissionGuard>)} />
              <Route path="pm/projects" element={withSuspense(<PermissionGuard permCode="project:list"><PmProjects /></PermissionGuard>)} />
              <Route path="projects/:id" element={withSuspense(<PermissionGuard permCode="project:list"><ProjectDetail /></PermissionGuard>)} />
              <Route path="pm/risks" element={withSuspense(<PermissionGuard permCode="risk:list"><PmRisks /></PermissionGuard>)} />
              <Route path="pm/talent" element={withSuspense(<PermissionGuard permCode="talent:list"><PmTalent /></PermissionGuard>)} />
              <Route path="pm/gantt" element={withSuspense(<PermissionGuard permCode="project:list"><PmGantt /></PermissionGuard>)} />
              <Route path="admin/users" element={withSuspense(<PermissionGuard permCode="system:user:list"><AdminUsers /></PermissionGuard>)} />
              <Route path="admin/depts" element={withSuspense(<PermissionGuard permCode="system:user:list"><AdminDepts /></PermissionGuard>)} />
              <Route path="admin/positions" element={withSuspense(<PermissionGuard permCode="system:user:list"><AdminPositions /></PermissionGuard>)} />
              <Route path="admin/recycle" element={withSuspense(<PermissionGuard permCode="recycle:list"><RecycleBin /></PermissionGuard>)} />
              <Route path="account/devices" element={withSuspense(<DevicesPage />)} />
              <Route path="resources" element={withSuspense(<ResourcesPage />)} />
              <Route path="stats/:type" element={withSuspense(<StatPlaceholder />)} />
            </Route>
            {/* 未知路径回退 */}
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
