import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
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
      <Navbar title="Caregiver Dashboard" />
      <div style={s.content}>
        <div style={s.header}>
          <div>
            <h2 style={s.heading}>My Patients</h2>
            <p style={s.sub}>{patients.length} patient{patients.length !== 1 ? 's' : ''} registered</p>
          </div>
          <button style={s.addBtn} onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '+ Add Patient'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAddPatient} style={s.form}>
            <h3 style={s.formTitle}>New Patient</h3>
            <div style={s.formGrid}>
              <div style={s.field}>
                <label style={s.label}>Full Name *</label>
                <input style={s.input} name="full_name" value={form.full_name} onChange={handleChange} placeholder="Patient's full name" required />
              </div>
              <div style={s.field}>
                <label style={s.label}>Age</label>
                <input style={s.input} name="age" type="number" min="0" max="120" value={form.age} onChange={handleChange} placeholder="e.g. 45" />
              </div>
              <div style={s.field}>
                <label style={s.label}>Gender</label>
                <select style={s.input} name="gender" value={form.gender} onChange={handleChange}>
                  <option value="">Select…</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div style={s.field}>
              <label style={s.label}>Medical Notes</label>
              <textarea style={{ ...s.input, minHeight: '80px', resize: 'vertical' }} name="medical_notes" value={form.medical_notes} onChange={handleChange} placeholder="Existing conditions, allergies, etc." />
            </div>
            {formError && <p style={s.error}>{formError}</p>}
            <button style={s.submitBtn} type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save Patient'}
            </button>
          </form>
        )}

        {loading ? (
          <p style={s.empty}>Loading patients…</p>
        ) : patients.length === 0 ? (
          <div style={s.emptyBox}>
            <span style={s.emptyIcon}>👥</span>
            <p style={s.emptyText}>No patients yet. Click <strong>+ Add Patient</strong> to get started.</p>
          </div>
        ) : (
          <div style={s.grid}>
            {patients.map((p) => (
              <div
                key={p.id}
                style={s.card}
                onClick={() => navigate(`/patients/${p.id}`)}
              >
                <div style={s.avatar}>{p.full_name.charAt(0).toUpperCase()}</div>
                <div style={s.cardBody}>
                  <h3 style={s.cardName}>{p.full_name}</h3>
                  <p style={s.cardMeta}>
                    {p.age ? `Age ${p.age}` : 'Age unknown'}
                    {p.gender ? ` · ${p.gender}` : ''}
                  </p>
                  {p.medical_notes && (
                    <p style={s.cardNotes}>{p.medical_notes.substring(0, 80)}{p.medical_notes.length > 80 ? '…' : ''}</p>
                  )}
                  <p style={s.visitCount}>📋 {p.visit_count} visit{p.visit_count !== 1 ? 's' : ''}</p>
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
  content: { maxWidth: '960px', margin: '0 auto', padding: '32px 24px' },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' },
  heading: { fontSize: '1.75rem', fontWeight: '800', color: '#1e3a5f', margin: 0 },
  sub: { color: '#64748b', marginTop: '4px', fontSize: '0.9rem' },
  addBtn: {
    background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: '8px',
    padding: '10px 20px', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer',
  },
  form: {
    background: '#fff', borderRadius: '12px', padding: '24px 28px',
    marginBottom: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    border: '1px solid #e2e8f0',
  },
  formTitle: { fontSize: '1.1rem', fontWeight: '700', color: '#1e3a5f', marginBottom: '16px' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: '12px', marginBottom: '12px' },
  field: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '0.8rem', fontWeight: '600', color: '#475569' },
  input: { padding: '9px 12px', borderRadius: '7px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit' },
  error: { color: '#dc2626', fontSize: '0.85rem', background: '#fef2f2', padding: '8px 12px', borderRadius: '6px', border: '1px solid #fecaca' },
  submitBtn: {
    marginTop: '12px', padding: '10px 24px', background: '#22c55e', color: '#fff',
    border: 'none', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer',
  },
  grid: { display: 'flex', flexDirection: 'column', gap: '12px' },
  card: {
    background: '#fff', borderRadius: '12px', padding: '20px 24px',
    display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0',
    transition: 'box-shadow .15s',
  },
  avatar: {
    width: '48px', height: '48px', borderRadius: '50%',
    background: '#1e3a5f', color: '#fff', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontSize: '1.25rem', fontWeight: '800', flexShrink: 0,
  },
  cardBody: { flex: 1 },
  cardName: { fontSize: '1rem', fontWeight: '700', color: '#1e293b', margin: '0 0 2px' },
  cardMeta: { fontSize: '0.8rem', color: '#64748b', margin: '0 0 4px' },
  cardNotes: { fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 4px', fontStyle: 'italic' },
  visitCount: { fontSize: '0.8rem', color: '#475569', margin: 0 },
  chevron: { fontSize: '1.5rem', color: '#94a3b8' },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: '40px' },
  emptyBox: {
    background: '#fff', borderRadius: '12px', padding: '60px 32px',
    textAlign: 'center', border: '2px dashed #e2e8f0',
  },
  emptyIcon: { fontSize: '3rem', display: 'block', marginBottom: '12px' },
  emptyText: { color: '#94a3b8', fontSize: '0.95rem' },
};
