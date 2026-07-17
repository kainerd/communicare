import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import apiClient from '../api/client';
import { BOARD, CATEGORY_META } from '../data/boardItems';
import SpeechTab from '../components/SpeechTab';

const TABS = ['board', 'saved', 'speech', 'summary'];

export default function VisitSession() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('board');
  const [activeCategory, setActiveCategory] = useState('body_part');

  // Sentence builder
  const [sentence, setSentence] = useState([]);   // [{ category, label, icon }]
  const [freeText, setFreeText] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Saved selections
  const [saved, setSaved] = useState([]);

  // AI summary
  const [summary, setSummary] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  useEffect(() => {
    apiClient.get(`/visits/${id}`)
      .then(({ data }) => setVisit(data.visit))
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false));
    fetchSaved();
    fetchSummary();
  }, [id]);

  async function fetchSaved() {
    try {
      const { data } = await apiClient.get(`/board/visit/${id}`);
      setSaved(data.selections);
    } catch { /* ignore */ }
  }

  async function fetchSummary() {
    try {
      const { data } = await apiClient.get(`/summary/visit/${id}`);
      setSummary(data.summary);
    } catch { /* ignore */ }
  }

  async function handleGenerateSummary() {
    setGenerating(true);
    setSummaryError('');
    try {
      const { data } = await apiClient.post(`/summary/visit/${id}`);
      setSummary(data.summary);
    } catch (err) {
      setSummaryError(err.response?.data?.error || 'Failed to generate summary.');
    } finally {
      setGenerating(false);
    }
  }

  function tapItem(category, label, icon) {
    setSentence((prev) => [...prev, { category, label, icon }]);
  }

  function removeFromSentence(idx) {
    setSentence((prev) => prev.filter((_, i) => i !== idx));
  }

  function clearSentence() {
    setSentence([]);
    setFreeText('');
    setSaveMsg('');
  }

  async function handleSave() {
    const items = [];
    sentence.forEach(({ category, label }) => items.push({ category, label }));
    if (freeText.trim()) items.push({ category: 'free_text', label: freeText.trim() });
    if (items.length === 0) return setSaveMsg('Nothing to save yet.');

    setSaving(true);
    setSaveMsg('');
    try {
      await apiClient.post(`/board/visit/${id}`, { selections: items });
      setSaveMsg('✓ Saved successfully!');
      clearSentence();
      fetchSaved();
    } catch (err) {
      setSaveMsg(err.response?.data?.error || 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  async function handleCloseVisit() {
    if (!window.confirm('Close this visit? No more entries can be added.')) return;
    try {
      await apiClient.patch(`/visits/${id}/close`);
      navigate(`/patients/${visit.patient_id}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to close visit');
    }
  }

  if (loading) return <div style={s.page}><Navbar /><p style={s.msg}>Loading…</p></div>;

  const isOpen = visit?.status === 'open';
  const sentenceText = sentence.map((i) => i.label).join(' · ');

  return (
    <div style={s.page}>
      <Navbar title={`Visit — ${visit?.patient_name}`} />
      <div style={s.content}>
        {/* Header row */}
        <div style={s.topRow}>
          <button style={s.back} onClick={() => navigate(`/patients/${visit?.patient_id}`)}>← Back</button>
          <div style={s.visitMeta}>
            <span style={s.badge(visit?.status)}>{visit?.status === 'open' ? '🟢 Open' : '⚫ Closed'}</span>
            <span style={s.visitDate}>{new Date(visit?.visit_date).toLocaleString()}</span>
          </div>
          {isOpen && (
            <button style={s.closeVisitBtn} onClick={handleCloseVisit}>Close Visit</button>
          )}
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
          {TABS.map((t) => (
            <button
              key={t}
              style={{ ...s.tab, ...(activeTab === t ? s.tabActive : {}) }}
              onClick={() => setActiveTab(t)}
            >
              {t === 'board' ? '📋 Board'
                : t === 'saved' ? `💾 Saved (${saved.length})`
                : t === 'speech' ? '🎤 Speech'
                : `🤖 AI Summary${summary ? ' ✓' : ''}`}
            </button>
          ))}
        </div>

        {/* ═══════════════ BOARD TAB ═══════════════ */}
        {activeTab === 'board' && (
          <div>
            {/* Sentence display */}
            <div style={s.sentenceBox}>
              <p style={s.sentenceLabel}>Patient's message:</p>
              {sentence.length === 0 && !freeText ? (
                <p style={s.sentencePlaceholder}>Tap items below to build a message…</p>
              ) : (
                <div style={s.sentenceChips}>
                  {sentence.map((item, idx) => (
                    <span
                      key={idx}
                      style={{ ...s.chip, background: CATEGORY_META[item.category]?.bg || '#f1f5f9', color: CATEGORY_META[item.category]?.color || '#334155' }}
                      onClick={() => removeFromSentence(idx)}
                      title="Tap to remove"
                    >
                      {item.icon} {item.label} ✕
                    </span>
                  ))}
                  {freeText && (
                    <span style={{ ...s.chip, background: '#f0fdf4', color: '#16a34a' }}>
                      ✏️ {freeText}
                    </span>
                  )}
                </div>
              )}
              {sentenceText && (
                <p style={s.sentenceFull}>"{sentenceText}{freeText ? (sentence.length ? ' · ' : '') + freeText : ''}"</p>
              )}
            </div>

            {/* Category tabs */}
            <div style={s.catTabs}>
              {Object.keys(BOARD).map((cat) => {
                const meta = CATEGORY_META[cat];
                return (
                  <button
                    key={cat}
                    style={{
                      ...s.catTab,
                      background: activeCategory === cat ? meta.color : '#fff',
                      color: activeCategory === cat ? '#fff' : meta.color,
                      borderColor: meta.color,
                    }}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>

            {/* Board grid */}
            {isOpen ? (
              <div style={s.boardGrid}>
                {BOARD[activeCategory].map(({ label, icon }) => (
                  <button
                    key={label}
                    style={{ ...s.boardItem, background: CATEGORY_META[activeCategory].bg, borderColor: CATEGORY_META[activeCategory].color + '44' }}
                    onClick={() => tapItem(activeCategory, label, icon)}
                  >
                    <span style={s.boardIcon}>{icon}</span>
                    <span style={{ ...s.boardLabel, color: CATEGORY_META[activeCategory].color }}>{label}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div style={s.closedNote}>This visit is closed. No new entries can be added.</div>
            )}

            {/* Free text */}
            {isOpen && (
              <div style={s.freeTextSection}>
                <label style={s.freeTextLabel}>✏️ Or type freely:</label>
                <div style={s.freeTextRow}>
                  <input
                    style={s.freeTextInput}
                    value={freeText}
                    onChange={(e) => setFreeText(e.target.value)}
                    placeholder="Type anything the patient wants to say…"
                    maxLength={500}
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            {isOpen && (
              <div style={s.actions}>
                <button style={s.clearBtn} onClick={clearSentence}>Clear All</button>
                <button style={s.saveBtn} onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : '💾 Save to Visit'}
                </button>
                {saveMsg && (
                  <span style={{ color: saveMsg.startsWith('✓') ? '#16a34a' : '#dc2626', fontSize: '0.875rem', fontWeight: '600' }}>
                    {saveMsg}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ SAVED TAB ═══════════════ */}
        {activeTab === 'saved' && (
          <div style={s.savedSection}>
            <h3 style={s.sectionTitle}>All Saved Entries for This Visit</h3>
            {saved.length === 0 ? (
              <div style={s.emptyBox}>
                <p style={{ color: '#94a3b8' }}>No entries saved yet. Use the Board tab to add some.</p>
              </div>
            ) : (
              <div style={s.savedList}>
                {saved.map((sel) => {
                  const meta = CATEGORY_META[sel.category];
                  const icon = sel.category === 'free_text' ? '✏️'
                    : BOARD[sel.category]?.find((i) => i.label === sel.label)?.icon || '•';
                  return (
                    <div key={sel.id} style={{ ...s.savedItem, borderLeft: `4px solid ${meta?.color || '#94a3b8'}` }}>
                      <span style={s.savedIcon}>{icon}</span>
                      <div>
                        <p style={s.savedLabel}>{sel.label}</p>
                        <p style={{ ...s.savedCategory, color: meta?.color || '#94a3b8' }}>
                          {meta?.label || 'Free text'} · {new Date(sel.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ SPEECH TAB ═══════════════ */}
        {activeTab === 'speech' && (
          <div style={s.savedSection}>
            <SpeechTab visitId={id} isOpen={isOpen} />
          </div>
        )}

        {/* ═══════════════ SUMMARY TAB ═══════════════ */}
        {activeTab === 'summary' && (
          <div style={s.savedSection}>
            <div style={s.summaryHeader}>
              <h3 style={s.sectionTitle}>AI Clinical Summary</h3>
              <button
                style={s.generateBtn}
                onClick={handleGenerateSummary}
                disabled={generating}
              >
                {generating ? '⏳ Generating…' : summary ? '🔄 Regenerate' : '✨ Generate Summary'}
              </button>
            </div>

            {summaryError && (
              <div style={s.summaryError}>{summaryError}</div>
            )}

            {generating && (
              <div style={s.summaryLoading}>
                <span style={s.loadingDot}>●</span>
                <span style={s.loadingDot}>●</span>
                <span style={s.loadingDot}>●</span>
                <p style={s.loadingText}>Claude is reading the visit data and writing a clinical summary…</p>
              </div>
            )}

            {!generating && summary && (
              <div style={s.summaryCard}>
                <div style={s.summaryMeta}>
                  <span style={s.summaryBadge}>🤖 Generated by Claude</span>
                  <span style={s.summaryDate}>{new Date(summary.generated_at).toLocaleString()}</span>
                </div>
                <p style={s.summaryText}>{summary.summary_text}</p>
              </div>
            )}

            {!generating && !summary && !summaryError && (
              <div style={s.emptyBox}>
                <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '12px' }}>🤖</span>
                <p style={{ color: '#94a3b8', marginBottom: '6px' }}>No summary yet.</p>
                <p style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>
                  Make sure the visit has board selections or speech logs, then click Generate.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: '#f1f5f9', fontFamily: "'Segoe UI', system-ui, sans-serif" },
  content: { maxWidth: '1000px', margin: '0 auto', padding: '24px 20px' },
  msg: { textAlign: 'center', color: '#94a3b8', marginTop: '60px' },

  topRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' },
  back: { background: 'none', border: 'none', color: '#1e3a5f', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem', padding: 0 },
  visitMeta: { display: 'flex', alignItems: 'center', gap: '10px', flex: 1 },
  badge: (status) => ({
    padding: '4px 12px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: '700',
    background: status === 'open' ? '#dcfce7' : '#f1f5f9',
    color: status === 'open' ? '#16a34a' : '#64748b',
  }),
  visitDate: { fontSize: '0.8rem', color: '#64748b' },
  closeVisitBtn: {
    padding: '7px 16px', background: '#ef4444', color: '#fff', border: 'none',
    borderRadius: '7px', cursor: 'pointer', fontWeight: '700', fontSize: '0.82rem',
  },

  tabs: { display: 'flex', gap: '0', marginBottom: '24px', borderBottom: '2px solid #e2e8f0' },
  tab: {
    padding: '10px 22px', background: 'none', border: 'none', cursor: 'pointer',
    fontSize: '0.9rem', fontWeight: '600', color: '#64748b', borderBottom: '2px solid transparent',
    marginBottom: '-2px',
  },
  tabActive: { color: '#1e3a5f', borderBottomColor: '#1e3a5f' },

  sentenceBox: {
    background: '#1e3a5f', borderRadius: '14px', padding: '20px 24px',
    marginBottom: '20px', minHeight: '100px',
  },
  sentenceLabel: { color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem', fontWeight: '600', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' },
  sentencePlaceholder: { color: 'rgba(255,255,255,0.35)', fontSize: '1rem', fontStyle: 'italic' },
  sentenceChips: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' },
  chip: {
    padding: '6px 12px', borderRadius: '999px', fontSize: '0.875rem',
    fontWeight: '700', cursor: 'pointer', userSelect: 'none',
  },
  sentenceFull: { color: '#fff', fontSize: '1.4rem', fontWeight: '700', lineHeight: 1.4, marginTop: '8px' },

  catTabs: { display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' },
  catTab: {
    padding: '8px 18px', borderRadius: '999px', border: '2px solid', fontSize: '0.875rem',
    fontWeight: '700', cursor: 'pointer', transition: 'all .15s',
  },

  boardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
    gap: '10px',
    marginBottom: '20px',
  },
  boardItem: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '16px 8px', borderRadius: '12px', border: '1.5px solid',
    cursor: 'pointer', transition: 'transform .1s, box-shadow .1s',
    gap: '6px', minHeight: '90px',
  },
  boardIcon: { fontSize: '2rem' },
  boardLabel: { fontSize: '0.78rem', fontWeight: '700', textAlign: 'center' },

  closedNote: {
    textAlign: 'center', padding: '32px', color: '#94a3b8',
    background: '#fff', borderRadius: '10px', border: '2px dashed #e2e8f0', marginBottom: '16px',
  },

  freeTextSection: { marginBottom: '16px' },
  freeTextLabel: { fontSize: '0.85rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' },
  freeTextRow: { display: 'flex', gap: '8px' },
  freeTextInput: {
    flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1',
    fontSize: '0.95rem', outline: 'none', fontFamily: 'inherit',
  },

  actions: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' },
  clearBtn: {
    padding: '10px 20px', background: '#f1f5f9', border: '1px solid #cbd5e1',
    borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem',
  },
  saveBtn: {
    padding: '10px 28px', background: '#22c55e', color: '#fff', border: 'none',
    borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem',
  },

  savedSection: { paddingTop: '4px' },
  sectionTitle: { fontSize: '1rem', fontWeight: '700', color: '#1e3a5f', marginBottom: '16px' },
  emptyBox: {
    background: '#fff', borderRadius: '10px', padding: '40px 32px',
    textAlign: 'center', border: '2px dashed #e2e8f0',
  },
  summaryHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' },
  generateBtn: {
    padding: '10px 22px', background: '#7c3aed', color: '#fff', border: 'none',
    borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem',
  },
  summaryError: {
    background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
    borderRadius: '10px', padding: '14px 18px', marginBottom: '16px', fontSize: '0.9rem',
  },
  summaryLoading: {
    background: '#faf5ff', borderRadius: '12px', padding: '40px',
    textAlign: 'center', border: '1px solid #e9d5ff',
  },
  loadingDot: { color: '#7c3aed', fontSize: '1.5rem', margin: '0 4px', animation: 'pulse 1s infinite' },
  loadingText: { color: '#7c3aed', marginTop: '14px', fontWeight: '600', fontSize: '0.9rem' },
  summaryCard: {
    background: 'linear-gradient(135deg, #faf5ff 0%, #eff6ff 100%)',
    border: '1px solid #e9d5ff', borderRadius: '14px', padding: '28px 32px',
    boxShadow: '0 2px 12px rgba(124,58,237,0.08)',
  },
  summaryMeta: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' },
  summaryBadge: {
    background: '#7c3aed', color: '#fff', fontSize: '0.75rem', fontWeight: '700',
    padding: '4px 12px', borderRadius: '999px',
  },
  summaryDate: { color: '#94a3b8', fontSize: '0.8rem' },
  summaryText: {
    color: '#1e293b', fontSize: '1rem', lineHeight: 1.75,
    fontStyle: 'italic', margin: 0,
  },
  savedList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  savedItem: {
    background: '#fff', borderRadius: '10px', padding: '14px 18px',
    display: 'flex', alignItems: 'center', gap: '14px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  savedIcon: { fontSize: '1.5rem', flexShrink: 0 },
  savedLabel: { fontWeight: '700', color: '#1e293b', fontSize: '0.95rem', margin: 0 },
  savedCategory: { fontSize: '0.78rem', fontWeight: '600', margin: '2px 0 0' },
};
