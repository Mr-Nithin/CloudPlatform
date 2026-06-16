import React, { useEffect, useState } from 'react';
import { conventions } from '../../api/client';

const ENTITY_TYPES = ['Team', 'Project', 'Resource', 'Tag'];

export default function NamingConventions() {
  const [data, setData] = useState([]);
  const [form, setForm] = useState({ entityType: 'Resource', pattern: '' });
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    conventions.list().then((r) => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const submit = async (e) => {
    e.preventDefault();
    await conventions.create(form);
    setForm({ entityType: 'Resource', pattern: '' });
    load();
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Naming Conventions</h1>
      <p style={{ color: 'var(--color-muted)', fontSize: 14, marginBottom: 24 }}>
        Use tokens like <code style={{ background: 'var(--color-code-bg)', padding: '2px 6px', borderRadius: 4, color: 'var(--color-text)' }}>{'{team}'}</code>, <code style={{ background: 'var(--color-code-bg)', padding: '2px 6px', borderRadius: 4, color: 'var(--color-text)' }}>{'{project}'}</code>, <code style={{ background: 'var(--color-code-bg)', padding: '2px 6px', borderRadius: 4, color: 'var(--color-text)' }}>{'{env}'}</code>, <code style={{ background: 'var(--color-code-bg)', padding: '2px 6px', borderRadius: 4, color: 'var(--color-text)' }}>{'{resource}'}</code>, <code style={{ background: 'var(--color-code-bg)', padding: '2px 6px', borderRadius: 4, color: 'var(--color-text)' }}>{'{owner}'}</code>
      </p>

      <form onSubmit={submit} className="card" style={{ display: 'flex', gap: 16, marginBottom: 24, alignItems: 'flex-end' }}>
        <div>
          <label style={{ fontSize: 12, color: 'var(--color-muted)', display: 'block', marginBottom: 4 }}>Entity Type</label>
          <select value={form.entityType} onChange={(e) => setForm({ ...form, entityType: e.target.value })} style={{ width: 140 }}>
            {ENTITY_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 12, color: 'var(--color-muted)', display: 'block', marginBottom: 4 }}>Pattern</label>
          <input value={form.pattern} onChange={(e) => setForm({ ...form, pattern: e.target.value })} placeholder="{team}-{env}-{resource}" required />
        </div>
        <button type="submit" className="btn-primary">Save Convention</button>
      </form>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" /></div>
        ) : (
          <table>
            <thead><tr><th>Entity Type</th><th>Pattern</th><th>Version</th><th>Status</th></tr></thead>
            <tbody>
              {data.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 32, color: 'var(--color-muted)' }}>No conventions defined</td></tr>}
              {data.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>{c.entityType}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{c.pattern}</td>
                  <td style={{ color: 'var(--color-muted)' }}>v{c.version}</td>
                  <td><span className={`badge badge-${c.isActive ? 'approved' : 'rejected'}`}>{c.isActive ? 'Active' : 'Inactive'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
