import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

export default function Login() {
  const { storeSession } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.logo}>🩺 CommuniCare</h1>
        <h2 style={s.title}>Sign In</h2>
        <form onSubmit={handleSubmit} style={s.form}>
          <label style={s.label}>Email</label>
          <input
            style={s.input}
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
          <label style={s.label}>Password</label>
          <input
            style={s.input}
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
          {error && <p style={s.error}>{error}</p>}
          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <p style={s.footer}>
          No account?{' '}
          <Link to="/register" style={s.link}>
            Register as caregiver
          </Link>
        </p>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    padding: '40px 48px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
  },
  logo: { textAlign: 'center', fontSize: '1.5rem', marginBottom: '4px', color: '#1e3a5f' },
  title: { textAlign: 'center', fontSize: '1.25rem', fontWeight: '700', color: '#334155', marginBottom: '28px' },
  form: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginTop: '10px' },
  input: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1.5px solid #cbd5e1',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color .2s',
  },
  error: {
    background: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '0.85rem',
    marginTop: '8px',
  },
  btn: {
    marginTop: '20px',
    padding: '12px',
    background: '#1e3a5f',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '700',
    cursor: 'pointer',
  },
  footer: { textAlign: 'center', marginTop: '20px', fontSize: '0.875rem', color: '#64748b' },
  link: { color: '#1e3a5f', fontWeight: '600' },
};
