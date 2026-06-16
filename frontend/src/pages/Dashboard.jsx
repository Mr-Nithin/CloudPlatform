import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { requests, resources } from '../api/client';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, pending: 0, provisioned: 0, failed: 0 });
  const [recentRequests, setRecentRequests] = useState([]);

  useEffect(() => {
    requests.list().then((res) => {
      const all = res.data;
      setStats({
        total: all.length,
        pending: all.filter((r) => r.status === 'PendingApproval').length,
        provisioned: all.filter((r) => r.status === 'Provisioned').length,
        failed: all.filter((r) => r.status === 'Failed').length,
      });
      setRecentRequests(all.slice(0, 5));
    }).catch(console.error);
  }, []);

  const statCards = [
    { label: 'Total Requests', value: stats.total, color: 'var(--color-accent)' },
    { label: 'Pending Approval', value: stats.pending, color: 'var(--color-warning)' },
    { label: 'Provisioned', value: stats.provisioned, color: 'var(--color-success)' },
    { label: 'Failed', value: stats.failed, color: 'var(--color-danger)' },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Welcome back, {user?.name}</h1>
      <p style={{ color: 'var(--color-muted)', marginBottom: 32 }}>Here's what's happening with your cloud resources.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {statCards.map((s) => (
          <div key={s.label} className="card">
            <div style={{ fontSize: 32, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ color: 'var(--color-muted)', fontSize: 13, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>Recent Requests</h2>
          <Link to="/requests" style={{ fontSize: 13 }}>View all →</Link>
        </div>
        <table>
          <thead>
            <tr>
              <th>Resource</th>
              <th>Project</th>
              <th>Environment</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentRequests.length === 0 && (
              <tr><td colSpan={4} style={{ color: 'var(--color-muted)', textAlign: 'center', padding: 32 }}>No requests yet</td></tr>
            )}
            {recentRequests.map((r) => (
              <tr key={r.id}>
                <td>{r.resourceType}</td>
                <td>{r.project?.name || '—'}</td>
                <td>{r.environment}</td>
                <td><span className={`badge badge-${r.status.toLowerCase().replace('pendingapproval', 'pending')}`}>{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {user?.role === 'Developer' && (
        <div style={{ marginTop: 24 }}>
          <Link to="/chat">
            <button className="btn-primary" style={{ padding: '12px 24px', fontSize: 15 }}>
              💬 Start New Resource Request
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
