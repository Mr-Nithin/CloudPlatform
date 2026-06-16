import React, { useEffect, useState } from 'react';
import { templates } from '../../api/client';

const EMPTY_FORM = { resourceType: '', provider: 'AWS', engine: 'CloudFormation', body: '', parameters: '[]' };

function TemplateForm({ title, form, setForm, onSubmit, onCancel, submitLabel }) {
  return (
    <form onSubmit={onSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
      <div style={{ fontWeight: 600, fontSize: 15 }}>{title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        <div>
          <label style={{ fontSize: 12, color: 'var(--color-muted)', display: 'block', marginBottom: 4 }}>Resource Type</label>
          <input value={form.resourceType} onChange={(e) => setForm({ ...form, resourceType: e.target.value })} placeholder="S3" required />
        </div>
        <div>
          <label style={{ fontSize: 12, color: 'var(--color-muted)', display: 'block', marginBottom: 4 }}>Provider</label>
          <select value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })}>
            <option>AWS</option><option>Azure</option><option>GCP</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, color: 'var(--color-muted)', display: 'block', marginBottom: 4 }}>Engine</label>
          <select value={form.engine} onChange={(e) => setForm({ ...form, engine: e.target.value })}>
            <option>CloudFormation</option><option>Terraform</option>
          </select>
        </div>
      </div>
      <div>
        <label style={{ fontSize: 12, color: 'var(--color-muted)', display: 'block', marginBottom: 4 }}>Template Body (YAML/JSON with {'{token}'} placeholders)</label>
        <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={14} style={{ fontFamily: 'monospace', fontSize: 12 }} required />
      </div>
      <div>
        <label style={{ fontSize: 12, color: 'var(--color-muted)', display: 'block', marginBottom: 4 }}>Required Parameters (JSON array of strings)</label>
        <input value={form.parameters} onChange={(e) => setForm({ ...form, parameters: e.target.value })} placeholder='["bucketName", "versioning"]' />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button type="button" onClick={onCancel} style={{ background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: 'var(--radius)', padding: '6px 16px', cursor: 'pointer' }}>
          Cancel
        </button>
        <button type="submit" className="btn-primary">{submitLabel}</button>
      </div>
    </form>
  );
}

export default function Templates() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [editTemplate, setEditTemplate] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  const load = () => {
    setLoading(true);
    templates.list().then((r) => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await templates.create({ ...createForm, parameters: JSON.parse(createForm.parameters) });
      setShowCreate(false);
      setCreateForm(EMPTY_FORM);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create template.');
    }
  };

  const openEdit = (t) => {
    setEditTemplate(t);
    setEditForm({
      resourceType: t.resourceType || '',
      provider: t.provider || 'AWS',
      engine: t.engine || 'CloudFormation',
      body: t.body || '',
      parameters: JSON.stringify(t.parameters || []),
    });
    setShowCreate(false);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await templates.update(editTemplate.id, { ...editForm, parameters: JSON.parse(editForm.parameters) });
      setEditTemplate(null);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update template.');
    }
  };

  const handleDelete = async (t) => {
    if (!window.confirm(`Delete template "${t.resourceType}" v${t.version}? This cannot be undone.`)) return;
    try {
      await templates.delete(t.id);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete template.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>IaC Templates</h1>
        <button className="btn-primary" onClick={() => { setShowCreate(!showCreate); setEditTemplate(null); }}>
          {showCreate ? 'Cancel' : '+ Upload Template'}
        </button>
      </div>

      {showCreate && (
        <TemplateForm
          title="New IaC Template"
          form={createForm}
          setForm={setCreateForm}
          onSubmit={handleCreate}
          onCancel={() => { setShowCreate(false); setCreateForm(EMPTY_FORM); }}
          submitLabel="Upload Template"
        />
      )}

      {editTemplate && (
        <TemplateForm
          title={`Edit — ${editTemplate.resourceType} v${editTemplate.version}`}
          form={editForm}
          setForm={setEditForm}
          onSubmit={handleEdit}
          onCancel={() => setEditTemplate(null)}
          submitLabel="Save Changes"
        />
      )}

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" /></div>
        ) : (
          <table>
            <thead>
              <tr><th>Resource Type</th><th>Provider</th><th>Engine</th><th>Version</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {data.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--color-muted)' }}>No templates yet</td></tr>
              )}
              {data.map((t) => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 500 }}>{t.resourceType}</td>
                  <td>{t.provider}</td>
                  <td>{t.engine}</td>
                  <td style={{ color: 'var(--color-muted)' }}>v{t.version}</td>
                  <td><span className={`badge badge-${t.isActive ? 'approved' : 'rejected'}`}>{t.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(t)} style={{ fontSize: 12, padding: '4px 10px' }}>Edit</button>
                      <button onClick={() => handleDelete(t)} className="btn-danger" style={{ fontSize: 12, padding: '4px 10px' }}>Delete</button>
                    </div>
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
