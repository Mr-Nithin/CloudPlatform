import React, { useEffect, useState } from 'react';
import { teams, users as usersApi } from '../../api/client';

export default function Teams() {
  const [data, setData] = useState([]);
  const [managers, setManagers] = useState([]);
  const [form, setForm] = useState({ name: '', managerId: '' });
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([teams.list(), usersApi.list()])
      .then(([tr, ur]) => {
        setData(tr.data);
        setManagers(ur.data.filter((u) => ['Manager', 'Admin'].includes(u.role)));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const submit = async (e) => {
    e.preventDefault();
    await teams.create(form);
    setForm({ name: '', managerId: '' });
    load();
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Teams</h1>

      <form onSubmit={submit} className="card" style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 12, color: 'var(--color-muted)', display: 'block', marginBottom: 4 }}>Team Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. payments-team" required />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 12, color: 'var(--color-muted)', display: 'block', marginBottom: 4 }}>Manager</label>
          <select value={form.managerId} onChange={(e) => setForm({ ...form, managerId: e.target.value })} required>
            <option value="">Select manager...</option>
            {managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <button type="submit" className="btn-primary">Create Team</button>
      </form>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" /></div>
        ) : (
          <table>
            <thead><tr><th>Team Name</th><th>Manager</th><th>Members</th></tr></thead>
            <tbody>
              {data.length === 0 && (
                <tr><td colSpan={3} style={{ textAlign: 'center', padding: 40, color: 'var(--color-muted)' }}>No teams yet</td></tr>
              )}
              {data.map((t) => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 500 }}>{t.name}</td>
                  <td>{t.manager?.name || '—'}</td>
                  <td style={{ color: 'var(--color-muted)' }}>{t.members?.map((m) => m.name).join(', ') || 'No members'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
