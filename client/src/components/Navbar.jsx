import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav style={s.nav}>
      <span style={s.brand}>🩺 CommuniCare</span>
      {title && <span style={s.title}>{title}</span>}
      <div style={s.right}>
        <span style={s.name}>👤 {user?.name}</span>
        <button style={s.btn} onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}

const s = {
  nav: {
    background: '#1e3a5f', color: '#fff', padding: '14px 32px',
    display: 'flex', alignItems: 'center', gap: '16px',
    position: 'sticky', top: 0, zIndex: 100,
  },
  brand: { fontSize: '1.1rem', fontWeight: '800', flexShrink: 0 },
  title: { fontSize: '0.95rem', opacity: 0.7, flexGrow: 1 },
  right: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '14px' },
  name: { fontSize: '0.875rem', opacity: 0.85 },
  btn: {
    background: 'rgba(255,255,255,0.15)', color: '#fff',
    border: '1px solid rgba(255,255,255,0.3)', borderRadius: '6px',
    padding: '6px 14px', cursor: 'pointer', fontSize: '0.85rem',
  },
};
