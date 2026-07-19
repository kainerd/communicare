import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

const TABS = ['pending', 'caregivers', 'patients', 'visits'];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const defaultTab = location.pathname === '/admin/dashboard' ? 'pending' : 'pending';
  const [activeTab, setActiveTab] = useState(defaultTab);

  const [pending, setPending]       = useState([]);
  const [caregivers, setCaregivers] = useState([]);
  const [patients, setPatients]     = useState([]);
  const [visits, setVisits]         = useState([]);
  const [loading, setLoading]       = useState(true);

  const [resetTarget, setResetTarget]   = useState(null);
  const [newPassword, setNewPassword]   = useState('');
  const [resetMsg, setResetMsg]         = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const [deleteTarget, setDeleteTarget]   = useState(null); // caregiver being deleted
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteMsg, setDeleteMsg]         = useState('');

  const [reassignTarget, setReassignTarget]     = useState(null); // patient being reassigned
  const [reassignCaregiverId, setReassignCaregiverId] = useState('');
  const [reassignLoading, setReassignLoading]   = useState(false);
  const [reassignMsg, setReassignMsg]           = useState('');

  const [actionMsg, setActionMsg] = useState('');
  const [actionErr, setActionErr] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const adminNavRef = useRef(null);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [pendRes, cgRes, pRes, vRes] = await Promise.all([
        apiClient.get('/admin/caregivers/pending'),
        apiClient.get('/admin/caregivers'),
        apiClient.get('/admin/patients'),
        apiClient.get('/admin/visits'),
      ]);
      setPending(pendRes.data.caregivers);
      setCaregivers(cgRes.data.caregivers);
      setPatients(pRes.data.patients);
      setVisits(vRes.data.visits);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  async function refreshPending() {
    try {
      const { data } = await apiClient.get('/admin/caregivers/pending');
      setPending(data.caregivers);
    } catch { /* ignore */ }
  }

  async function handleApprove(cg) {
    setActionErr('');
    try {
      await apiClient.patch(`/admin/caregivers/${cg.id}/approve`);
      flash(`✓ ${cg.name} approved — verification email sent to ${cg.email}`);
      await refreshPending();
      const { data } = await apiClient.get('/admin/caregivers');
      setCaregivers(data.caregivers);
    } catch (err) {
      setActionErr(err.response?.data?.error || 'Approve failed.');
    }
  }

  async function handleReject(cg) {
    if (!window.confirm(`Reject ${cg.name}'s registration? This cannot be undone.`)) return;
    setActionErr('');
    try {
      await apiClient.patch(`/admin/caregivers/${cg.id}/reject`);
      flash(`${cg.name}'s registration rejected.`);
      await refreshPending();
    } catch (err) {
      setActionErr(err.response?.data?.error || 'Reject failed.');
    }
  }

  async function toggleStatus(cg) {
    const newStatus = cg.status === 'active' ? 'disabled' : 'active';
    try {
      await apiClient.patch(`/admin/caregivers/${cg.id}/status`, { status: newStatus });
      setCaregivers((prev) => prev.map((c) => c.id === cg.id ? { ...c, status: newStatus } : c));
      flash(`${cg.name}'s account ${newStatus === 'active' ? 'enabled' : 'disabled'}.`);
    } catch (err) {
      setActionErr(err.response?.data?.error || 'Action failed.');
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

  function flash(msg) {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 4000);
  }

  async function handleDeleteCaregiver(e) {
    e.preventDefault();
    setDeleteLoading(true);
    setDeleteMsg('');
    try {
      const { data } = await apiClient.delete(`/admin/caregivers/${deleteTarget.id}`);
      setCaregivers((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      // Unlinked patients now have caregiver_id = NULL server-side — refresh
      // the patients list so they immediately show as "Unassigned" here.
      const { data: pData } = await apiClient.get('/admin/patients');
      setPatients(pData.patients);
      flash(`✓ ${data.message}`);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteMsg(err.response?.data?.error || 'Delete failed.');
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleReassignPatient(e) {
    e.preventDefault();
    if (!reassignCaregiverId) return setReassignMsg('Choose a caregiver.');
    setReassignLoading(true);
    setReassignMsg('');
    try {
      const { data } = await apiClient.patch(`/admin/patients/${reassignTarget.id}/reassign`, {
        caregiver_id: Number(reassignCaregiverId),
      });
      const { data: pData } = await apiClient.get('/admin/patients');
      setPatients(pData.patients);
      flash(`✓ ${data.message}`);
      setReassignTarget(null);
      setReassignCaregiverId('');
    } catch (err) {
      setReassignMsg(err.response?.data?.error || 'Reassign failed.');
    } finally {
      setReassignLoading(false);
    }
  }

  function handleLogout() { logout(); navigate('/login'); setMobileMenuOpen(false); }

  useEffect(() => {
    function handleOutside(e) {
      if (adminNavRef.current && !adminNavRef.current.contains(e.target)) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const tabLabel = (t) => {
    if (t === 'pending')    return `⏳ Pending${pending.length > 0 ? ` (${pending.length})` : ''}`;
    if (t === 'caregivers') return '👥 Caregivers';
    if (t === 'patients')   return '🧑‍⚕️ Patients';
    return '📋 Visits';
  };

  return (
    <div style={s.page}>
      {/* ── Admin nav ── */}
      <nav style={s.nav} className="cc-admin-nav" ref={adminNavRef}>
        <div style={s.navBrand}>
          <span style={s.brandIcon}>🩺</span>
          <span style={s.brand}>CommuniCare</span>
          <span style={s.adminBadge} className="cc-admin-badge">Admin Panel</span>
        </div>
        <div style={s.navRight} className="cc-admin-nav-right">
          <span style={s.name}>🔑 {user?.name}</span>
          <button style={s.logoutBtn} onClick={handleLogout}>Sign out</button>
        </div>
        <button
          className={`cc-hamburger${mobileMenuOpen ? ' is-open' : ''}`}
          onClick={() => setMobileMenuOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
          data-notab
        >
          <span /><span /><span />
        </button>
        <div className={`cc-mobile-menu${mobileMenuOpen ? ' is-open' : ''}`}>
          <span style={{ color: '#fff', fontSize: '0.9rem', opacity: 0.85 }}>🔑 {user?.name}</span>
          <button style={s.logoutBtn} onClick={handleLogout}>Sign out</button>
        </div>
      </nav>

      <div style={s.content} className="cc-content">
        {/* Stats bar */}
        <div style={s.statsBar} className="cc-stats-bar">
          {[
            { label: 'Pending',   value: pending.length,                                           color: '#e65100' },
            { label: 'Caregivers',value: caregivers.length,                                        color: '#1565c0' },
            { label: 'Active',    value: caregivers.filter((c) => c.status === 'active').length,   color: '#2e7d32' },
            { label: 'Disabled',  value: caregivers.filter((c) => c.status === 'disabled').length, color: '#c62828' },
            { label: 'Patients',  value: patients.length,                                          color: '#6a1b9a' },
            { label: 'Visits',    value: visits.length,                                            color: '#0288d1' },
          ].map(({ label, value, color }) => (
            <div key={label} style={s.statCard} className="cc-stat-card">
              <span style={{ ...s.statValue, color }}>{value}</span>
              <span style={s.statLabel}>{label}</span>
            </div>
          ))}
        </div>

        {actionMsg && <div style={s.toast}     role="status">{actionMsg}</div>}
        {actionErr && <div style={s.toastErr}  role="alert">{actionErr}</div>}

        {/* Tab bar */}
        <div style={s.tabs} className="cc-admin-tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={activeTab === t}
              style={{
                ...s.tab,
                ...(activeTab === t ? s.tabActive : {}),
                ...(t === 'pending' && pending.length > 0 ? s.tabAlert : {}),
              }}
              onClick={() => setActiveTab(t)}
              data-notab
            >
              {tabLabel(t)}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={s.empty}>Loading…</p>
        ) : (
          <>
            {/* ══ PENDING TAB ══ */}
            {activeTab === 'pending' && (
              <div>
                <p style={s.sectionDesc}>
                  Caregivers who have registered and are waiting for admin approval.
                  Approving sends them a verification email; they can log in after clicking the link.
                </p>
                {pending.length === 0 ? (
                  <div style={s.emptyBox}>
                    <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '12px' }}>✅</span>
                    <p style={{ color: '#7a8fa0', fontWeight: '600', fontSize: '0.95rem' }}>No pending registrations.</p>
                  </div>
                ) : (
                  <div style={s.pendingList}>
                    {pending.map((cg) => (
                      <div key={cg.id} style={s.pendingCard} className="cc-pending-card">
                        <div style={s.pendingAvatar}>{cg.name.charAt(0).toUpperCase()}</div>
                        <div style={s.pendingInfo}>
                          <p style={s.pendingName}>{cg.name}</p>
                          <p style={s.pendingEmail}>{cg.email}</p>
                          <p style={s.pendingDate}>Registered: {new Date(cg.created_at).toLocaleString()}</p>
                        </div>
                        <div style={s.pendingActions} className="cc-pending-actions">
                          <button style={s.approveBtn} onClick={() => handleApprove(cg)}>✓ Approve</button>
                          <button style={s.rejectBtn}  onClick={() => handleReject(cg)}>✗ Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ══ CAREGIVERS TAB ══ */}
            {activeTab === 'caregivers' && (
              <div>
                {caregivers.length === 0 ? (
                  <div style={s.emptyBox}><p style={s.emptyText}>No caregivers registered yet.</p></div>
                ) : (
                  <div className="cc-table-scroll">
                    <div style={s.table} className="cc-table-inner">
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
                          <p style={{ flex: 1, ...s.rowSub, margin: 0 }}>
                            {new Date(cg.created_at).toLocaleDateString()}
                          </p>
                          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                            <span style={{
                              ...s.statusBadge,
                              background: cg.status === 'active' ? '#e8f5e9' : '#ffebee',
                              color:      cg.status === 'active' ? '#2e7d32' : '#c62828',
                              border:     `1.5px solid ${cg.status === 'active' ? '#a5d6a7' : '#ef9a9a'}`,
                            }}>
                              {cg.status === 'active' ? '✓ Active' : cg.status === 'rejected' ? '✗ Rejected' : '✗ Disabled'}
                            </span>
                          </div>
                          <div style={{ flex: 2, display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            {cg.status !== 'rejected' && (
                              <button
                                style={{
                                  ...s.actionBtn,
                                  background:  cg.status === 'active' ? '#ffebee' : '#e8f5e9',
                                  color:       cg.status === 'active' ? '#c62828' : '#2e7d32',
                                  borderColor: cg.status === 'active' ? '#ef9a9a' : '#a5d6a7',
                                }}
                                onClick={() => toggleStatus(cg)}
                              >
                                {cg.status === 'active' ? 'Disable' : 'Enable'}
                              </button>
                            )}
                            <button
                              style={{ ...s.actionBtn, background: '#e3f2fd', color: '#1565c0', borderColor: '#90caf9' }}
                              onClick={() => { setResetTarget(cg); setNewPassword(''); setResetMsg(''); }}
                            >
                              Reset Password
                            </button>
                            <button
                              style={{ ...s.actionBtn, background: '#ffebee', color: '#c62828', borderColor: '#ef9a9a' }}
                              onClick={() => { setDeleteTarget(cg); setDeleteMsg(''); }}
                              aria-label={`Delete ${cg.name}`}
                            >
                              🗑 Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══ PATIENTS TAB ══ */}
            {activeTab === 'patients' && (
              <div>
                {patients.length === 0 ? (
                  <div style={s.emptyBox}><p style={s.emptyText}>No patients registered yet.</p></div>
                ) : (
                  <div className="cc-table-scroll">
                    <div style={s.table} className="cc-table-inner">
                      <div style={s.thead}>
                        <span style={{ flex: 2 }}>Patient</span>
                        <span style={{ flex: 1 }}>Age / Gender</span>
                        <span style={{ flex: 2 }}>Caregiver</span>
                        <span style={{ flex: 1, textAlign: 'center' }}>Visits</span>
                        <span style={{ flex: 1 }}>Registered</span>
                        <span style={{ flex: 1, textAlign: 'right' }}></span>
                      </div>
                      {patients.map((p) => (
                        <div key={p.id} style={s.row}>
                          <div style={{ flex: 2 }}>
                            <p style={s.rowName}>{p.full_name}</p>
                            {p.medical_notes && <p style={s.rowSub}>{p.medical_notes.substring(0, 50)}{p.medical_notes.length > 50 ? '…' : ''}</p>}
                          </div>
                          <p style={{ flex: 1, ...s.rowSub, margin: 0 }}>{p.age || '—'}{p.gender ? ` · ${p.gender}` : ''}</p>
                          <div style={{ flex: 2 }}>
                            {p.caregiver_name ? (
                              <p style={{ ...s.rowSub, margin: 0 }}>{p.caregiver_name}</p>
                            ) : (
                              <span style={{
                                ...s.statusBadge,
                                background: '#fff3e0', color: '#e65100', border: '1.5px solid #ffcc80',
                              }}>
                                ⚠ Unassigned
                              </span>
                            )}
                          </div>
                          <p style={{ flex: 1, textAlign: 'center', ...s.rowSub, margin: 0 }}>{p.visit_count}</p>
                          <p style={{ flex: 1, ...s.rowSub, margin: 0 }}>{new Date(p.created_at).toLocaleDateString()}</p>
                          <div style={{ flex: 1, textAlign: 'right' }}>
                            <button
                              style={{ ...s.actionBtn, background: '#e3f2fd', color: '#1565c0', borderColor: '#90caf9' }}
                              onClick={() => { setReassignTarget(p); setReassignCaregiverId(''); setReassignMsg(''); }}
                            >
                              {p.caregiver_name ? 'Reassign' : 'Assign'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══ VISITS TAB ══ */}
            {activeTab === 'visits' && (
              <div>
                {visits.length === 0 ? (
                  <div style={s.emptyBox}><p style={s.emptyText}>No visits recorded yet.</p></div>
                ) : (
                  <div className="cc-table-scroll">
                    <div style={s.table} className="cc-table-inner">
                      <div style={s.thead}>
                        <span style={{ flex: 2 }}>Patient</span>
                        <span style={{ flex: 2 }}>Caregiver</span>
                        <span style={{ flex: 2 }}>Date</span>
                        <span style={{ flex: 1, textAlign: 'center' }}>Status</span>
                      </div>
                      {visits.map((v) => (
                        <div key={v.id} style={s.row}>
                          <p style={{ flex: 2, ...s.rowName, margin: 0 }}>{v.patient_name}</p>
                          <p style={{ flex: 2, ...s.rowSub, margin: 0, fontStyle: v.caregiver_name ? 'normal' : 'italic' }}>
                            {v.caregiver_name || '— (caregiver deleted)'}
                          </p>
                          <p style={{ flex: 2, ...s.rowSub, margin: 0 }}>{new Date(v.visit_date).toLocaleString()}</p>
                          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                            <span style={{
                              ...s.statusBadge,
                              background:  v.status === 'open' ? '#e8f5e9' : '#f0f4f9',
                              color:       v.status === 'open' ? '#2e7d32' : '#7a8fa0',
                              borderColor: v.status === 'open' ? '#a5d6a7' : '#dde3ea',
                            }}>
                              {v.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ══ Reset Password Modal ══ */}
      {resetTarget && (
        <div style={m.overlay} className="cc-modal-overlay" onClick={() => setResetTarget(null)}>
          <div style={m.modal} className="cc-modal" role="dialog" aria-modal="true"
               onClick={(e) => e.stopPropagation()}>
            <h3 style={m.title}>Reset Password</h3>
            <p style={m.sub}>
              Set a new password for <strong>{resetTarget.name}</strong> ({resetTarget.email})
            </p>
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
                <p style={{ color: resetMsg.startsWith('✓') ? '#2e7d32' : '#c62828', fontSize: '0.875rem', margin: '4px 0' }}>
                  {resetMsg}
                </p>
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

      {/* ══ Delete Caregiver Modal ══ */}
      {deleteTarget && (
        <div style={m.overlay} className="cc-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div style={m.modal} className="cc-modal" role="dialog" aria-modal="true" aria-labelledby="del-cg-title"
               onClick={(e) => e.stopPropagation()}>
            <h3 style={m.title} id="del-cg-title">Delete Caregiver Account?</h3>
            <p style={m.sub}>
              This permanently deletes the login for <strong>{deleteTarget.name}</strong> ({deleteTarget.email}).
              This cannot be undone.
            </p>
            <p style={{ ...m.sub, background: '#fff3e0', color: '#e65100', border: '1.5px solid #ffcc80', borderRadius: '10px', padding: '10px 14px' }}>
              Their patients and visit history are <strong>not</strong> deleted — patients will
              become "Unassigned" and can be reassigned to another caregiver from the Patients tab.
            </p>
            <form onSubmit={handleDeleteCaregiver}>
              {deleteMsg && (
                <p style={{ color: '#c62828', fontSize: '0.875rem', margin: '4px 0 12px' }}>{deleteMsg}</p>
              )}
              <div style={m.actions}>
                <button style={m.cancelBtn} type="button" onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button
                  style={{ ...m.submitBtn, background: '#c62828' }}
                  type="submit"
                  disabled={deleteLoading}
                >
                  {deleteLoading ? 'Deleting…' : 'Yes, Delete Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ Reassign Patient Modal ══ */}
      {reassignTarget && (
        <div style={m.overlay} className="cc-modal-overlay" onClick={() => setReassignTarget(null)}>
          <div style={m.modal} className="cc-modal" role="dialog" aria-modal="true" aria-labelledby="reassign-title"
               onClick={(e) => e.stopPropagation()}>
            <h3 style={m.title} id="reassign-title">
              {reassignTarget.caregiver_name ? 'Reassign Patient' : 'Assign Unassigned Patient'}
            </h3>
            <p style={m.sub}>
              Choose a new caregiver for <strong>{reassignTarget.full_name}</strong>
              {reassignTarget.caregiver_name ? <> (currently {reassignTarget.caregiver_name})</> : null}.
            </p>
            <form onSubmit={handleReassignPatient} style={m.form}>
              <select
                style={m.input}
                value={reassignCaregiverId}
                onChange={(e) => { setReassignCaregiverId(e.target.value); setReassignMsg(''); }}
                autoFocus
                required
              >
                <option value="">— Select a caregiver —</option>
                {caregivers.filter((c) => c.status === 'active').map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                ))}
              </select>
              {reassignMsg && (
                <p style={{ color: '#c62828', fontSize: '0.875rem', margin: '4px 0' }}>{reassignMsg}</p>
              )}
              <div style={m.actions}>
                <button style={m.cancelBtn} type="button" onClick={() => setReassignTarget(null)}>Cancel</button>
                <button style={m.submitBtn} type="submit" disabled={reassignLoading}>
                  {reassignLoading ? 'Saving…' : 'Reassign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const s = {
  page: { minHeight: '100vh', background: '#f0f4f9', fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" },

  nav: {
    background: 'linear-gradient(90deg, #1565c0 0%, #1976d2 100%)',
    color: '#fff', padding: '0 32px', height: '60px',
    display: 'flex', alignItems: 'center', gap: '14px',
    position: 'sticky', top: 0, zIndex: 100,
    boxShadow: '0 2px 12px rgba(13,71,161,0.25)',
  },
  navBrand: { display: 'flex', alignItems: 'center', gap: '8px' },
  brandIcon: { fontSize: '1.3rem' },
  brand:     { fontSize: '1.1rem', fontWeight: '800', color: '#fff' },
  adminBadge: {
    background: 'rgba(255,255,255,0.18)', color: '#fff',
    padding: '3px 12px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '700',
  },
  navRight: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' },
  name: { fontSize: '0.875rem', fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  logoutBtn: {
    background: 'rgba(255,255,255,0.15)', color: '#fff',
    border: '1.5px solid rgba(255,255,255,0.4)', borderRadius: '8px',
    padding: '6px 16px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600',
  },

  content: { maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' },

  statsBar: { display: 'flex', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' },
  statCard: {
    background: '#fff', borderRadius: '14px', padding: '18px 24px',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    boxShadow: '0 1px 8px rgba(15,28,46,0.06)', border: '1px solid #dde3ea', minWidth: '90px',
  },
  statValue: { fontSize: '2rem', fontWeight: '800', lineHeight: 1 },
  statLabel: {
    fontSize: '0.72rem', color: '#7a8fa0', fontWeight: '700',
    marginTop: '5px', textTransform: 'uppercase', letterSpacing: '0.06em',
  },

  toast:    { background: '#e8f5e9', color: '#2e7d32', border: '1px solid #a5d6a7', borderRadius: '10px', padding: '12px 18px', marginBottom: '16px', fontWeight: '600', fontSize: '0.9rem' },
  toastErr: { background: '#ffebee', color: '#c62828', border: '1px solid #ef9a9a', borderRadius: '10px', padding: '12px 18px', marginBottom: '16px', fontWeight: '600', fontSize: '0.9rem' },

  sectionDesc: { color: '#4f6070', fontSize: '0.9rem', marginBottom: '20px', lineHeight: 1.6 },

  tabs: { display: 'flex', gap: 0, borderBottom: '2px solid #dde3ea', marginBottom: '24px' },
  tab: {
    padding: '11px 24px', background: 'none', border: 'none', cursor: 'pointer',
    fontSize: '0.9rem', fontWeight: '600', color: '#7a8fa0',
    borderBottom: '2px solid transparent', marginBottom: '-2px', whiteSpace: 'nowrap',
    transition: 'color .15s',
  },
  tabActive: { color: '#1565c0', borderBottomColor: '#1565c0' },
  tabAlert:  { color: '#e65100' },

  // Pending cards
  pendingList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  pendingCard: {
    background: '#fff', borderRadius: '14px', padding: '20px 24px',
    display: 'flex', alignItems: 'center', gap: '16px',
    border: '1.5px solid #ffcc80', boxShadow: '0 2px 8px rgba(230,81,0,0.07)',
  },
  pendingAvatar: {
    width: '50px', height: '50px', borderRadius: '50%', flexShrink: 0,
    background: 'linear-gradient(135deg, #e65100, #f57c00)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.3rem', fontWeight: '800',
  },
  pendingInfo:  { flex: 1 },
  pendingName:  { fontWeight: '700', color: '#0f1c2e', fontSize: '0.95rem', margin: '0 0 2px' },
  pendingEmail: { color: '#7a8fa0', fontSize: '0.875rem', margin: '0 0 4px' },
  pendingDate:  { color: '#b0bec5', fontSize: '0.8rem', margin: 0 },
  pendingActions: { display: 'flex', gap: '8px', flexShrink: 0 },
  approveBtn: {
    padding: '10px 22px', background: '#2e7d32', color: '#fff', border: 'none',
    borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.875rem',
  },
  rejectBtn: {
    padding: '10px 22px', background: '#ffebee', color: '#c62828',
    border: '1.5px solid #ef9a9a', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.875rem',
  },

  // Table
  table: {
    background: '#fff', borderRadius: '14px', overflow: 'hidden',
    border: '1px solid #dde3ea', boxShadow: '0 1px 6px rgba(15,28,46,0.05)',
  },
  thead: {
    display: 'flex', alignItems: 'center', padding: '12px 22px',
    background: '#f5f7fa', borderBottom: '1px solid #dde3ea',
    fontSize: '0.75rem', fontWeight: '700', color: '#7a8fa0',
    textTransform: 'uppercase', letterSpacing: '0.06em', gap: '12px',
  },
  row: {
    display: 'flex', alignItems: 'center', padding: '16px 22px',
    borderBottom: '1px solid #eaf0f6', gap: '12px',
  },
  rowName: { fontWeight: '700', color: '#0f1c2e', fontSize: '0.925rem', margin: '0 0 2px' },
  rowSub:  { color: '#7a8fa0', fontSize: '0.82rem', margin: 0 },
  statusBadge: { padding: '4px 12px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '700', border: '1.5px solid' },
  actionBtn:   { padding: '7px 14px', border: '1.5px solid', borderRadius: '8px', fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer' },

  empty:    { textAlign: 'center', color: '#7a8fa0', marginTop: '40px' },
  emptyBox: { background: '#fff', borderRadius: '14px', padding: '52px', textAlign: 'center', border: '2px dashed #dde3ea' },
  emptyText:{ color: '#7a8fa0', fontSize: '0.9rem' },
};

const m = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,28,46,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal:   { background: '#fff', borderRadius: '18px', padding: '36px 40px', width: '100%', maxWidth: '440px', boxShadow: '0 24px 80px rgba(15,28,46,0.25)' },
  title:   { fontSize: '1.2rem', fontWeight: '800', color: '#0f1c2e', marginBottom: '8px' },
  sub:     { color: '#4f6070', fontSize: '0.875rem', marginBottom: '22px', lineHeight: 1.55 },
  form:    { display: 'flex', flexDirection: 'column', gap: '12px' },
  input: {
    padding: '12px 16px', borderRadius: '10px', border: '1.5px solid #dde3ea',
    fontSize: '1rem', outline: 'none', fontFamily: 'inherit', color: '#0f1c2e',
  },
  actions:   { display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' },
  cancelBtn: { padding: '10px 20px', background: '#f5f7fa', border: '1.5px solid #dde3ea', borderRadius: '10px', cursor: 'pointer', fontSize: '0.9rem', color: '#4f6070' },
  submitBtn: { padding: '10px 22px', background: '#1565c0', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem' },
};
