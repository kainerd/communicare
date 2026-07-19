import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { buildPatientReport } from '../utils/buildPatientReport';
import {
  fetchVisitsForPatient, startVisit, deleteVisit,
  fetchPatientReport, deletePatient,
} from '../services/consultationService';
import apiClient from '../api/client';

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient]   = useState(null);
  const [visits, setVisits]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm]         = useState({});
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState('');
  const [starting, setStarting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [deletingId, setDeletingId]   = useState(null);
  const [showDeletePatient, setShowDeletePatient] = useState(false);
  const [deletingPatient, setDeletingPatient] = useState(false);

  useEffect(() => { fetchAll(); }, [id]);

  async function fetchAll() {
    try {
      const [pRes, visitsData] = await Promise.all([
        apiClient.get(`/patients/${id}`),
        fetchVisitsForPatient(id),
      ]);
      setPatient(pRes.data.patient);
      setForm({
        full_name: pRes.data.patient.full_name,
        age: pRes.data.patient.age || '',
        gender: pRes.data.patient.gender || '',
        medical_notes: pRes.data.patient.medical_notes || '',
      });
      setVisits(visitsData);
    } catch {
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      const { data } = await apiClient.put(`/patients/${id}`, form);
      setPatient(data.patient);
      setEditMode(false);
    } catch (err) {
      setSaveError(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleExportPdf() {
    setExporting(true);
    try {
      const data = await fetchPatientReport(id);
      if (!data.visits || data.visits.length === 0) {
        alert('No visits recorded for this patient yet. Start a visit first.');
        return;
      }
      buildPatientReport(data.patient, data.visits);
    } catch (err) {
      if (err.response) {
        alert(`Export failed: ${err.response.data?.error || `Server error (${err.response.status})`}`);
      } else {
        alert(`Export failed: ${err.message || 'Unexpected error during PDF generation.'}`);
      }
    } finally {
      setExporting(false);
    }
  }

  async function handleStartVisit() {
    setStarting(true);
    try {
      const newVisit = await startVisit(Number(id));
      navigate(`/visits/${newVisit.id}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Could not start visit');
    } finally {
      setStarting(false);
    }
  }

  async function handleDeletePatient() {
    setDeletingPatient(true);
    try {
      await deletePatient(id);
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete patient.');
      setDeletingPatient(false);
      setShowDeletePatient(false);
    }
  }

  async function handleDeleteVisit(visitId, e) {
    e.stopPropagation();
    if (!window.confirm('Permanently delete this consultation and all its data? This cannot be undone.')) return;
    setDeletingId(visitId);
    try {
      await deleteVisit(visitId);
      setVisits((prev) => prev.filter((v) => v.id !== visitId));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete consultation.');
    } finally {
      setDeletingId(null);
    }
  }

  const filteredVisits = useMemo(() => {
    return visits.filter((v) => {
      const matchStatus = filterStatus === 'all' || v.status === filterStatus;
      const matchSearch = !search.trim() ||
        new Date(v.visit_date).toLocaleString().toLowerCase().includes(search.toLowerCase()) ||
        (v.summary_preview || '').toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [visits, search, filterStatus]);

  if (loading) return <div style={s.page}><Navbar /><p style={s.loading}>Loading…</p></div>;
  if (!patient) return null;

  const openVisit = visits.find((v) => v.status === 'open');

  return (
    <div style={s.page}>
      <Navbar title="Patient Record" />
      <div style={s.content} className="cc-content">
        <button style={s.back} onClick={() => navigate('/dashboard')}>← Back to Patients</button>

        {/* ── Patient info card ── */}
        <div style={s.card}>
          <div style={s.cardTop} className="cc-patient-card-top">
            <div style={s.avatar}>{patient.full_name.charAt(0).toUpperCase()}</div>
            <div style={s.info}>
              {editMode ? (
                <form onSubmit={handleSave} style={s.editForm}>
                  <div style={s.editGrid}>
                    <div style={s.field}>
                      <label style={s.label}>Full Name *</label>
                      <input style={s.input} value={form.full_name}
                        onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
                    </div>
                    <div style={s.field}>
                      <label style={s.label}>Age</label>
                      <input style={s.input} type="number" value={form.age}
                        onChange={(e) => setForm({ ...form, age: e.target.value })} />
                    </div>
                    <div style={s.field}>
                      <label style={s.label}>Gender</label>
                      <select style={s.input} value={form.gender}
                        onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                        <option value="">Select…</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Medical Notes</label>
                    <textarea style={{ ...s.input, minHeight: '90px', resize: 'vertical' }}
                      value={form.medical_notes}
                      onChange={(e) => setForm({ ...form, medical_notes: e.target.value })} />
                  </div>
                  {saveError && <p style={s.error}>{saveError}</p>}
                  <div style={s.editActions}>
                    <button style={s.saveBtn} type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
                    <button style={s.cancelBtn} type="button" onClick={() => setEditMode(false)}>Cancel</button>
                  </div>
                </form>
              ) : (
                <>
                  <h2 style={s.patientName}>{patient.full_name}</h2>
                  <p style={s.meta}>
                    {patient.age ? `Age ${patient.age}` : 'Age unknown'}
                    {patient.gender ? ` · ${patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}` : ''}
                    {` · ${visits.length} consultation${visits.length !== 1 ? 's' : ''}`}
                  </p>
                  {patient.medical_notes ? (
                    <div style={s.notes}>
                      <span style={s.notesLabel}>Medical Notes</span>
                      <p style={s.notesText}>{patient.medical_notes}</p>
                    </div>
                  ) : (
                    <p style={s.noNotes}>No medical notes recorded.</p>
                  )}
                </>
              )}
            </div>

            {!editMode && (
              <div style={s.cardActions} className="cc-patient-card-actions">
                {openVisit ? (
                  <button style={s.resumeBtn} onClick={() => navigate(`/visits/${openVisit.id}`)}>
                    ▶ Resume Visit
                  </button>
                ) : (
                  <button style={s.startBtn} onClick={handleStartVisit} disabled={starting}>
                    {starting ? 'Starting…' : '+ Start Visit'}
                  </button>
                )}
                <button style={s.editBtn} onClick={() => setEditMode(true)}>✏️ Edit</button>
                <button style={s.pdfBtn} onClick={handleExportPdf} disabled={exporting}>
                  {exporting ? '⏳ Exporting…' : '📄 Export PDF'}
                </button>
                <button style={s.deletePatientBtn} onClick={() => setShowDeletePatient(true)}>
                  🗑 Delete Patient
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Consultation History ── */}
        <div style={s.historyHeader}>
          <h3 style={s.sectionTitle}>
            Consultation History
            <span style={s.countBadge}>{visits.length}</span>
          </h3>
        </div>

        {visits.length > 0 && (
          <div style={s.filterBar} className="cc-filter-bar">
            <input
              style={s.searchInput}
              placeholder="Search by date or summary…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search consultations"
            />
            <div style={s.filterBtns}>
              {['all', 'open', 'closed'].map((st) => (
                <button
                  key={st}
                  style={{ ...s.filterBtn, ...(filterStatus === st ? s.filterBtnActive : {}) }}
                  onClick={() => setFilterStatus(st)}
                >
                  {st === 'all' ? 'All' : st.charAt(0).toUpperCase() + st.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}

        {visits.length === 0 ? (
          <div style={s.emptyBox}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '10px' }}>📋</span>
            <p style={s.emptyText}>No consultations yet. Click <strong>+ Start Visit</strong> above to begin.</p>
          </div>
        ) : filteredVisits.length === 0 ? (
          <div style={s.emptyBox}>
            <p style={s.emptyText}>No consultations match your search.</p>
          </div>
        ) : (
          <div style={s.visitList}>
            {filteredVisits.map((v) => (
              <div
                key={v.id}
                style={s.visitCard}
                onClick={() => navigate(`/visits/${v.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/visits/${v.id}`)}
              >
                <div style={s.visitTop}>
                  <div style={s.visitLeft}>
                    <span style={{
                      ...s.statusBadge,
                      background: v.status === 'open' ? '#e8f5e9' : '#f0f4f9',
                      color:      v.status === 'open' ? '#2e7d32' : '#7a8fa0',
                      borderColor: v.status === 'open' ? '#a5d6a7' : '#dde3ea',
                    }}>
                      {v.status === 'open' ? '● Open' : '○ Closed'}
                    </span>
                    <div>
                      <p style={s.visitDate}>{new Date(v.visit_date).toLocaleString()}</p>
                      <p style={s.visitCaregiver}>Caregiver: {v.caregiver_name}</p>
                    </div>
                  </div>

                  <div style={s.visitStats}>
                    {Number(v.board_count) > 0 && (
                      <span style={s.stat}>📋 {v.board_count}</span>
                    )}
                    {Number(v.speech_count) > 0 && (
                      <span style={s.stat}>🎤 {v.speech_count}</span>
                    )}
                    {Number(v.has_summary) === 1 && (
                      <span style={{ ...s.stat, background: '#f3e5f5', color: '#6a1b9a', border: '1px solid #ce93d8' }}>
                        🤖 Summary
                      </span>
                    )}
                  </div>

                  <div style={s.visitActions}>
                    <span style={s.chevron} aria-hidden>›</span>
                    <button
                      style={s.deleteBtn}
                      disabled={deletingId === v.id}
                      onClick={(e) => handleDeleteVisit(v.id, e)}
                      title="Delete consultation"
                      aria-label="Delete consultation"
                    >
                      {deletingId === v.id ? '⏳' : '🗑'}
                    </button>
                  </div>
                </div>

                {v.summary_preview && (
                  <p style={s.summaryPreview}>
                    "{v.summary_preview}{v.summary_preview.length >= 140 ? '…' : ''}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Delete Patient Confirmation Modal ── */}
      {showDeletePatient && (
        <div style={dp.overlay}>
          <div style={dp.modal} role="dialog" aria-modal="true" aria-labelledby="del-title">
            <div style={dp.icon}>⚠️</div>
            <h3 style={dp.title} id="del-title">Delete Patient Record?</h3>
            <p style={dp.body}>
              This will permanently delete <strong>{patient.full_name}</strong> along with{' '}
              <strong>all {visits.length} consultation{visits.length !== 1 ? 's' : ''}</strong>,
              board entries, speech logs, and AI summaries. This cannot be undone.
            </p>
            <div style={dp.actions}>
              <button style={dp.cancel} onClick={() => setShowDeletePatient(false)}>
                Cancel
              </button>
              <button style={dp.confirm} onClick={handleDeletePatient} disabled={deletingPatient}>
                {deletingPatient ? 'Deleting…' : 'Yes, Delete Everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Delete modal styles ──────────────────────────────────────────────────────
const dp = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(15,28,46,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px',
  },
  modal: {
    background: '#fff', borderRadius: '18px', padding: '40px 36px',
    maxWidth: '480px', width: '100%', boxShadow: '0 24px 80px rgba(15,28,46,0.2)', textAlign: 'center',
  },
  icon:    { fontSize: '2.5rem', marginBottom: '12px' },
  title:   { fontSize: '1.25rem', fontWeight: '800', color: '#0f1c2e', margin: '0 0 14px' },
  body:    { color: '#4f6070', fontSize: '0.9rem', lineHeight: 1.65, margin: '0 0 28px' },
  actions: { display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' },
  cancel:  { padding: '12px 24px', background: '#f5f7fa', border: '1.5px solid #dde3ea', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' },
  confirm: { padding: '12px 24px', background: '#c62828', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem' },
};

// ── Page styles ──────────────────────────────────────────────────────────────
const s = {
  page: { minHeight: '100vh', background: '#f0f4f9', fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" },
  content: { maxWidth: '860px', margin: '0 auto', padding: '28px 24px' },
  loading: { textAlign: 'center', color: '#7a8fa0', marginTop: '60px' },
  back: {
    background: 'none', border: 'none', color: '#1565c0', fontWeight: '700',
    cursor: 'pointer', fontSize: '0.9rem', marginBottom: '20px', padding: 0,
  },

  // Patient card
  card: {
    background: '#fff', borderRadius: '16px', padding: '28px 32px',
    marginBottom: '32px', boxShadow: '0 2px 16px rgba(15,28,46,0.07)', border: '1px solid #dde3ea',
  },
  cardTop: { display: 'flex', gap: '20px', alignItems: 'flex-start' },
  avatar: {
    width: '68px', height: '68px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #1565c0, #1976d2)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.7rem', fontWeight: '800', flexShrink: 0,
  },
  info: { flex: 1, minWidth: 0 },
  patientName: { fontSize: '1.5rem', fontWeight: '800', color: '#0f1c2e', margin: '0 0 4px' },
  meta: { color: '#7a8fa0', fontSize: '0.9rem', marginBottom: '14px' },
  notes: {
    background: '#f5f7fa', borderRadius: '10px', padding: '12px 16px', border: '1px solid #dde3ea',
  },
  notesLabel: { fontSize: '0.8rem', fontWeight: '700', color: '#7a8fa0', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' },
  notesText: { fontSize: '0.925rem', color: '#2c3e52', lineHeight: 1.6, margin: 0 },
  noNotes: { color: '#b0bec5', fontSize: '0.875rem', fontStyle: 'italic' },

  // Card action buttons — clear visual hierarchy
  cardActions: { display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 },
  startBtn: {
    padding: '10px 18px', background: '#1565c0', color: '#fff', border: 'none',
    borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem',
  },
  resumeBtn: {
    padding: '10px 18px', background: '#2e7d32', color: '#fff', border: 'none',
    borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem',
  },
  editBtn: {
    padding: '10px 18px', background: '#f5f7fa', border: '1.5px solid #dde3ea',
    borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem', color: '#4f6070',
  },
  pdfBtn: {
    padding: '10px 18px', background: '#f3e5f5', color: '#6a1b9a',
    border: '1.5px solid #ce93d8', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.875rem',
  },
  deletePatientBtn: {
    padding: '10px 18px', background: '#ffebee', color: '#c62828',
    border: '1.5px solid #ef9a9a', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.875rem',
  },

  // Edit form
  editForm: { flex: 1 },
  editGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: '12px', marginBottom: '12px' },
  field:    { display: 'flex', flexDirection: 'column', gap: '5px' },
  label:    { fontSize: '0.875rem', fontWeight: '600', color: '#4f6070' },
  input: {
    padding: '10px 13px', borderRadius: '10px', border: '1.5px solid #dde3ea',
    fontSize: '1rem', outline: 'none', fontFamily: 'inherit', color: '#0f1c2e',
  },
  error: {
    background: '#ffebee', color: '#c62828', border: '1px solid #ef9a9a',
    borderRadius: '10px', padding: '10px 14px', fontSize: '0.875rem', marginTop: '6px',
  },
  editActions: { display: 'flex', gap: '10px', marginTop: '14px' },
  saveBtn: {
    padding: '10px 22px', background: '#2e7d32', color: '#fff', border: 'none',
    borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem',
  },
  cancelBtn: {
    padding: '10px 18px', background: '#f5f7fa', border: '1.5px solid #dde3ea',
    borderRadius: '10px', cursor: 'pointer', fontSize: '0.875rem', color: '#4f6070',
  },

  // History section
  historyHeader: { display: 'flex', alignItems: 'center', marginBottom: '14px' },
  sectionTitle: { fontSize: '1.1rem', fontWeight: '700', color: '#0f1c2e', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 },
  countBadge: {
    background: '#e3f2fd', color: '#1565c0', borderRadius: '999px',
    padding: '2px 10px', fontSize: '0.8rem', fontWeight: '700',
  },

  filterBar: { display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' },
  searchInput: {
    flex: 1, minWidth: '200px', padding: '10px 14px', borderRadius: '10px',
    border: '1.5px solid #dde3ea', fontSize: '0.9rem', outline: 'none',
    fontFamily: 'inherit', background: '#fff', color: '#0f1c2e',
  },
  filterBtns: { display: 'flex', gap: '6px' },
  filterBtn: {
    padding: '8px 16px', background: '#fff', border: '1.5px solid #dde3ea',
    borderRadius: '10px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600', color: '#7a8fa0',
  },
  filterBtnActive: { background: '#1565c0', color: '#fff', borderColor: '#1565c0' },

  // Visit cards
  visitList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  visitCard: {
    background: '#fff', borderRadius: '14px', padding: '18px 22px',
    cursor: 'pointer', border: '1px solid #dde3ea',
    boxShadow: '0 1px 6px rgba(15,28,46,0.05)',
    transition: 'box-shadow .15s',
  },
  visitTop: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' },
  visitLeft: { display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 },
  statusBadge: {
    padding: '4px 12px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: '700',
    border: '1.5px solid', flexShrink: 0,
  },
  visitDate: { fontWeight: '600', color: '#0f1c2e', fontSize: '0.9rem', margin: 0 },
  visitCaregiver: { color: '#7a8fa0', fontSize: '0.82rem', margin: '2px 0 0' },

  visitStats: { display: 'flex', gap: '6px', flexWrap: 'wrap', flexShrink: 0 },
  stat: {
    padding: '3px 10px', background: '#f0f4f9', borderRadius: '999px',
    fontSize: '0.8rem', fontWeight: '600', color: '#4f6070', border: '1px solid #dde3ea',
  },
  visitActions: { display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 },
  chevron: { fontSize: '1.4rem', color: '#b0bec5' },
  deleteBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: '1rem', padding: '4px 6px', borderRadius: '8px', color: '#c62828', opacity: 0.65,
  },
  summaryPreview: {
    margin: '12px 0 0', fontSize: '0.875rem', color: '#4f6070', lineHeight: 1.55, fontStyle: 'italic',
    borderTop: '1px solid #eaf0f6', paddingTop: '10px',
    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
  },

  emptyBox: {
    background: '#fff', borderRadius: '14px', padding: '36px',
    textAlign: 'center', border: '2px dashed #dde3ea', marginTop: '8px',
  },
  emptyText: { color: '#7a8fa0', fontSize: '0.9rem' },
};
