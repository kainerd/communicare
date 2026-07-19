import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import WeatherClock from '../components/WeatherClock';
import apiClient from '../api/client';

export default function CaregiverDashboard() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ full_name: '', age: '', gender: '', medical_notes: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchPatients(); }, []);

  async function fetchPatients() {
    try {
      const { data } = await apiClient.get('/patients');
      setPatients(data.patients);
    } catch {
      // silently handled — empty state shows
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError('');
  }

  async function handleAddPatient(e) {
    e.preventDefault();
    if (!form.full_name.trim()) return setFormError('Patient name is required');
    setSaving(true);
    try {
      const { data } = await apiClient.post('/patients', form);
      setPatients([data.patient, ...patients]);
      setForm({ full_name: '', age: '', gender: '', medical_notes: '' });
      setShowForm(false);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to add patient');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={s.page}>
      <Navbar title="Dashboard" />

      <div style={s.content} className="cc-content">
        <WeatherClock />

        <div style={s.header} className="cc-dash-header">
          <div>
            <h2 style={s.heading}>My Patients</h2>
            <p style={s.sub}>
              {loading ? 'Loading…' : `${patients.length} patient${patients.length !== 1 ? 's' : ''} registered`}
            </p>
          </div>
          <button
            style={showForm ? s.cancelBtn : s.addBtn}
            onClick={() => { setShowForm(!showForm); setFormError(''); }}
          >
            {showForm ? '✕ Cancel' : '+ Add Patient'}
          </button>
        </div>

        {/* Add patient form */}
        {showForm && (
          <form onSubmit={handleAddPatient} style={s.form}>
            <h3 style={s.formTitle}>New Patient Record</h3>
            <div style={s.formGrid} className="form-grid">
              <div style={s.field}>
                <label style={s.label} htmlFor="pname">Full Name <span style={s.required}>*</span></label>
                <input id="pname" style={s.input} name="full_name" value={form.full_name}
                  onChange={handleChange} placeholder="Patient's full name" required />
              </div>
              <div style={s.field}>
                <label style={s.label} htmlFor="page">Age</label>
                <input id="page" style={s.input} name="age" type="number" min="0" max="120"
                  value={form.age} onChange={handleChange} placeholder="e.g. 45" />
              </div>
              <div style={s.field}>
                <label style={s.label} htmlFor="pgender">Gender</label>
                <select id="pgender" style={s.input} name="gender" value={form.gender} onChange={handleChange}>
                  <option value="">Select…</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div style={s.field}>
              <label style={s.label} htmlFor="pnotes">Medical Notes</label>
              <textarea id="pnotes" style={{ ...s.input, minHeight: '88px', resize: 'vertical' }}
                name="medical_notes" value={form.medical_notes} onChange={handleChange}
                placeholder="Existing conditions, allergies, communication needs…" />
            </div>
            {formError && <p style={s.error} role="alert">{formError}</p>}
            <div style={s.formActions}>
              <button style={s.submitBtn} type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save Patient'}
              </button>
            </div>
          </form>
        )}

        {/* Patient list */}
        {loading ? (
          <div style={s.loading}>Loading patients…</div>
        ) : patients.length === 0 ? (
          <div style={s.emptyBox}>
            <span style={s.emptyIcon}>👥</span>
            <p style={s.emptyTitle}>No patients yet</p>
            <p style={s.emptyText}>Click <strong>+ Add Patient</strong> above to register your first patient.</p>
          </div>
        ) : (
          <div style={s.grid}>
            {patients.map((p) => (
              <div
                key={p.id}
                style={s.card}
                className="patient-card"
                onClick={() => navigate(`/patients/${p.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/patients/${p.id}`)}
              >
                <div style={s.avatar}>{p.full_name.charAt(0).toUpperCase()}</div>
                <div style={s.cardBody}>
                  <h3 style={s.cardName}>{p.full_name}</h3>
                  <p style={s.cardMeta}>
                    {p.age ? `Age ${p.age}` : 'Age unknown'}
                    {p.gender ? ` · ${p.gender.charAt(0).toUpperCase() + p.gender.slice(1)}` : ''}
                  </p>
                  {p.medical_notes && (
                    <p style={s.cardNotes}>
                      {p.medical_notes.substring(0, 80)}{p.medical_notes.length > 80 ? '…' : ''}
                    </p>
                  )}
                  <p style={s.visitBadge}>
                    📋 {p.visit_count} consultation{p.visit_count !== 1 ? 's' : ''}
                  </p>
                </div>
                <span style={s.chevron} aria-hidden>›</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    background: '#f0f4f9',
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
  },
  content: { maxWidth: '960px', margin: '0 auto', padding: '32px 24px' },

  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '24px',
    gap: '12px',
  },
  heading: { fontSize: '1.75rem', fontWeight: '800', color: '#0f1c2e', margin: 0 },
  sub: { color: '#7a8fa0', marginTop: '4px', fontSize: '0.9rem' },

  addBtn: {
    background: '#1565c0', color: '#fff', border: 'none', borderRadius: '10px',
    padding: '12px 22px', fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer',
    whiteSpace: 'nowrap', flexShrink: 0,
  },
  cancelBtn: {
    background: '#f5f7fa', color: '#4f6070', border: '1.5px solid #dde3ea', borderRadius: '10px',
    padding: '12px 22px', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer',
    whiteSpace: 'nowrap', flexShrink: 0,
  },

  // Form
  form: {
    background: '#fff', borderRadius: '16px', padding: '28px 32px',
    marginBottom: '28px', boxShadow: '0 2px 16px rgba(15,28,46,0.07)',
    border: '1px solid #dde3ea',
  },
  formTitle: { fontSize: '1.1rem', fontWeight: '700', color: '#0f1c2e', marginBottom: '20px' },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '16px',
  },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '0.875rem', fontWeight: '600', color: '#4f6070' },
  required: { color: '#c62828' },
  input: {
    padding: '11px 14px',
    borderRadius: '10px',
    border: '1.5px solid #dde3ea',
    fontSize: '1rem',
    outline: 'none',
    fontFamily: 'inherit',
    color: '#0f1c2e',
    transition: 'border-color .2s',
  },
  error: {
    background: '#ffebee', color: '#c62828', border: '1px solid #ef9a9a',
    borderRadius: '10px', padding: '12px 16px', fontSize: '0.875rem', fontWeight: '500',
  },
  formActions: { marginTop: '4px' },
  submitBtn: {
    padding: '12px 28px', background: '#2e7d32', color: '#fff', border: 'none',
    borderRadius: '10px', fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer',
  },

  // Patient grid
  grid: { display: 'flex', flexDirection: 'column', gap: '10px' },
  card: {
    background: '#fff', borderRadius: '14px', padding: '20px 24px',
    display: 'flex', alignItems: 'center', gap: '18px', cursor: 'pointer',
    boxShadow: '0 1px 6px rgba(15,28,46,0.06)', border: '1px solid #dde3ea',
  },
  avatar: {
    width: '52px', height: '52px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #1565c0, #1976d2)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.3rem', fontWeight: '800', flexShrink: 0,
  },
  cardBody: { flex: 1 },
  cardName: { fontSize: '1.05rem', fontWeight: '700', color: '#0f1c2e', margin: '0 0 3px' },
  cardMeta: { fontSize: '0.875rem', color: '#7a8fa0', margin: '0 0 4px' },
  cardNotes: { fontSize: '0.85rem', color: '#7a8fa0', margin: '0 0 4px', fontStyle: 'italic' },
  visitBadge: { fontSize: '0.85rem', color: '#1565c0', fontWeight: '600', margin: 0 },
  chevron: { fontSize: '1.5rem', color: '#b0bec5', fontWeight: '400' },

  loading: { textAlign: 'center', color: '#7a8fa0', marginTop: '48px', fontSize: '0.95rem' },
  emptyBox: {
    background: '#fff', borderRadius: '16px', padding: '64px 32px',
    textAlign: 'center', border: '2px dashed #dde3ea',
  },
  emptyIcon: { fontSize: '3rem', display: 'block', marginBottom: '14px' },
  emptyTitle: { fontSize: '1.1rem', fontWeight: '700', color: '#0f1c2e', marginBottom: '8px' },
  emptyText: { color: '#7a8fa0', fontSize: '0.95rem' },
};
