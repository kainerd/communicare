import { useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) return setError('Passwords do not match');
    setLoading(true);
    setError('');
    try {
      await apiClient.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Success state ─────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <span style={s.successIcon}>✅</span>
          <h2 style={s.successTitle}>Registration Received</h2>
          <p style={s.successMsg}>
            Your account is <strong>pending admin approval</strong>. Once approved, you will receive
            a verification email at <strong>{form.email}</strong> with a link to activate your account.
          </p>
          <p style={s.successSub}>You will be able to log in after completing email verification.</p>
          <Link to="/login" style={s.loginLink}>← Back to Login</Link>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.logo}>🩺 CommuniCare</h1>
        <h2 style={s.title}>Create Caregiver Account</h2>
        <form onSubmit={handleSubmit} style={s.form}>
          <label style={s.label}>Full Name</label>
          <input style={s.input} name="name" value={form.name} onChange={handleChange} placeholder="Emmanuel" required />

          <label style={s.label}>Email</label>
          <input style={s.input} type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required autoComplete="email" />

          <label style={s.label}>Password</label>
          <input style={s.input} type="password" name="password" value={form.password} onChange={handleChange} placeholder="Min. 6 characters" required autoComplete="new-password" />

          <label style={s.label}>Confirm Password</label>
          <input style={s.input} type="password" name="confirm" value={form.confirm} onChange={handleChange} placeholder="Repeat password" required autoComplete="new-password" />

          {error && <p style={s.error}>{error}</p>}

          <div style={s.notice}>
            ℹ️ New accounts require admin approval before you can log in.
          </div>

          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? 'Submitting…' : 'Submit Registration'}
          </button>
        </form>
        <p style={s.footer}>
          Already have an account?{' '}
          <Link to="/login" style={s.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh', background: 'linear-gradient(135deg,#1e3a5f,#0f172a)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  card: { background: '#fff', borderRadius: '16px', padding: '40px 48px', width: '100%', maxWidth: '420px', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' },
  logo: { textAlign: 'center', fontSize: '1.5rem', marginBottom: '4px', color: '#1e3a5f' },
  title: { textAlign: 'center', fontSize: '1.2rem', fontWeight: '700', color: '#334155', marginBottom: '24px' },
  form: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginTop: '10px' },
  input: { padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', fontFamily: 'inherit' },
  error: { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', fontSize: '0.85rem', marginTop: '8px' },
  notice: { background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 14px', fontSize: '0.82rem', marginTop: '12px' },
  btn: { marginTop: '20px', padding: '12px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '700', cursor: 'pointer' },
  footer: { textAlign: 'center', marginTop: '20px', fontSize: '0.875rem', color: '#64748b' },
  link: { color: '#1e3a5f', fontWeight: '600' },
  // success state
  successIcon: { fontSize: '3rem', display: 'block', textAlign: 'center', marginBottom: '16px' },
  successTitle: { fontSize: '1.3rem', fontWeight: '800', color: '#1e3a5f', textAlign: 'center', marginBottom: '12px' },
  successMsg: { color: '#475569', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '12px', textAlign: 'center' },
  successSub: { color: '#94a3b8', fontSize: '0.82rem', textAlign: 'center', marginBottom: '24px' },
  loginLink: { display: 'block', textAlign: 'center', color: '#1e3a5f', fontWeight: '700', fontSize: '0.9rem' },
};
