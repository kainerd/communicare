import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import apiClient from '../api/client';
import { buildPatientReport } from '../utils/buildPatientReport';

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [starting, setStarting] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => { fetchAll(); }, [id]);

  async function fetchAll() {
    try {
      const [pRes, vRes] = await Promise.all([
        apiClient.get(`/patients/${id}`),
        apiClient.get(`/visits/patient/${id}`),
      ]);
      setPatient(pRes.data.patient);
      setForm({
        full_name: pRes.data.patient.full_name,
        age: pRes.data.patient.age || '',
        gender: pRes.data.patient.gender || '',
        medical_notes: pRes.data.patient.medical_notes || '',
      });
      setVisits(vRes.data.visits);
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
      const { data } = await apiClient.get(`/patients/${id}/report`);
      buildPatientReport(data.patient, data.visits);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to generate PDF.');
    } finally {
      setExporting(false);
    }
  }

  async function handleStartVisit() {
    setStarting(true);
    try {
      const { data } = await apiClient.post('/visits', { patient_id: Number(id) });
      navigate(`/visits/${data.visit.id}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Could not start visit');
    } finally {
      setStarting(false);
    }
  }

  if (loading) return <div style={s.page}><Navbar /><p style={s.loading}>Loading…</p></div>;
  if (!patient) return null;

  const openVisit = visits.find((v) => v.status === 'open');

  return (
    <div style={s.page}>
      <Navbar title="Patient Record" />
      <div style={s.content}>
        <button style={s.back} onClick={() => navigate('/dashboard')}>← Back to Patients</button>

        {/* Patient info card */}
        <div style={s.card}>
          <div style={s.cardTop}>
            <div style={s.avatar}>{patient.full_name.charAt(0).toUpperCase()}</div>
            <div style={s.info}>
              {editMode ? (
                <form onSubmit={handleSave} style={s.editForm}>
                  <div style={s.editGrid}>
                    <div style={s.field}>
                      <label style={s.label}>Full Name *</label>
                      <input style={s.input} name="full_name" value={form.full_name}
                        onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
                    </div>
                    <div style={s.field}>
                      <label style={s.label}>Age</label>
                      <input style={s.input} name="age" type="number" value={form.age}
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
                  </p>
                  {patient.medical_notes ? (
                    <div style={s.notes}>
                      <strong>Medical Notes:</strong>
                      <p style={s.notesText}>{patient.medical_notes}</p>
                    </div>
                  ) : (
                    <p style={s.noNotes}>No medical notes recorded.</p>
                  )}
                </>
              )}
            </div>
            {!editMode && (
              <div style={s.cardActions}>
                <button style={s.editBtn} onClick={() => setEditMode(true)}>✏️ Edit</button>
                {openVisit ? (
                  <button style={s.resumeBtn} onClick={() => navigate(`/visits/${openVisit.id}`)}>
                    ▶ Resume Visit
                  </button>
                ) : (
                  <button style={s.startBtn} onClick={handleStartVisit} disabled={starting}>
                    {starting ? 'Starting…' : '+ Start Visit'}
                  </button>
                )}
                <button style={s.pdfBtn} onClick={handleExportPdf} disabled={exporting}>
                  {exporting ? '⏳ Exporting…' : '📄 Export PDF'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Visit history */}
        <h3 style={s.sectionTitle}>Visit History</h3>
        {visits.length === 0 ? (
          <div style={s.emptyBox}>
            <p style={s.emptyText}>No visits yet. Click <strong>+ Start Visit</strong> above to begin.</p>
          </div>
        ) : (
          <div style={s.visitList}>
            {visits.map((v) => (
              <div key={v.id} style={s.visitCard} onClick={() => navigate(`/visits/${v.id}`)}>
                <div style={s.visitLeft}>
                  <span style={{ ...s.statusBadge, background: v.status === 'open' ? '#22c55e' : '#94a3b8' }}>
                    {v.status === 'open' ? 'Open' : 'Closed'}
                  </span>
                  <div>
                    <p style={s.visitDate}>{new Date(v.visit_date).toLocaleString()}</p>
                    <p style={s.visitCaregiver}>Caregiver: {v.caregiver_name}</p>
                  </div>
                </div>
                <span style={s.chevron}>›</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: '#f1f5f9', fontFamily: "'Segoe UI', system-ui, sans-serif" },
  content: { maxWidth: '860px', margin: '0 auto', padding: '28px 24px' },
  loading: { textAlign: 'center', color: '#94a3b8', marginTop: '60px' },
  back: { background: 'none', border: 'none', color: '#1e3a5f', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '20px', padding: 0 },
  card: { background: '#fff', borderRadius: '14px', padding: '28px', marginBottom: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' },
  cardTop: { display: 'flex', gap: '20px', alignItems: 'flex-start' },
  avatar: {
    width: '64px', height: '64px', borderRadius: '50%', background: '#1e3a5f',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.6rem', fontWeight: '800', flexShrink: 0,
  },
  info: { flex: 1 },
  patientName: { fontSize: '1.4rem', fontWeight: '800', color: '#1e293b', margin: '0 0 4px' },
  meta: { color: '#64748b', fontSize: '0.9rem', marginBottom: '12px' },
  notes: { background: '#f8fafc', borderRadius: '8px', padding: '12px 14px', border: '1px solid #e2e8f0' },
  notesText: { margin: '6px 0 0', fontSize: '0.9rem', color: '#475569', lineHeight: 1.6 },
  noNotes: { color: '#94a3b8', fontSize: '0.875rem', fontStyle: 'italic' },
  cardActions: { display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 },
  editBtn: { padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '7px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' },
  startBtn: { padding: '8px 16px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' },
  resumeBtn: { padding: '8px 16px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' },
  pdfBtn: { padding: '8px 16px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' },
  editForm: { flex: 1 },
  editGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: '10px', marginBottom: '10px' },
  field: { display: 'flex', flexDirection: 'column', gap: '3px' },
  label: { fontSize: '0.78rem', fontWeight: '600', color: '#475569' },
  input: { padding: '8px 10px', borderRadius: '7px', border: '1.5px solid #cbd5e1', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit' },
  error: { color: '#dc2626', fontSize: '0.82rem', background: '#fef2f2', padding: '7px 10px', borderRadius: '6px', border: '1px solid #fecaca', marginTop: '6px' },
  editActions: { display: 'flex', gap: '10px', marginTop: '12px' },
  saveBtn: { padding: '8px 20px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontWeight: '700', fontSize: '0.875rem' },
  cancelBtn: { padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '7px', cursor: 'pointer', fontSize: '0.875rem' },
  sectionTitle: { fontSize: '1.1rem', fontWeight: '700', color: '#1e3a5f', marginBottom: '14px' },
  visitList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  visitCard: {
    background: '#fff', borderRadius: '10px', padding: '16px 20px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    cursor: 'pointer', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  visitLeft: { display: 'flex', alignItems: 'center', gap: '14px' },
  statusBadge: { padding: '4px 10px', borderRadius: '999px', color: '#fff', fontSize: '0.75rem', fontWeight: '700', flexShrink: 0 },
  visitDate: { fontWeight: '600', color: '#1e293b', fontSize: '0.9rem', margin: 0 },
  visitCaregiver: { color: '#64748b', fontSize: '0.8rem', margin: '2px 0 0' },
  chevron: { fontSize: '1.4rem', color: '#94a3b8' },
  emptyBox: { background: '#fff', borderRadius: '10px', padding: '32px', textAlign: 'center', border: '2px dashed #e2e8f0' },
  emptyText: { color: '#94a3b8', fontSize: '0.9rem' },
};
