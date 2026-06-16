import React, { useEffect, useState } from 'react';
import { users, teams as teamsApi } from '../../api/client';

const ROLES = ['Admin', 'Manager', 'Developer', 'CloudEngineer'];

export default function Users() {
  const [data, setData] = useState([]);
  const [allTeams, setAllTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'Developer' });
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [teamPickerUserId, setTeamPickerUserId] = useState(null);
  const [selectedTeamIds, setSelectedTeamIds] = useState([]);
  const [savingTeams, setSavingTeams] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([users.list(), teamsApi.list()])
      .then(([ur, tr]) => { setData(ur.data); setAllTeams(tr.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openTeamPicker = (u) => {
    setTeamPickerUserId(u.id);
    setSelectedTeamIds((u.teams || []).map((t) => t.id));
  };

  const toggleTeam = (teamId) => {
    setSelectedTeamIds((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    );
  };

  const saveTeams = async () => {
    setSavingTeams(true);
    try {
      await users.updateTeams(teamPickerUserId, selectedTeamIds);
      setTeamPickerUserId(null);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingTeams(false);
    }
  };

  const toggleStatus = async (user) => {
    const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    await users.update(user.id, { status: newStatus });
    load();
  };

  const changeRole = async (user, role) => {
    await users.update(user.id, { role });
    load();
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');
    setInviting(true);
    try {
      await users.create(form);
      setInviteSuccess(`Invitation sent to ${form.email}`);
      setForm({ name: '', email: '', role: 'Developer' });
      setShowInvite(false);
      load();
    } catch (err) {
      setInviteError(err.response?.data?.error || 'Failed to create user');
    } finally {
      setInviting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Users</h1>
        <button onClick={() => { setShowInvite(!showInvite); setInviteError(''); setInviteSuccess(''); }}>
          {showInvite ? 'Cancel' : 'Invite User'}
        </button>
      </div>

      {inviteSuccess && (
        <div className="card" style={{ padding: '12px 16px', marginBottom: 16, borderLeft: '4px solid var(--color-success, #22c55e)', color: 'var(--color-success, #22c55e)' }}>
          {inviteSuccess}
        </div>
      )}

      {showInvite && (
        <div className="card" style={{ padding: 20, marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Invite New User</h2>
          <form onSubmit={handleInvite} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 160px' }}>
              <label style={{ fontSize: 12, color: 'var(--color-muted)' }}>Full Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Jane Smith"
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 200px' }}>
              <label style={{ fontSize: 12, color: 'var(--color-muted)' }}>Email Address</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="jane@company.com"
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '0 0 160px' }}>
              <label style={{ fontSize: 12, color: 'var(--color-muted)' }}>Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} style={{ width: 'auto' }}>
                {ROLES.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <button type="submit" disabled={inviting} style={{ flex: '0 0 auto' }}>
              {inviting ? 'Sending…' : 'Send Invite'}
            </button>
          </form>
          {inviteError && <p style={{ color: 'var(--color-danger, #ef4444)', marginTop: 8, fontSize: 13 }}>{inviteError}</p>}
        </div>
      )}

      {teamPickerUserId && (() => {
        const u = data.find((x) => x.id === teamPickerUserId);
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div className="card" style={{ width: 360, padding: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Assign Teams</h2>
              <p style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 16 }}>{u?.name}</p>
              {allTeams.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--color-muted)' }}>No teams exist yet. Create one in Admin → Teams first.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                  {allTeams.map((t) => (
                    <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
                      <input
                        type="checkbox"
                        checked={selectedTeamIds.includes(t.id)}
                        onChange={() => toggleTeam(t.id)}
                      />
                      <span>{t.name}</span>
                      {t.manager && <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>({t.manager.name})</span>}
                    </label>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setTeamPickerUserId(null)} style={{ background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>Cancel</button>
                <button onClick={saveTeams} disabled={savingTeams}>{savingTeams ? 'Saving…' : 'Save'}</button>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" /></div>
        ) : (
        <table>
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Teams</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--color-muted)' }}>No users yet</td></tr>
            )}
            {data.map((u) => (
              <tr key={u.id}>
                <td style={{ fontWeight: 500 }}>
                  {u.name}
                  {u.mustChangePassword && (
                    <span style={{ marginLeft: 8, fontSize: 11, background: 'var(--color-warning, #f59e0b)', color: '#fff', borderRadius: 4, padding: '1px 6px' }}>
                      Pending setup
                    </span>
                  )}
                </td>
                <td style={{ color: 'var(--color-muted)' }}>{u.email}</td>
                <td>
                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u, e.target.value)}
                    style={{ width: 'auto', padding: '4px 8px' }}
                  >
                    {ROLES.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </td>
                <td>
                  <span
                    onClick={() => openTeamPicker(u)}
                    style={{ cursor: 'pointer', fontSize: 13, color: 'var(--color-accent)', textDecoration: 'underline' }}
                  >
                    {(u.teams || []).length > 0 ? (u.teams || []).map((t) => t.name).join(', ') : 'Assign teams'}
                  </span>
                </td>
                <td>
                  <span className={`badge badge-${u.status === 'Active' ? 'approved' : 'rejected'}`}>
                    {u.status}
                  </span>
                </td>
                <td>
                  <button
                    className={u.status === 'Active' ? 'btn-danger' : 'btn-success'}
                    style={{ fontSize: 12, padding: '4px 10px' }}
                    onClick={() => toggleStatus(u)}
                  >
                    {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
}
