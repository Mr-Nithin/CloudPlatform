import React, { useEffect, useState } from 'react';
import { auditLogs } from '../../api/client';

export default function AuditLogs() {
  const [data, setData] = useState({ rows: [], count: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ entity: '', limit: 50 });

  const load = () => {
    setLoading(true);
    const params = {};
    if (filter.entity) params.entity = filter.entity;
    params.limit = filter.limit;
    auditLogs.list(params).then((r) => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(load, []);

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Audit Log</h1>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <select value={filter.entity} onChange={(e) => setFilter({ ...filter, entity: e.target.value })} style={{ width: 160 }}>
          <option value="">All entities</option>
          {['Request', 'User', 'Account', 'Team', 'Project', 'NamingConvention'].map((e) => <option key={e}>{e}</option>)}
        </select>
        <button className="btn-secondary" onClick={load}>Filter</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" /></div>
        ) : (
          <table>
            <thead><tr><th>Action</th><th>Entity</th><th>User</th><th>Time</th></tr></thead>
            <tbody>
              {(data.rows || []).length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--color-muted)' }}>No logs found</td></tr>}
              {(data.rows || []).map((l) => (
                <tr key={l.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{l.action}</td>
                  <td style={{ color: 'var(--color-muted)' }}>{l.entity}{l.entityId ? ` (${l.entityId.slice(0, 8)}...)` : ''}</td>
                  <td>{l.user?.name || 'system'}</td>
                  <td style={{ color: 'var(--color-muted)', fontSize: 13 }}>{new Date(l.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
