import React, { useEffect, useState } from 'react';
import { resources } from '../api/client';

export default function Resources() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    resources.list()
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Provisioned Resources</h1>
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" /></div>
        ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Account</th>
              <th>Region</th>
              <th>ARN</th>
              <th>Provisioned</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--color-muted)' }}>No resources yet</td></tr>
            )}
            {data.map((r) => (
              <tr key={r.id}>
                <td style={{ fontWeight: 500 }}>{r.resourceName}</td>
                <td>{r.resourceType}</td>
                <td>{r.account?.alias || r.account?.name || '—'}</td>
                <td>{r.region || '—'}</td>
                <td style={{ fontSize: 12, color: 'var(--color-muted)', fontFamily: 'monospace' }}>{r.arn || '—'}</td>
                <td style={{ color: 'var(--color-muted)', fontSize: 13 }}>{r.provisionedAt ? new Date(r.provisionedAt).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
}
