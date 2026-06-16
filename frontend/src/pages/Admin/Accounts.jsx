import React, { useEffect, useState } from 'react';
import { accounts } from '../../api/client';

const REGIONS = {
  AWS: [
    'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
    'ca-central-1',
    'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1', 'eu-north-1',
    'ap-south-1', 'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2',
    'sa-east-1', 'af-south-1', 'me-south-1',
  ],
  Azure: [
    'eastus', 'eastus2', 'westus', 'westus2', 'centralus', 'northcentralus', 'southcentralus',
    'northeurope', 'westeurope', 'uksouth', 'ukwest',
    'eastasia', 'southeastasia', 'japaneast', 'japanwest', 'australiaeast', 'australiasoutheast',
    'brazilsouth', 'canadacentral', 'canadaeast', 'centralindia', 'southindia',
  ],
  GCP: [
    'us-central1', 'us-east1', 'us-east4', 'us-west1', 'us-west2', 'us-west3', 'us-west4',
    'northamerica-northeast1', 'southamerica-east1',
    'europe-west1', 'europe-west2', 'europe-west3', 'europe-west4', 'europe-west6', 'europe-north1',
    'asia-east1', 'asia-east2', 'asia-northeast1', 'asia-northeast2', 'asia-northeast3',
    'asia-south1', 'asia-southeast1', 'asia-southeast2', 'australia-southeast1',
  ],
};

const EMPTY_FORM = { alias: '', accountId: '', provider: 'AWS', environment: 'dev', roleArn: '', allowedRegions: [] };

function AccountForm({ title, form, setForm, onSubmit, onCancel, submitLabel }) {
  const [showRegionPicker, setShowRegionPicker] = useState(false);
  const availableRegions = REGIONS[form.provider] || [];

  const toggleRegion = (region) => {
    setForm((f) => ({
      ...f,
      allowedRegions: f.allowedRegions.includes(region)
        ? f.allowedRegions.filter((r) => r !== region)
        : [...f.allowedRegions, region],
    }));
  };

  const handleProviderChange = (provider) => {
    setForm((f) => ({ ...f, provider, allowedRegions: [] }));
  };

  return (
    <>
      <form onSubmit={onSubmit} className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ gridColumn: '1 / -1', fontWeight: 600, fontSize: 15 }}>{title}</div>

        <div>
          <label style={{ fontSize: 12, color: 'var(--color-muted)', display: 'block', marginBottom: 4 }}>Display Name</label>
          <input value={form.alias} onChange={(e) => setForm({ ...form, alias: e.target.value })} placeholder="e.g. Production AWS" required />
        </div>

        <div>
          <label style={{ fontSize: 12, color: 'var(--color-muted)', display: 'block', marginBottom: 4 }}>Account Number</label>
          <input value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })} placeholder="123456789012" required />
        </div>

        <div>
          <label style={{ fontSize: 12, color: 'var(--color-muted)', display: 'block', marginBottom: 4 }}>IAM Role ARN</label>
          <input value={form.roleArn} onChange={(e) => setForm({ ...form, roleArn: e.target.value })} placeholder="arn:aws:iam::..." />
        </div>

        <div>
          <label style={{ fontSize: 12, color: 'var(--color-muted)', display: 'block', marginBottom: 4 }}>Provider</label>
          <select value={form.provider} onChange={(e) => handleProviderChange(e.target.value)}>
            <option>AWS</option><option>Azure</option><option>GCP</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: 12, color: 'var(--color-muted)', display: 'block', marginBottom: 4 }}>Environment</label>
          <select value={form.environment} onChange={(e) => setForm({ ...form, environment: e.target.value })}>
            <option value="dev">dev</option><option value="staging">staging</option><option value="prod">prod</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: 12, color: 'var(--color-muted)', display: 'block', marginBottom: 4 }}>Allowed Regions</label>
          <button
            type="button"
            onClick={() => setShowRegionPicker(true)}
            style={{ width: '100%', textAlign: 'left', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '8px 12px', fontSize: 13, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span style={{ color: form.allowedRegions.length ? 'var(--color-text)' : 'var(--color-muted)' }}>
              {form.allowedRegions.length > 0 ? `${form.allowedRegions.length} region${form.allowedRegions.length !== 1 ? 's' : ''} selected` : 'Select regions…'}
            </span>
            <span style={{ color: 'var(--color-muted)', fontSize: 11 }}>▾</span>
          </button>
        </div>

        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={onCancel} style={{ background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: 'var(--radius)', padding: '6px 16px', cursor: 'pointer' }}>
            Cancel
          </button>
          <button type="submit" className="btn-primary">{submitLabel}</button>
        </div>
      </form>

      {/* Region picker modal */}
      {showRegionPicker && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="card" style={{ width: 640, padding: 0, maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Select Allowed Regions</div>
                <div style={{ fontSize: 13, color: 'var(--color-muted)', marginTop: 4 }}>
                  {form.provider} &mdash; <span style={{ color: 'var(--color-accent)' }}>{form.allowedRegions.length}</span> of {availableRegions.length} selected
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setForm((f) => ({ ...f, allowedRegions: [...availableRegions] }))}
                  style={{ fontSize: 13, padding: '6px 14px', background: 'var(--color-accent-bg)', border: '1px solid var(--color-accent-border)', borderRadius: 6, color: 'var(--color-accent)', cursor: 'pointer' }}>
                  Select All
                </button>
                <button type="button" onClick={() => setForm((f) => ({ ...f, allowedRegions: [] }))}
                  style={{ fontSize: 13, padding: '6px 14px', background: 'none', border: '1px solid var(--color-border)', borderRadius: 6, color: 'var(--color-muted)', cursor: 'pointer' }}>
                  Clear
                </button>
              </div>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: '12px 24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {availableRegions.map((region) => {
                  const checked = form.allowedRegions.includes(region);
                  return (
                    <label key={region} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, cursor: 'pointer', border: `1px solid ${checked ? 'var(--color-accent-border)' : 'var(--color-border)'}`, background: checked ? 'var(--color-accent-bg)' : 'transparent' }}>
                      <input type="checkbox" checked={checked} onChange={() => toggleRegion(region)} style={{ width: 16, height: 16, flexShrink: 0, cursor: 'pointer', accentColor: 'var(--color-accent)' }} />
                      <span style={{ fontFamily: 'monospace', fontSize: 13, color: checked ? 'var(--color-accent)' : 'var(--color-text)', fontWeight: checked ? 600 : 400 }}>{region}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>
                {form.allowedRegions.length > 0 ? form.allowedRegions.join(', ') : 'No regions selected'}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setShowRegionPicker(false)} style={{ background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: 'var(--radius)', padding: '8px 20px', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
                <button type="button" className="btn-primary" onClick={() => setShowRegionPicker(false)} style={{ padding: '8px 20px', fontSize: 13 }}>Done</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function Accounts() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [editAccount, setEditAccount] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  const load = () => {
    setLoading(true);
    accounts.list()
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    await accounts.create(createForm);
    setShowCreate(false);
    setCreateForm(EMPTY_FORM);
    load();
  };

  const openEdit = (account) => {
    setEditAccount(account);
    setEditForm({
      alias: account.alias || '',
      accountId: account.accountId || '',
      provider: account.provider || 'AWS',
      environment: account.environment || 'dev',
      roleArn: account.roleArn || '',
      allowedRegions: account.allowedRegions || [],
    });
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    await accounts.update(editAccount.id, editForm);
    setEditAccount(null);
    load();
  };

  const handleDelete = async (account) => {
    if (!window.confirm(`Delete "${account.alias || account.name}"? This cannot be undone.`)) return;
    try {
      await accounts.delete(account.id);
      load();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to delete account.';
      alert(msg);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Cloud Accounts</h1>
        <button className="btn-primary" onClick={() => { setShowCreate(!showCreate); setEditAccount(null); }}>
          {showCreate ? 'Cancel' : '+ Add Account'}
        </button>
      </div>

      {showCreate && (
        <AccountForm
          title="New Cloud Account"
          form={createForm}
          setForm={setCreateForm}
          onSubmit={handleCreate}
          onCancel={() => { setShowCreate(false); setCreateForm(EMPTY_FORM); }}
          submitLabel="Create Account"
        />
      )}

      {editAccount && (
        <AccountForm
          title={`Edit — ${editAccount.alias || editAccount.name}`}
          form={editForm}
          setForm={setEditForm}
          onSubmit={handleEdit}
          onCancel={() => setEditAccount(null)}
          submitLabel="Save Changes"
        />
      )}

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" /></div>
        ) : (
          <table>
            <thead>
              <tr><th>Display Name</th><th>Provider</th><th>Environment</th><th>Account Number</th><th>Allowed Regions</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {data.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--color-muted)' }}>No accounts yet</td></tr>
              )}
              {data.map((a) => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 500 }}>{a.alias || a.name}</td>
                  <td>{a.provider}</td>
                  <td><span className="badge badge-draft">{a.environment}</span></td>
                  <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{a.accountId}</td>
                  <td style={{ fontSize: 13, color: 'var(--color-muted)' }}>{(a.allowedRegions || []).join(', ') || '—'}</td>
                  <td><span className={`badge badge-${a.status === 'Active' ? 'approved' : 'rejected'}`}>{a.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(a)} style={{ fontSize: 12, padding: '4px 10px' }}>Edit</button>
                      <button onClick={() => handleDelete(a)} className="btn-danger" style={{ fontSize: 12, padding: '4px 10px' }}>Delete</button>
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
