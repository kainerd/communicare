import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={s.page}>
          <div style={s.card}>
            <span style={s.icon}>⚠️</span>
            <h2 style={s.title}>Something went wrong</h2>
            <p style={s.msg}>{this.state.error?.message || 'An unexpected error occurred.'}</p>
            <button style={s.btn} onClick={() => window.location.href = '/'}>
              Return to Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const s = {
  page: { minHeight: '100vh', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Segoe UI', system-ui, sans-serif" },
  card: { background: '#fff', borderRadius: '16px', padding: '48px 40px', textAlign: 'center', maxWidth: '420px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' },
  icon: { fontSize: '3rem', display: 'block', marginBottom: '16px' },
  title: { fontSize: '1.4rem', fontWeight: '800', color: '#1e293b', marginBottom: '10px' },
  msg: { color: '#64748b', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.6 },
  btn: { padding: '10px 28px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem' },
};
