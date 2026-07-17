import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

const TABS = ['caregivers', 'patients', 'visits'];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('caregivers');

  const [caregivers, setCaregivers] = useState([]);
  const [patients, setPatients] = useState([]);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reset password modal state
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetMsg, setResetMsg] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [cgRes, pRes, vRes] = await Promise.all([
        apiClient.get('/admin/caregivers'),
        apiClient.get('/admin/patients'),
        apiClient.get('/admin/visits'),
      ]);
      setCaregivers(cgRes.data.caregivers);
      setPatients(pRes.data.patients);
      setVisits(vRes.data.visits);
    } catch { /* handled below */ }
    finally { setLoading(false); }
  }

  async function toggleStatus(cg) {
    const newStatus = cg.status === 'active' ? 'disabled' : 'active';
    try {
      await apiClient.patch(`/admin/caregivers/${cg.id}/status`, { status: newStatus });
      setCaregivers((prev) =>
        prev.map((c) => (c.id === cg.id ? { ...c, status: newStatus } : c))
      );
      setActionMsg(`${cg.name}'s account ${newStatus === 'active' ? 'enabled' : 'disabled'}.`);
      setTimeout(() => setActionMsg(''), 3000);
    } catch (err) {
      setActionMsg(err.response?.data?.error || 'Action failed.');
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    if (newPassword.length < 6) return setResetMsg('Password must be at least 6 characters.');
    setResetLoading(true);
    setResetMsg('');
    try {
      await apiClient.patch(`/admin/caregivers/${resetTarget.id}/reset-password`, { new_password: newPassword });
      setResetMsg('✓ Password reset successfully.');
      setNewPassword('');
      setTimeout(() => { setResetTarget(null); setResetMsg(''); }, 1500);
    } catch (err) {
      setResetMsg(err.response?.data?.error || 'Reset failed.');
    } finally {
      setResetLoading(false);
    }
  }

  function handleLogout() { logout(); navigate('/login'); }

  return (
    <div style={s.page}>
      {/* Nav */}
      <nav style={s.nav}>
        <span style={s.brand}>🩺 CommuniCare</span>
        <span style={s.adminBadge}>⚙️ Admin Panel</span>
        <div style={s.navRight}>
          <span style={s.name}>🔑 {user?.name}</span>
          <button style={s.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div style={s.content}>
        {/* Stats bar */}
        <div style={s.statsBar}>
          {[
            { label: 'Caregivers', value: caregivers.length, color: '#1e3a5f' },
            { label: 'Active', value: caregivers.filter((c) => c.status === 'active').length, color: '#22c55e' },
            { label: 'Disabled', value: caregivers.filter((c) => c.status === 'disabled').length, color: '#ef4444' },
            { label: 'Patients', value: patients.length, color: '#f59e0b' },
            { label: 'Visits', value: visits.length, color: '#8b5cf6' },
          ].map(({ label, value, color }) => (
            <div key={label} style={s.statCard}>
              <span style={{ ...s.statValue, color }}>{value}</span>
              <span style={s.statLabel}>{label}</span>
            </div>
          ))}
        </div>

        {actionMsg && <div style={s.toast}>{actionMsg}</div>}

        {/* Tabs */}
        <div style={s.tabs}>
          {TABS.map((t) => (
            <button key={t} style={{ ...s.tab, ...(activeTab === t ? s.tabActive : {}) }} onClick={() => setActiveTab(t)}>
              {t === 'caregivers' ? '👥 Caregivers' : t === 'patients' ? '🧑‍⚕️ Patients' : '📋 Visits'}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={s.empty}>Loading…</p>
        ) : (
          <>
            {/* ══ CAREGIVERS TAB ══ */}
            {activeTab === 'caregivers' && (
              <div>
                {caregivers.length === 0 ? (
                  <div style={s.emptyBox}><p style={{ color: '#94a3b8' }}>No caregivers registered yet.</p></div>
                ) : (
                  <div style={s.table}>
                    <div style={s.thead}>
                      <span style={{ flex: 2 }}>Name / Email</span>
                      <span style={{ flex: 1 }}>Registered</span>
                      <span style={{ flex: 1, textAlign: 'center' }}>Status</span>
                      <span style={{ flex: 2, textAlign: 'right' }}>Actions</span>
                    </div>
                    {caregivers.map((cg) => (
                      <div key={cg.id} style={s.row}>
                        <div style={{ flex: 2 }}>
                          <p style={s.rowName}>{cg.name}</p>
                          <p style={s.rowSub}>{cg.email}</p>
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={s.rowSub}>{new Date(cg.created_at).toLocaleDateString()}</p>
                        </div>
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                          <span style={{ ...s.statusBadge, background: cg.status === 'active' ? '#dcfce7' : '#fee2e2', color: cg.status === 'active' ? '#16a34a' : '#dc2626' }}>
                            {cg.status === 'active' ? '✓ Active' : '✗ Disabled'}
                          </span>
                        </div>
                        <div style={{ flex: 2, display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            style={{ ...s.actionBtn, background: cg.status === 'active' ? '#fef2f2' : '#f0fdf4', color: cg.status === 'active' ? '#dc2626' : '#16a34a', borderColor: cg.status === 'active' ? '#fecaca' : '#bbf7d0' }}
                            onClick={() => toggleStatus(cg)}
                          >
                            {cg.status === 'active' ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            style={{ ...s.actionBtn, background: '#eff6ff', color: '#1e3a5f', borderColor: '#bfdbfe' }}
                            onClick={() => { setResetTarget(cg); setNewPassword(''); setResetMsg(''); }}
                          >
                            Reset Password
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ══ PATIENTS TAB (read-only) ══ */}
            {activeTab === 'patients' && (
              <div>
                {patients.length === 0 ? (
                  <div style={s.emptyBox}><p style={{ color: '#94a3b8' }}>No patients registered yet.</p></div>
                ) : (
                  <div style={s.table}>
                    <div style={s.thead}>
                      <span style={{ flex: 2 }}>Patient</span>
                      <span style={{ flex: 1 }}>Age / Gender</span>
                      <span style={{ flex: 2 }}>Caregiver</span>
                      <span style={{ flex: 1, textAlign: 'center' }}>Visits</span>
                      <span style={{ flex: 1 }}>Registered</span>
                    </div>
                    {patients.map((p) => (
                      <div key={p.id} style={s.row}>
                        <div style={{ flex: 2 }}>
                          <p style={s.rowName}>{p.full_name}</p>
                          {p.medical_notes && <p style={s.rowSub}>{p.medical_notes.substring(0, 50)}{p.medical_notes.length > 50 ? '…' : ''}</p>}
                        </div>
                        <p style={{ flex: 1, ...s.rowSub, margin: 0 }}>{p.age || '—'} {p.gender ? `· ${p.gender}` : ''}</p>
                        <p style={{ flex: 2, ...s.rowSub, margin: 0 }}>{p.caregiver_name}</p>
                        <p style={{ flex: 1, textAlign: 'center', ...s.rowSub, margin: 0 }}>{p.visit_count}</p>
                        <p style={{ flex: 1, ...s.rowSub, margin: 0 }}>{new Date(p.created_at).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ══ VISITS TAB (read-only) ══ */}
            {activeTab === 'visits' && (
              <div>
                {visits.length === 0 ? (
                  <div style={s.emptyBox}><p style={{ color: '#94a3b8' }}>No visits recorded yet.</p></div>
                ) : (
                  <div style={s.table}>
                    <div style={s.thead}>
                      <span style={{ flex: 2 }}>Patient</span>
                      <span style={{ flex: 2 }}>Caregiver</span>
                      <span style={{ flex: 2 }}>Date</span>
                      <span style={{ flex: 1, textAlign: 'center' }}>Status</span>
                    </div>
                    {visits.map((v) => (
                      <div key={v.id} style={s.row}>
                        <p style={{ flex: 2, ...s.rowName, margin: 0 }}>{v.patient_name}</p>
                        <p style={{ flex: 2, ...s.rowSub, margin: 0 }}>{v.caregiver_name}</p>
                        <p style={{ flex: 2, ...s.rowSub, margin: 0 }}>{new Date(v.visit_date).toLocaleString()}</p>
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                          <span style={{ ...s.statusBadge, background: v.status === 'open' ? '#dcfce7' : '#f1f5f9', color: v.status === 'open' ? '#16a34a' : '#64748b' }}>
                            {v.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ══ Reset Password Modal ══ */}
      {resetTarget && (
        <div style={m.overlay} onClick={() => setResetTarget(null)}>
          <div style={m.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={m.title}>Reset Password</h3>
            <p style={m.sub}>Set a new password for <strong>{resetTarget.name}</strong> ({resetTarget.email})</p>
            <form onSubmit={handleResetPassword} style={m.form}>
              <input
                style={m.input}
                type="password"
                placeholder="New password (min 6 characters)"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setResetMsg(''); }}
                autoFocus
                required
              />
              {resetMsg && (
                <p style={{ color: resetMsg.startsWith('✓') ? '#16a34a' : '#dc2626', fontSize: '0.85rem', margin: '4px 0' }}>{resetMsg}</p>
              )}
              <div style={m.actions}>
                <button style={m.cancelBtn} type="button" onClick={() => setResetTarget(null)}>Cancel</button>
                <button style={m.submitBtn} type="submit" disabled={resetLoading}>
                  {resetLoading ? 'Saving…' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: '#f8fafc', fontFamily: "'Segoe UI', system-ui, sans-serif" },
  nav: {
    background: '#0f172a', color: '#fff', padding: '14px 32px',
    display: 'flex', alignItems: 'center', gap: '14px',
    position: 'sticky', top: 0, zIndex: 100,
  },
  brand: { fontSize: '1.1rem', fontWeight: '800' },
  adminBadge: { background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: '700' },
  navRight: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '14px' },
  name: { fontSize: '0.875rem', opacity: 0.85 },
  logoutBtn: { background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '0.85rem' },

  content: { maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' },

  statsBar: { display: 'flex', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' },
  statCard: { background: '#fff', borderRadius: '12px', padding: '16px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0', minWidth: '100px' },
  statValue: { fontSize: '2rem', fontWeight: '800', lineHeight: 1 },
  statLabel: { fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' },

  toast: { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 16px', marginBottom: '16px', fontWeight: '600', fontSize: '0.875rem' },

  tabs: { display: 'flex', gap: 0, borderBottom: '2px solid #e2e8f0', marginBottom: '24px' },
  tab: { padding: '10px 24px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600', color: '#64748b', borderBottom: '2px solid transparent', marginBottom: '-2px' },
  tabActive: { color: '#0f172a', borderBottomColor: '#0f172a' },

  table: { background: '#fff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' },
  thead: { display: 'flex', alignItems: 'center', padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', gap: '12px' },
  row: { display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #f1f5f9', gap: '12px' },
  rowName: { fontWeight: '700', color: '#1e293b', fontSize: '0.9rem', margin: '0 0 2px' },
  rowSub: { color: '#64748b', fontSize: '0.8rem', margin: 0 },
  statusBadge: { padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '700' },
  actionBtn: { padding: '6px 14px', border: '1px solid', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: '40px' },
  emptyBox: { background: '#fff', borderRadius: '12px', padding: '48px', textAlign: 'center', border: '2px dashed #e2e8f0' },
};

const m = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', borderRadius: '14px', padding: '32px 36px', width: '100%', maxWidth: '420px', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' },
  title: { fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' },
  sub: { color: '#64748b', fontSize: '0.875rem', marginBottom: '20px' },
  form: { display: 'flex', flexDirection: 'column', gap: '10px' },
  input: { padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', fontFamily: 'inherit' },
  actions: { display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' },
  cancelBtn: { padding: '9px 18px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '7px', cursor: 'pointer', fontSize: '0.875rem' },
  submitBtn: { padding: '9px 20px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontWeight: '700', fontSize: '0.875rem' },
};
