import React, { useEffect, useState } from 'react';
import { requests } from '../api/client';

const STATUS_LABELS = {
  Draft: 'draft', PendingApproval: 'pending', Approved: 'approved',
  Rejected: 'rejected', Provisioning: 'provisioning', Provisioned: 'provisioned', Failed: 'failed',
};

export default function Requests() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    requests.list()
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Resource Requests</h1>
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" /></div>
        ) : (
        <table>
          <thead>
            <tr>
              <th>Resource</th>
              <th>Project</th>
              <th>Team</th>
              <th>Environment</th>
              <th>Requested By</th>
              <th>Status</th>
              <th>Raised</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--color-muted)' }}>No requests found</td></tr>
            )}
            {data.map((r) => (
              <tr key={r.id}>
                <td style={{ fontWeight: 500 }}>{r.resourceType}</td>
                <td>{r.project?.name || '—'}</td>
                <td>{r.team?.name || '—'}</td>
                <td>{r.environment}</td>
                <td>{r.requestedBy?.name || '—'}</td>
                <td><span className={`badge badge-${STATUS_LABELS[r.status] || 'draft'}`}>{r.status}</span></td>
                <td style={{ color: 'var(--color-muted)', fontSize: 13 }}>{new Date(r.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
}
