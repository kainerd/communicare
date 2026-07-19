import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import apiClient from '../api/client';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token found in the link.');
      return;
    }

    apiClient.get(`/auth/verify?token=${encodeURIComponent(token)}`)
      .then(({ data }) => {
        setStatus('success');
        setMessage(data.message);
        setEmail(data.email || '');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Verification failed. The link may have expired.');
      });
  }, [token]);

  return (
    <div style={s.page} className="auth-page">
      <div style={s.card} className="auth-card">
        {status === 'loading' && (
          <>
            <span style={s.icon}>⏳</span>
            <h2 style={s.title}>Verifying your email…</h2>
            <p style={s.sub}>Please wait.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <span style={s.icon}>✅</span>
            <h2 style={{ ...s.title, color: '#16a34a' }}>Email Verified!</h2>
            <p style={s.sub}>{message}</p>
            {email && <p style={s.emailBadge}>{email}</p>}
            <Link to="/login" style={s.btn}>Go to Login →</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <span style={s.icon}>❌</span>
            <h2 style={{ ...s.title, color: '#dc2626' }}>Verification Failed</h2>
            <p style={s.sub}>{message}</p>
            <p style={s.hint}>If your link has expired, contact your administrator to resend the approval email.</p>
            <Link to="/login" style={{ ...s.btn, background: '#64748b' }}>← Back to Login</Link>
          </>
        )}
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
  card: { background: '#fff', borderRadius: '16px', padding: '48px 40px', width: '100%', maxWidth: '420px', textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' },
  icon: { fontSize: '3rem', display: 'block', marginBottom: '16px' },
  title: { fontSize: '1.4rem', fontWeight: '800', color: '#1e3a5f', marginBottom: '10px' },
  sub: { color: '#475569', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '16px' },
  emailBadge: { background: '#f0fdf4', color: '#16a34a', padding: '6px 14px', borderRadius: '999px', display: 'inline-block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '20px' },
  hint: { color: '#94a3b8', fontSize: '0.82rem', marginBottom: '20px', lineHeight: 1.5 },
  btn: { display: 'inline-block', padding: '12px 28px', background: '#1e3a5f', color: '#fff', borderRadius: '8px', fontWeight: '700', textDecoration: 'none', fontSize: '0.95rem', marginTop: '4px' },
};
