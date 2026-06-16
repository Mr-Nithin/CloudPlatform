import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: 380, boxShadow: '0 4px 24px rgba(28,25,23,0.08)' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>☁️ CloudPlatform</h1>
        <p style={{ color: 'var(--color-muted)', marginBottom: 24, fontSize: 14 }}>Sign in to your account</p>

        {error && (
          <div style={{ background: 'var(--color-error-bg)', border: '1px solid var(--color-error-border)', borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: 16, fontSize: 14, color: 'var(--color-danger)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--color-muted)', marginBottom: 6 }}>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required placeholder="you@example.com" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--color-muted)', marginBottom: 6 }}>Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required placeholder="••••••••" />
          </div>
          <button type="submit" className="btn-primary" style={{ marginTop: 8 }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
