import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ChangePassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 8) return setError('Password must be at least 8 characters.');
    if (newPassword !== confirm) return setError('Passwords do not match.');
    setLoading(true);
    try {
      const res = await auth.changePassword(newPassword);
      setUser(res.data.user);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
      <div className="card" style={{ width: '100%', maxWidth: 400, padding: 32 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Set your password</h1>
        <p style={{ color: 'var(--color-muted)', marginBottom: 24, fontSize: 14 }}>
          You're using a temporary password. Please set a new one to continue.
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500 }}>New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoFocus
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500 }}>Confirm Password</label>
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat your new password"
            />
          </div>
          {error && <p style={{ color: 'var(--color-danger, #ef4444)', fontSize: 13, margin: 0 }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? 'Updating…' : 'Set Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
