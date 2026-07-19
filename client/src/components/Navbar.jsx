import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WeatherClock from './WeatherClock';

export default function Navbar({ title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef(null);

  useEffect(() => {
    function handleOutside(e) {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  function handleLogout() {
    logout();
    navigate('/login');
    setMenuOpen(false);
  }

  return (
    <nav style={s.nav} className="cc-nav" ref={navRef}>
      {/* Brand */}
      <div style={s.brandGroup}>
        <span style={s.brandIcon}>🩺</span>
        <span style={s.brand}>CommuniCare</span>
        {title && <span style={s.divider} aria-hidden>|</span>}
        {title && <span style={s.title}>{title}</span>}
      </div>

      {/* Center: WeatherClock — hidden on mobile via CSS */}
      <div style={s.center} className="cc-nav-center">
        <WeatherClock compact />
      </div>

      {/* Right: user + logout — hidden on mobile via CSS */}
      <div style={s.right} className="cc-nav-right">
        <span style={s.name}>
          <span style={s.nameIcon}>👤</span>
          {user?.name}
        </span>
        <button style={s.logoutBtn} onClick={handleLogout}>Sign out</button>
      </div>

      {/* Hamburger — only visible on mobile via CSS */}
      <button
        className={`cc-hamburger${menuOpen ? ' is-open' : ''}`}
        onClick={() => setMenuOpen((o) => !o)}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
        data-notab
      >
        <span />
        <span />
        <span />
      </button>

      {/* Mobile dropdown */}
      <div className={`cc-mobile-menu${menuOpen ? ' is-open' : ''}`}>
        <div className="cc-mobile-weather">
          <WeatherClock compact />
        </div>
        <div style={s.mobileUserRow}>
          <span style={s.mobileNameIcon}>👤</span>
          <span style={s.mobileName}>{user?.name}</span>
        </div>
        <button style={s.mobileLogoutBtn} onClick={handleLogout}>
          Sign out
        </button>
      </div>
    </nav>
  );
}

const s = {
  nav: {
    background: 'linear-gradient(90deg, #1565c0 0%, #1976d2 100%)',
    color: '#fff',
    padding: '0 28px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 2px 12px rgba(13,71,161,0.25)',
  },

  brandGroup: { display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 },
  brandIcon:  { fontSize: '1.3rem', lineHeight: 1 },
  brand:      { fontSize: '1.1rem', fontWeight: '800', letterSpacing: '-0.01em', color: '#fff' },
  divider:    { opacity: 0.35, fontSize: '1rem', margin: '0 2px' },
  title:      { fontSize: '0.9rem', fontWeight: '500', opacity: 0.8, color: '#fff' },

  center: { flex: 1, display: 'flex', justifyContent: 'center' },

  right: {
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexShrink: 0,
  },
  nameIcon: { marginRight: '4px', fontSize: '0.9rem' },
  name: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    background: 'rgba(255,255,255,0.12)',
    padding: '5px 12px',
    borderRadius: '999px',
  },
  logoutBtn: {
    background: 'rgba(255,255,255,0.15)',
    color: '#fff',
    border: '1.5px solid rgba(255,255,255,0.4)',
    borderRadius: '8px',
    padding: '6px 16px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '600',
    transition: 'background .15s',
  },

  // Mobile dropdown items
  mobileUserRow: { display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' },
  mobileNameIcon: { fontSize: '1rem' },
  mobileName: { fontSize: '0.95rem', fontWeight: '600', color: '#fff' },
  mobileLogoutBtn: {
    background: 'rgba(255,255,255,0.12)',
    color: '#fff',
    border: '1.5px solid rgba(255,255,255,0.3)',
    borderRadius: '10px',
    padding: '12px 16px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '700',
    textAlign: 'left',
    width: '100%',
    marginTop: '4px',
  },
};
