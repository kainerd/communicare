import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

export default function Login() {
  const { storeSession } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const expired = searchParams.get('expired') === '1';

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.post('/auth/login', form);
      storeSession(data.token, data.user);
      if (data.user.role === 'admin') navigate('/admin');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.page} className="auth-page">
      <div style={s.card} className="auth-card">

        {/* Brand mark */}
        <div style={s.logoArea} className="cc-auth-logo">
          <span style={s.logoIcon}>🩺</span>
          <span style={s.logoText}>CommuniCare</span>
        </div>

        <h2 style={s.title} className="cc-auth-title">Welcome back</h2>
        <p style={s.subtitle}>Sign in to your caregiver account</p>

        {expired && (
          <p style={s.notice} role="alert">
            Your session has expired. Please sign in again.
          </p>
        )}

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.field}>
            <label style={s.label} htmlFor="email">Email address</label>
            <input
              id="email"
              style={s.input}
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@hospital.com"
              required
              autoComplete="email"
            />
          </div>

          <div style={s.field}>
            <label style={s.label} htmlFor="password">Password</label>
            <input
              id="password"
              style={s.input}
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {error && <p style={s.error} role="alert">{error}</p>}

          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p style={s.footer}>
          No account?{' '}
          <Link to="/register" style={s.link}>Register as caregiver</Link>
        </p>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #1565c0 0%, #0d47a1 55%, #01579b 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    padding: '24px',
  },
  card: {
    background: '#ffffff',
    borderRadius: '20px',
    padding: '44px 48px',
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0 24px 80px rgba(13,71,161,0.3)',
  },

  logoArea: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '20px',
  },
  logoIcon: { fontSize: '2rem', lineHeight: 1 },
  logoText: {
    fontSize: '1.5rem',
    fontWeight: '800',
    color: '#1565c0',
    letterSpacing: '-0.02em',
  },

  title: {
    textAlign: 'center',
    fontSize: '1.375rem',
    fontWeight: '800',
    color: '#0f1c2e',
    marginBottom: '4px',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: '0.9rem',
    color: '#7a8fa0',
    marginBottom: '28px',
  },

  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '0.875rem', fontWeight: '600', color: '#4f6070' },
  input: {
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1.5px solid #dde3ea',
    fontSize: '1rem',
    outline: 'none',
    fontFamily: 'inherit',
    color: '#0f1c2e',
    transition: 'border-color .2s',
    width: '100%',
  },
  error: {
    background: '#ffebee',
    color: '#c62828',
    border: '1px solid #ef9a9a',
    borderRadius: '10px',
    padding: '12px 16px',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  notice: {
    background: '#fff3e0',
    color: '#e65100',
    border: '1px solid #ffcc80',
    borderRadius: '10px',
    padding: '12px 16px',
    fontSize: '0.875rem',
    fontWeight: '500',
    marginBottom: '16px',
    textAlign: 'center',
  },
  btn: {
    padding: '14px',
    background: '#1565c0',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '1rem',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '4px',
    letterSpacing: '0.01em',
  },
  footer: { textAlign: 'center', marginTop: '20px', fontSize: '0.875rem', color: '#7a8fa0' },
  link: { color: '#1565c0', fontWeight: '700' },
};
