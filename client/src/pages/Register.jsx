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
    if (form.password !== form.confirm) return setError('Passwords do not match.');
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

  // ── Success state ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div style={s.page} className="auth-page">
        <div style={s.card} className="auth-card">
          <div style={s.successIcon}>✅</div>
          <h2 style={s.successTitle}>Registration Received</h2>
          <p style={s.successMsg}>
            Your account is <strong>pending admin approval</strong>. Once approved, you will
            receive a verification email at <strong>{form.email}</strong> with a link to
            activate your account.
          </p>
          <p style={s.successSub}>You can log in after completing email verification.</p>
          <Link to="/login" style={s.backLink}>← Back to Sign In</Link>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div style={s.page} className="auth-page">
      <div style={s.card} className="auth-card">

        <div style={s.logoArea} className="cc-auth-logo">
          <span style={s.logoIcon}>🩺</span>
          <span style={s.logoText}>CommuniCare</span>
        </div>

        <h2 style={s.title} className="cc-auth-title">Create Caregiver Account</h2>
        <p style={s.subtitle}>Register to start supporting patients</p>

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.field}>
            <label style={s.label} htmlFor="name">Full Name</label>
            <input id="name" style={s.input} name="name" value={form.name}
              onChange={handleChange} placeholder="Dr. Emmanuel Adjei" required />
          </div>

          <div style={s.field}>
            <label style={s.label} htmlFor="reg-email">Email address</label>
            <input id="reg-email" style={s.input} type="email" name="email" value={form.email}
              onChange={handleChange} placeholder="you@hospital.com" required autoComplete="email" />
          </div>

          <div style={s.field}>
            <label style={s.label} htmlFor="reg-pw">Password</label>
            <input id="reg-pw" style={s.input} type="password" name="password" value={form.password}
              onChange={handleChange} placeholder="Min. 6 characters" required autoComplete="new-password" />
          </div>

          <div style={s.field}>
            <label style={s.label} htmlFor="reg-confirm">Confirm Password</label>
            <input id="reg-confirm" style={s.input} type="password" name="confirm" value={form.confirm}
              onChange={handleChange} placeholder="Repeat password" required autoComplete="new-password" />
          </div>

          {error && <p style={s.error} role="alert">{error}</p>}

          <div style={s.notice} role="note">
            ℹ️ New accounts require <strong>admin approval</strong> before you can sign in.
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
  logoText: { fontSize: '1.5rem', fontWeight: '800', color: '#1565c0', letterSpacing: '-0.02em' },

  title: { textAlign: 'center', fontSize: '1.375rem', fontWeight: '800', color: '#0f1c2e', marginBottom: '4px' },
  subtitle: { textAlign: 'center', fontSize: '0.9rem', color: '#7a8fa0', marginBottom: '28px' },

  form: { display: 'flex', flexDirection: 'column', gap: '14px' },
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
    background: '#ffebee', color: '#c62828', border: '1px solid #ef9a9a',
    borderRadius: '10px', padding: '12px 16px', fontSize: '0.875rem', fontWeight: '500',
  },
  notice: {
    background: '#e3f2fd', color: '#1565c0', border: '1px solid #90caf9',
    borderRadius: '10px', padding: '12px 16px', fontSize: '0.875rem', lineHeight: 1.5,
  },
  btn: {
    padding: '14px', background: '#1565c0', color: '#fff', border: 'none',
    borderRadius: '10px', fontSize: '1rem', fontWeight: '700', cursor: 'pointer',
    marginTop: '4px', letterSpacing: '0.01em',
  },
  footer: { textAlign: 'center', marginTop: '20px', fontSize: '0.875rem', color: '#7a8fa0' },
  link: { color: '#1565c0', fontWeight: '700' },

  // Success state
  successIcon:  { fontSize: '3rem', textAlign: 'center', display: 'block', marginBottom: '16px' },
  successTitle: { fontSize: '1.375rem', fontWeight: '800', color: '#0f1c2e', textAlign: 'center', marginBottom: '14px' },
  successMsg:   { color: '#4f6070', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '10px', textAlign: 'center' },
  successSub:   { color: '#7a8fa0', fontSize: '0.85rem', textAlign: 'center', marginBottom: '24px' },
  backLink:     { display: 'block', textAlign: 'center', color: '#1565c0', fontWeight: '700', fontSize: '0.9rem' },
};
