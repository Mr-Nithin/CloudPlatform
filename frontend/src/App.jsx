import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Requests from './pages/Requests';
import Resources from './pages/Resources';
import Approvals from './pages/Manager/Approvals';
import Users from './pages/Admin/Users';
import Teams from './pages/Admin/Teams';
import Projects from './pages/Admin/Projects';
import Accounts from './pages/Admin/Accounts';
import NamingConventions from './pages/Admin/NamingConventions';
import Templates from './pages/Admin/Templates';
import AuditLogs from './pages/Admin/AuditLogs';
import ChangePassword from './pages/ChangePassword';

function RequireAuth({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function RequireToken({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/change-password" element={<RequireToken><ChangePassword /></RequireToken>} />
          <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
            <Route index element={<Dashboard />} />
            <Route path="chat" element={<Chat />} />
            <Route path="chat/:conversationId" element={<Chat />} />
            <Route path="requests" element={<Requests />} />
            <Route path="resources" element={<Resources />} />
            <Route path="approvals" element={<RequireAuth roles={['Manager', 'CloudEngineer', 'Admin']}><Approvals /></RequireAuth>} />
            <Route path="admin/users" element={<RequireAuth roles={['Admin']}><Users /></RequireAuth>} />
            <Route path="admin/teams" element={<RequireAuth roles={['Admin']}><Teams /></RequireAuth>} />
            <Route path="admin/projects" element={<RequireAuth roles={['Admin']}><Projects /></RequireAuth>} />
            <Route path="admin/accounts" element={<RequireAuth roles={['Admin']}><Accounts /></RequireAuth>} />
            <Route path="admin/naming-conventions" element={<RequireAuth roles={['Admin']}><NamingConventions /></RequireAuth>} />
            <Route path="admin/templates" element={<RequireAuth roles={['Admin', 'CloudEngineer']}><Templates /></RequireAuth>} />
            <Route path="admin/audit-logs" element={<RequireAuth roles={['Admin', 'CloudEngineer']}><AuditLogs /></RequireAuth>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
