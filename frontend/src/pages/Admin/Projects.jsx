import React, { useEffect, useState } from 'react';
import { projects, accounts as accountsApi, teams as teamsApi } from '../../api/client';

export default function Projects() {
  const [data, setData] = useState([]);
  const [accountList, setAccountList] = useState([]);
  const [allTeams, setAllTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', accountId: '', region: '', environment: 'dev' });
  const [showForm, setShowForm] = useState(false);

  // Team picker state
  const [teamPickerProject, setTeamPickerProject] = useState(null);
  const [selectedTeamIds, setSelectedTeamIds] = useState([]);
  const [savingTeams, setSavingTeams] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([projects.list(), accountsApi.list(), teamsApi.list()])
      .then(([pr, ar, tr]) => {
        setData(pr.data);
        setAccountList(ar.data);
        setAllTeams(tr.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleAccountChange = (accountId) => {
    const account = accountList.find((a) => a.id === accountId);
    const firstRegion = account?.allowedRegions?.[0] || '';
    setForm({ ...form, accountId, region: firstRegion });
  };

  const selectedAccount = accountList.find((a) => a.id === form.accountId);
  const availableRegions = selectedAccount?.allowedRegions || [];

  const submit = async (e) => {
    e.preventDefault();
    await projects.create(form);
    setForm({ name: '', accountId: '', region: '', environment: 'dev' });
    setShowForm(false);
    load();
  };

  const openTeamPicker = (project) => {
    setTeamPickerProject(project);
    setSelectedTeamIds((project.teams || []).map((t) => t.id));
  };

  const toggleTeam = (teamId) => {
    setSelectedTeamIds((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    );
  };

  const saveTeams = async () => {
    setSavingTeams(true);
    try {
      await projects.updateTeams(teamPickerProject.id, selectedTeamIds);
      setTeamPickerProject(null);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingTeams(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Projects</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Project'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--color-muted)', display: 'block', marginBottom: 4 }}>Project Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. payments-api"
              required
            />
          </div>

          <div>
            <label style={{ fontSize: 12, color: 'var(--color-muted)', display: 'block', marginBottom: 4 }}>Cloud Account</label>
            <select
              value={form.accountId}
              onChange={(e) => handleAccountChange(e.target.value)}
              required
            >
              <option value="">Select account…</option>
              {accountList.map((a) => (
                <option key={a.id} value={a.id}>{a.alias || a.name} ({a.provider})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 12, color: 'var(--color-muted)', display: 'block', marginBottom: 4 }}>Region</label>
            <select
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
              required
              disabled={!form.accountId}
            >
              <option value="">{form.accountId ? 'Select region…' : 'Select account first'}</option>
              {availableRegions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 12, color: 'var(--color-muted)', display: 'block', marginBottom: 4 }}>Environment</label>
            <select value={form.environment} onChange={(e) => setForm({ ...form, environment: e.target.value })}>
              <option value="dev">dev</option>
              <option value="staging">staging</option>
              <option value="prod">prod</option>
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn-primary">Create Project</button>
          </div>
        </form>
      )}

      {/* Team picker modal */}
      {teamPickerProject && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: 400, padding: 24, maxHeight: '80vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Assign Teams</h2>
            <p style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 16 }}>{teamPickerProject.name}</p>
            {allTeams.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--color-muted)' }}>No teams yet. Create one in Admin → Teams first.</p>
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
              <button
                onClick={() => setTeamPickerProject(null)}
                style={{ background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              >
                Cancel
              </button>
              <button className="btn-primary" onClick={saveTeams} disabled={savingTeams}>
                {savingTeams ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" /></div>
        ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Account</th>
              <th>Region</th>
              <th>Environment</th>
              <th>Teams</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--color-muted)' }}>No projects yet</td></tr>
            )}
            {data.map((p) => (
              <tr key={p.id}>
                <td style={{ fontWeight: 500 }}>{p.name}</td>
                <td style={{ color: 'var(--color-muted)' }}>{p.account?.alias || p.account?.name || '—'}</td>
                <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{p.region}</td>
                <td><span className="badge badge-draft">{p.environment}</span></td>
                <td>
                  <span
                    onClick={() => openTeamPicker(p)}
                    style={{ cursor: 'pointer', fontSize: 13, color: 'var(--color-accent)', textDecoration: 'underline' }}
                  >
                    {(p.teams || []).length > 0
                      ? (p.teams || []).map((t) => t.name).join(', ')
                      : 'Assign teams'}
                  </span>
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
