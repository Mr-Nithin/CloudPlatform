import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: '🏠 Dashboard', roles: ['Admin', 'Manager', 'Developer', 'CloudEngineer'] },
  { to: '/chat', label: '💬 Chat', roles: ['Developer'] },
  { to: '/requests', label: '📋 Requests', roles: ['Admin', 'Manager', 'Developer', 'CloudEngineer'] },
  { to: '/approvals', label: '✅ Approvals', roles: ['Manager', 'CloudEngineer', 'Admin'] },
  { to: '/resources', label: '☁️ Resources', roles: ['Admin', 'Manager', 'Developer', 'CloudEngineer'] },
  { to: '/admin/users', label: '👥 Users', roles: ['Admin'] },
  { to: '/admin/teams', label: '🏷️ Teams', roles: ['Admin'] },
  { to: '/admin/projects', label: '📁 Projects', roles: ['Admin'] },
  { to: '/admin/accounts', label: '🔗 Accounts', roles: ['Admin'] },
  { to: '/admin/naming-conventions', label: '📐 Naming', roles: ['Admin'] },
  { to: '/admin/templates', label: '📄 Templates', roles: ['Admin', 'CloudEngineer'] },
  { to: '/admin/audit-logs', label: '🔍 Audit Logs', roles: ['Admin', 'CloudEngineer'] },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 'var(--sidebar-width)',
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 0',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        overflowY: 'auto',
      }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--sidebar-border)' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--sidebar-text-active)' }}>☁️ CloudPlatform</div>
          <div style={{ fontSize: 12, color: 'var(--sidebar-text)', marginTop: 4 }}>{user?.name}</div>
          <div style={{ fontSize: 11, color: 'var(--color-accent)', marginTop: 2 }}>{user?.role}</div>
        </div>

        <nav style={{ flex: 1, padding: '12px 0' }}>
          {navItems
            .filter((item) => item.roles.includes(user?.role))
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                style={({ isActive }) => ({
                  display: 'block',
                  padding: '9px 20px',
                  fontSize: 14,
                  color: isActive ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
                  background: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                  borderLeft: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
                  transition: 'all 0.15s',
                })}
              >
                {item.label}
              </NavLink>
            ))}
        </nav>

        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--sidebar-border)' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              background: 'transparent',
              color: 'var(--sidebar-text)',
              border: '1px solid var(--sidebar-border)',
              borderRadius: 'var(--radius)',
              padding: '8px 16px',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.05)'; }}
            onMouseLeave={(e) => { e.target.style.background = 'transparent'; }}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: 'var(--sidebar-width)', flex: 1, padding: 32, minHeight: '100vh' }}>
        <Outlet />
      </main>
    </div>
  );
}
