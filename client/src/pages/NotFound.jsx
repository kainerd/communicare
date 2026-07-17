import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NotFound() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div style={s.page}>
      <div style={s.card}>
        <span style={s.code}>404</span>
        <h2 style={s.title}>Page not found</h2>
        <p style={s.msg}>The page you're looking for doesn't exist or has been moved.</p>
        <button
          style={s.btn}
          onClick={() => navigate(user?.role === 'admin' ? '/admin' : user ? '/dashboard' : '/')}
        >
          ← Go back
        </button>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg,#1e3a5f,#0f172a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Segoe UI', system-ui, sans-serif" },
  card: { background: '#fff', borderRadius: '16px', padding: '56px 48px', textAlign: 'center', maxWidth: '400px', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' },
  code: { fontSize: '5rem', fontWeight: '900', color: '#e2e8f0', display: 'block', lineHeight: 1, marginBottom: '8px' },
  title: { fontSize: '1.5rem', fontWeight: '800', color: '#1e3a5f', marginBottom: '10px' },
  msg: { color: '#64748b', fontSize: '0.9rem', marginBottom: '28px', lineHeight: 1.6 },
  btn: { padding: '11px 28px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem' },
};
