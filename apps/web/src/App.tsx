import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { App as AntdApp, ConfigProvider, theme, Spin } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useAuth } from './hooks/useAuth';
import { setMessageApi } from './utils/request';
import { initStageMapping } from './utils/stageMapping';
import BasicLayout from './layouts/BasicLayout';

const LoginPage = lazy(() => import('./pages/Login'));
const LtcAlerts = lazy(() => import('./pages/LTC/Alerts'));
const LtcAnalysis = lazy(() => import('./pages/LTC/Analysis'));
const LeadsList = lazy(() => import('./pages/LTC/Leads/List'));
const LeadsDetail = lazy(() => import('./pages/LTC/Leads/Detail'));
const AdminUsers = lazy(() => import('./pages/Admin/Users'));
const DevicesPage = lazy(() => import('./pages/Account/Devices'));
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
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#171717',
          colorInfo: '#0070f3',
          colorSuccess: '#0070f3',
          colorWarning: '#f5a623',
          colorError: '#ee0000',
          colorLink: '#0070f3',
          colorLinkHover: '#0761d1',
          colorLinkActive: '#0059c8',
          borderRadius: 6,
          borderRadiusLG: 12,
          borderRadiusSM: 4,
          colorBgContainer: '#ffffff',
          colorBgElevated: '#ffffff',
          colorBgLayout: '#fafafa',
          colorBgSpotlight: '#f5f5f5',
          colorBorder: '#ebebeb',
          colorBorderSecondary: '#ebebeb',
          colorFillAlter: '#f5f5f5',
          colorText: '#171717',
          colorTextSecondary: '#4d4d4d',
          colorTextTertiary: '#888888',
          colorTextQuaternary: '#a1a1a1',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
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
          boxShadow: '0px 2px 2px rgba(0,0,0,0.04), 0px 8px 8px -8px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.08) inset',
          boxShadowSecondary: '0px 1px 1px rgba(0,0,0,0.02), 0px 2px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.08) inset',
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
            itemActiveBg: '#f5f5f5',
            itemSelectedBg: '#f5f5f5',
            itemSelectedColor: '#171717',
            itemHeight: 40,
            iconSize: 16,
          },
          Card: {
            borderRadiusLG: 12,
            paddingLG: 24,
          },
          Table: {
            borderRadius: 8,
            headerBg: '#fafafa',
            headerColor: '#4d4d4d',
            headerSplitColor: '#ebebeb',
            rowHoverBg: '#fafafa',
            borderColor: '#ebebeb',
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
            colorBgContainer: '#ffffff',
            activeBorderColor: '#171717',
            hoverBorderColor: '#4d4d4d',
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
            itemActiveColor: '#171717',
            itemHoverColor: '#4d4d4d',
            itemSelectedColor: '#171717',
            inkBarColor: '#171717',
          },
          Segmented: {
            borderRadius: 6,
            itemSelectedBg: '#f5f5f5',
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
          <Routes>
            <Route path="/login" element={withSuspense(<LoginPage />)} />
            {/* 统一布局 — 所有页面共用 BasicLayout 侧边栏 */}
            <Route path="/*" element={<PrivateRoute><BasicLayout /></PrivateRoute>}>
              {/* 线索板块 */}
              <Route path="ltc/dashboard" element={withSuspense(<LeadsList />)} />
              <Route path="ltc/kanban" element={withSuspense(<LeadsList />)} />
              <Route path="ltc/leads" element={withSuspense(<LeadsList />)} />
              <Route path="ltc/leads/:id" element={withSuspense(<LeadsDetail />)} />
              <Route path="ltc/alerts" element={withSuspense(<LtcAlerts />)} />
              <Route path="ltc/analysis" element={withSuspense(<LtcAnalysis />)} />
              {/* 管理板块 */}
              <Route path="admin/users" element={withSuspense(<AdminUsers />)} />
              <Route path="account/devices" element={withSuspense(<DevicesPage />)} />
              <Route path="stats/:type" element={withSuspense(<StatPlaceholder />)} />
            </Route>
            {/* 根路径 → 直接进入工作台 */}
            <Route index element={<Navigate to="/ltc/leads" replace />} />
            {/* 未知路径回退 */}
            <Route path="*" element={<Navigate to="/ltc/kanban" replace />} />
          </Routes>
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
