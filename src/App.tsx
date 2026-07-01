import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/Login';
import BasicLayout from './layouts/BasicLayout';
import PortalPage from './pages/Portal';
import LtcKanban from './pages/LTC/Kanban';
import LtcPipeline from './pages/LTC/Pipeline';
import LtcAlerts from './pages/LTC/Alerts';
import LtcAnalysis from './pages/LTC/Analysis';
import PmKanban from './pages/PM/Kanban';
import PmProjects from './pages/PM/Projects';
import PmRisks from './pages/PM/Risks';
import PmTalent from './pages/PM/Talent';
import AdminUsers from './pages/Admin/Users';
import RecycleBin from './pages/Admin/RecycleBin';
import LeadsList from './pages/LTC/Leads/List';
import LeadsDetail from './pages/LTC/Leads/Detail';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isLoggedIn = useAuth(s => s.isLoggedIn);
  const location = useLocation();
  if (!isLoggedIn) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

function AppInit() {
  const { token, isLoggedIn, fetchUserInfo } = useAuth();
  useEffect(() => {
    if (token && !isLoggedIn) fetchUserInfo();
  }, [token, isLoggedIn, fetchUserInfo]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInit />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<PrivateRoute><BasicLayout /></PrivateRoute>}>
          <Route index element={<PortalPage />} />
          <Route path="ltc/kanban" element={<LtcKanban />} />
          <Route path="ltc/pipeline" element={<LtcPipeline />} />
          <Route path="ltc/alerts" element={<LtcAlerts />} />
          <Route path="ltc/analysis" element={<LtcAnalysis />} />
          <Route path="pm/kanban" element={<PmKanban />} />
          <Route path="pm/projects" element={<PmProjects />} />
          <Route path="pm/risks" element={<PmRisks />} />
          <Route path="pm/talent" element={<PmTalent />} />
          <Route path="admin/users" element={<AdminUsers />} />
          <Route path="admin/recycle" element={<RecycleBin />} />
          <Route path="ltc/leads" element={<LeadsList />} />
          <Route path="ltc/leads/:id" element={<LeadsDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
