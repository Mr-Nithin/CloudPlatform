import React, { useEffect, useState } from 'react';
import { requests } from '../../api/client';

export default function Approvals() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  const load = () => {
    requests.list()
      .then((res) => setData(res.data.filter((r) => r.status === 'PendingApproval')))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const approve = async (id) => {
    setProcessing(id);
    try { await requests.approve(id); load(); } catch (e) { alert(e.response?.data?.error || 'Failed'); }
    finally { setProcessing(null); }
  };

  const reject = async (id) => {
    const reason = window.prompt('Rejection reason (optional):');
    if (reason === null) return; // cancelled
    setProcessing(id);
    try { await requests.reject(id, reason); load(); } catch (e) { alert(e.response?.data?.error || 'Failed'); }
    finally { setProcessing(null); }
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Pending Approvals</h1>
      {loading ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}><div className="spinner" /></div>
      ) : data.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60, color: 'var(--color-muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <p>No pending approvals. All caught up!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {data.map((r) => (
            <div key={r.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>{r.resourceType}</div>
                  <div style={{ color: 'var(--color-muted)', fontSize: 13, marginTop: 4 }}>
                    {r.requestedBy?.name} • {r.project?.name} • {r.environment} • {r.account?.alias || r.account?.name}
                  </div>
                  {r.parameters && Object.keys(r.parameters).length > 0 && (
                    <pre style={{ marginTop: 12, fontSize: 12, background: 'var(--color-code-bg)', padding: 12, borderRadius: 6, color: 'var(--color-text)', border: '1px solid var(--color-border)' }}>
                      {JSON.stringify(r.parameters, null, 2)}
                    </pre>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn-success"
                    disabled={processing === r.id}
                    onClick={() => approve(r.id)}
                  >
                    {processing === r.id ? '...' : '✓ Approve'}
                  </button>
                  <button
                    className="btn-danger"
                    disabled={processing === r.id}
                    onClick={() => reject(r.id)}
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--color-muted)' }}>
                Raised {new Date(r.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
