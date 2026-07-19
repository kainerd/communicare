import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SpeechTab from '../components/SpeechTab';
import { BOARD, CATEGORY_META } from '../data/boardItems';
import {
  fetchVisit, startVisit, closeVisit,
  clearVisitData, fetchBoardSelections,
  saveBoardSelections, deleteBoardSelection,
  fetchSummary, generateSummary,
} from '../services/consultationService';

const TABS = ['board', 'saved', 'speech', 'summary'];

export default function VisitSession() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [visit, setVisit]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState('board');
  const [activeCategory, setActiveCategory] = useState('body_part');

  // Sentence builder
  const [sentence, setSentence] = useState([]);
  const [freeText, setFreeText] = useState('');
  const [saving, setSaving]     = useState(false);
  const [saveMsg, setSaveMsg]   = useState('');

  // Saved board selections
  const [saved, setSaved] = useState([]);

  // AI summary
  const [summary, setSummary]           = useState(null);
  const [generating, setGenerating]     = useState(false);
  const [summaryError, setSummaryError] = useState('');

  // UI state
  const [deletingSelId, setDeletingSelId] = useState(null);
  const [clearing, setClearing]           = useState(false);
  const [completing, setCompleting]       = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm]   = useState(false);

  // speechKey: incrementing this as the `key` prop on <SpeechTab> forces React
  // to unmount + remount it. That resets all its internal state (logs, liveText,
  // finalText, recording) and re-runs its useEffect so it re-fetches the (now
  // empty) log list from the DB after a successful "Clear Session". Without this,
  // the speech tab would show stale entries until the caregiver navigated away,
  // because SpeechTab only re-fetches when visitId changes — not on clear.
  const [speechKey, setSpeechKey] = useState(0);

  // Tracks which visit ID is "current" so that a slow-resolving fetch for a
  // visit the caregiver has already navigated away from can never clobber
  // the newer visit's state (guards against out-of-order async responses).
  const currentIdRef = useRef(id);

  useEffect(() => {
    currentIdRef.current = id;

    // Reset every visit-scoped piece of UI state up front. Because
    // "Start New Consultation" navigates from /visits/:oldId to
    // /visits/:newId — the same route pattern — React Router reuses this
    // component instance instead of unmounting/remounting it. Without this
    // reset, the previous visit's unsaved sentence-builder draft, saved
    // entries, and AI summary would remain visible on screen until (or even
    // after, for the never-persisted draft) the fresh data below loads,
    // making it look like data from Visit 1 "leaked" into Visit 2.
    setLoading(true);
    setVisit(null);
    setActiveTab('board');
    setActiveCategory('body_part');
    setSentence([]);
    setFreeText('');
    setSaveMsg('');
    setSaved([]);
    setSummary(null);
    setSummaryError('');
    setShowClearConfirm(false);
    setShowCompleteModal(false);
    // Reset speechKey so <SpeechTab> remounts fresh for the new visit.
    // Combining with id below means each visit always starts with key `${id}-0`.
    setSpeechKey(0);

    fetchVisit(id)
      .then((v) => { if (currentIdRef.current === id) setVisit(v); })
      .catch(() => { if (currentIdRef.current === id) navigate('/dashboard'); })
      .finally(() => { if (currentIdRef.current === id) setLoading(false); });
    loadSaved();
    loadSummary();
  }, [id]);

  async function loadSaved() {
    try {
      const selections = await fetchBoardSelections(id);
      if (currentIdRef.current === id) setSaved(selections);
    } catch { /* ignore */ }
  }

  async function loadSummary() {
    try {
      const sum = await fetchSummary(id);
      if (currentIdRef.current === id) setSummary(sum);
    } catch { /* ignore */ }
  }

  /* ── AI Summary ── */
  async function handleGenerateSummary() {
    setGenerating(true);
    setSummaryError('');
    try {
      setSummary(await generateSummary(id));
    } catch (err) {
      setSummaryError(err.response?.data?.error || 'Failed to generate summary.');
    } finally {
      setGenerating(false);
    }
  }

  /* ── Sentence builder ── */
  const tapItem = (category, label, icon) =>
    setSentence((prev) => [...prev, { category, label, icon }]);

  const removeFromSentence = (idx) =>
    setSentence((prev) => prev.filter((_, i) => i !== idx));

  function resetSentenceBuilder() {
    setSentence([]);
    setFreeText('');
    setSaveMsg('');
  }

  /* ── Save board entry ── */
  async function handleSave() {
    const items = [];
    sentence.forEach(({ category, label }) => items.push({ category, label }));
    if (freeText.trim()) items.push({ category: 'free_text', label: freeText.trim() });
    if (items.length === 0) return setSaveMsg('Nothing to save yet.');

    setSaving(true);
    setSaveMsg('');
    try {
      await saveBoardSelections(id, items);
      setSaveMsg('✓ Saved successfully!');
      resetSentenceBuilder();
      loadSaved();
    } catch (err) {
      setSaveMsg(err.response?.data?.error || 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  /* ── Delete single saved board entry ── */
  async function handleDeleteSel(selId) {
    if (!window.confirm('Delete this saved entry? This cannot be undone.')) return;
    setDeletingSelId(selId);
    try {
      await deleteBoardSelection(id, selId);
      setSaved((prev) => prev.filter((s) => s.id !== selId));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete entry.');
    } finally {
      setDeletingSelId(null);
    }
  }

  /* ── Clear session ── */

  // Returns true if there is any visit data that would be lost or cleared.
  // Used to decide whether to show the confirm dialog (no point warning the
  // caregiver if the session is already empty).
  function hasSessionData() {
    return sentence.length > 0 || freeText.trim().length > 0 || saved.length > 0 || summary !== null;
  }

  function openClearConfirm() {
    if (!hasSessionData()) return; // nothing to clear — no-op, no unnecessary dialog
    setShowClearConfirm(true);
  }

  async function handleClearSession() {
    setShowClearConfirm(false);
    setClearing(true);
    try {
      await clearVisitData(id);
      // Reset all visit-scoped UI state
      resetSentenceBuilder();
      setSaved([]);
      setSummary(null);
      setSummaryError('');
      setActiveTab('board');
      // Increment speechKey to force <SpeechTab> to remount, which:
      //   (a) resets its internal liveText / finalText / recording state
      //   (b) re-runs its useEffect → re-fetches logs (now empty from DB)
      // Without this, the Speech tab would continue showing the cleared logs
      // until the caregiver navigated away, because SpeechTab only re-fetches
      // when visitId changes — which it doesn't after a clear (same visit).
      setSpeechKey((k) => k + 1);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to clear session data.');
    } finally {
      setClearing(false);
    }
  }

  /* ── Complete consultation ── */
  async function handleCompleteConsultation() {
    if (!window.confirm('Mark this consultation as complete? The visit will be closed.')) return;
    setCompleting(true);
    try {
      await closeVisit(id);
      setVisit((v) => ({ ...v, status: 'closed' }));
      setShowCompleteModal(true);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to close visit.');
    } finally {
      setCompleting(false);
    }
  }

  /* ── Start new consultation from modal ── */
  async function handleStartNew() {
    setShowCompleteModal(false);
    try {
      const newVisit = await startVisit(visit.patient_id);
      navigate(`/visits/${newVisit.id}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Could not start a new visit.');
    }
  }

  if (loading) return <div style={s.page}><Navbar /><p style={s.msg}>Loading…</p></div>;

  const isOpen = visit?.status === 'open';
  const sentenceText = sentence.map((i) => i.label).join(' · ');

  return (
    <div style={s.page}>
      <Navbar title={`Visit — ${visit?.patient_name}`} />
      <div style={s.content} className="cc-content">

        {/* ── Header row ── */}
        <div style={s.topRow}>
          <button style={s.backBtn} onClick={() => navigate(`/patients/${visit?.patient_id}`)}>
            ← Back
          </button>
          <div style={s.visitMeta}>
            <span style={s.badge(visit?.status)}>
              {visit?.status === 'open' ? '● Open' : '○ Closed'}
            </span>
            <span style={s.visitDate}>{new Date(visit?.visit_date).toLocaleString()}</span>
          </div>

          {isOpen && (
            <div style={s.headerActions} className="cc-visit-header-actions">
              <button
                style={s.clearSessionBtn}
                onClick={openClearConfirm}
                disabled={clearing}
                title="Clear all consultation data and start fresh"
              >
                {clearing ? '⏳ Clearing…' : '🗑 Clear Session'}
              </button>
              {summary && (
                <button
                  style={s.completeBtn}
                  onClick={handleCompleteConsultation}
                  disabled={completing}
                >
                  {completing ? '⏳ Saving…' : '✅ Complete & Save'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Tab bar ── */}
        <div style={s.tabs} className="cc-visit-tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={activeTab === t}
              style={{ ...s.tab, ...(activeTab === t ? s.tabActive : {}) }}
              onClick={() => setActiveTab(t)}
              data-notab
            >
              {t === 'board'   ? '📋 Board'
               : t === 'saved'   ? `💾 Saved (${saved.length})`
               : t === 'speech'  ? '🎤 Speech'
               : `🤖 AI Summary${summary ? ' ✓' : ''}`}
            </button>
          ))}
        </div>

        {/* ═══ BOARD TAB ═══ */}
        {activeTab === 'board' && (
          <div>
            {/* Patient sentence display */}
            <div style={s.sentenceBox} aria-live="polite" aria-label="Patient's current message">
              <p style={s.sentenceLabel}>Patient's message</p>
              {sentence.length === 0 && !freeText ? (
                <p style={s.sentencePlaceholder}>
                  Tap a board button below to build a message…
                </p>
              ) : (
                <div style={s.sentenceChips}>
                  {sentence.map((item, idx) => {
                    const meta = CATEGORY_META[item.category];
                    return (
                      <button
                        key={idx}
                        style={{ ...s.chip, background: meta?.bg, color: meta?.color, border: `1.5px solid ${meta?.border || meta?.bg}` }}
                        onClick={() => removeFromSentence(idx)}
                        title="Tap to remove"
                        aria-label={`Remove ${item.label}`}
                      >
                        {item.icon} {item.label} ✕
                      </button>
                    );
                  })}
                  {freeText && (
                    <span style={{ ...s.chip, background: '#f0f4f8', color: '#37474f', border: '1.5px solid #b0bec5' }}>
                      ✏️ {freeText}
                    </span>
                  )}
                </div>
              )}
              {sentenceText && (
                <p style={s.sentenceFull} className="cc-sentence-full">
                  "{sentenceText}{freeText ? (sentence.length ? ' · ' : '') + freeText : ''}"
                </p>
              )}
            </div>

            {/* Category tabs */}
            <div style={s.catTabs} role="tablist" aria-label="Communication categories">
              {Object.keys(BOARD).map((cat) => {
                const meta = CATEGORY_META[cat];
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    role="tab"
                    aria-selected={isActive}
                    style={{
                      ...s.catTab,
                      background:   isActive ? meta.color  : meta.bg,
                      color:        isActive ? '#fff'      : meta.color,
                      borderColor:  meta.border,
                      boxShadow:    isActive ? `0 2px 8px ${meta.color}55` : 'none',
                    }}
                    onClick={() => setActiveCategory(cat)}
                    data-notab
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>

            {/* Board grid — the core AAC interface */}
            {isOpen ? (
              <div style={s.boardGrid} className="board-grid" role="grid" aria-label={`${CATEGORY_META[activeCategory]?.label} board`}>
                {BOARD[activeCategory].map(({ label, icon }) => {
                  const meta = CATEGORY_META[activeCategory];
                  return (
                    <button
                      key={label}
                      style={{
                        ...s.boardItem,
                        background:  meta.bg,
                        borderColor: meta.border,
                      }}
                      className="board-item"
                      onClick={() => tapItem(activeCategory, label, icon)}
                      aria-label={`Select ${label}`}
                    >
                      <span style={s.boardIcon} aria-hidden>{icon}</span>
                      <span style={{ ...s.boardLabel, color: meta.color }}>{label}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div style={s.closedNote} role="status">
                This visit is closed. No new entries can be added.
              </div>
            )}

            {/* Free text input */}
            {isOpen && (
              <div style={s.freeTextSection}>
                <label style={s.freeTextLabel} htmlFor="freetext">✏️ Or type freely:</label>
                <input
                  id="freetext"
                  style={s.freeTextInput}
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  placeholder="Type anything the patient wants to say…"
                  maxLength={500}
                />
              </div>
            )}

            {/* Save row */}
            {isOpen && (
              <div style={s.actions}>
                <button style={s.clearBtn} onClick={resetSentenceBuilder}>
                  Clear
                </button>
                <button style={s.saveBtn} onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : '💾 Save to Visit'}
                </button>
                {saveMsg && (
                  <span style={{ color: saveMsg.startsWith('✓') ? '#2e7d32' : '#c62828', fontSize: '0.9rem', fontWeight: '700' }}>
                    {saveMsg}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══ SAVED TAB ═══ */}
        {activeTab === 'saved' && (
          <div style={s.savedSection}>
            <h3 style={s.sectionTitle}>All Saved Entries for This Visit</h3>
            {saved.length === 0 ? (
              <div style={s.emptyBox}>
                <p style={s.emptyText}>No entries saved yet. Use the Board tab to add some.</p>
              </div>
            ) : (
              <div style={s.savedList}>
                {saved.map((sel) => {
                  const meta = CATEGORY_META[sel.category] || CATEGORY_META.free_text;
                  const icon = sel.category === 'free_text' ? '✏️'
                    : BOARD[sel.category]?.find((i) => i.label === sel.label)?.icon || '•';
                  return (
                    <div key={sel.id} style={{ ...s.savedItem, borderLeft: `4px solid ${meta.color}` }}>
                      <span style={s.savedIcon} aria-hidden>{icon}</span>
                      <div style={{ flex: 1 }}>
                        <p style={s.savedLabel}>{sel.label}</p>
                        <p style={{ ...s.savedCategory, color: meta.color }}>
                          {meta.label} · {new Date(sel.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      {isOpen && (
                        <button
                          style={s.itemDeleteBtn}
                          disabled={deletingSelId === sel.id}
                          onClick={() => handleDeleteSel(sel.id)}
                          title="Remove this entry"
                          aria-label={`Remove ${sel.label}`}
                        >
                          {deletingSelId === sel.id ? '⏳' : '×'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══ SPEECH TAB ═══ */}
        {activeTab === 'speech' && (
          <div style={s.savedSection}>
            <SpeechTab
              key={`${id}-${speechKey}`}
              visitId={id}
              isOpen={isOpen}
            />
          </div>
        )}

        {/* ═══ SUMMARY TAB ═══ */}
        {activeTab === 'summary' && (
          <div style={s.savedSection}>
            <div style={s.summaryHeader}>
              <h3 style={s.sectionTitle}>AI Clinical Summary</h3>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                {isOpen && (
                  <button style={s.generateBtn} onClick={handleGenerateSummary} disabled={generating}>
                    {generating ? '⏳ Generating…' : summary ? '🔄 Regenerate' : '✨ Generate Summary'}
                  </button>
                )}
                {isOpen && summary && (
                  <button style={s.completeBtn} onClick={handleCompleteConsultation} disabled={completing}>
                    {completing ? 'Saving…' : '✅ Complete & Save'}
                  </button>
                )}
              </div>
            </div>

            {summaryError && <div style={s.summaryError} role="alert">{summaryError}</div>}

            {generating && (
              <div style={s.summaryLoading} aria-busy="true">
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
                {isOpen && (
                  <div style={s.summaryAction}>
                    <p style={s.summaryActionHint}>Ready to save this consultation?</p>
                    <button style={s.completeBtn} onClick={handleCompleteConsultation} disabled={completing}>
                      {completing ? 'Saving…' : '✅ Complete & Save Consultation'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {!generating && !summary && !summaryError && (
              <div style={s.emptyBox}>
                <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '12px' }}>🤖</span>
                <p style={s.emptyText}>No summary yet.</p>
                <p style={{ color: '#b0bec5', fontSize: '0.875rem', marginTop: '4px' }}>
                  Make sure the visit has board selections or speech logs, then click Generate.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ CLEAR CONFIRMATION MODAL ═══ */}
      {showClearConfirm && (
        <div style={overlay} className="cc-modal-overlay">
          <div style={modal} className="cc-modal" role="dialog" aria-modal="true">
            <div style={modalIcon}>🗑</div>
            <h3 style={modalTitle}>Clear Consultation Session?</h3>
            <p style={modalBody}>
              This will permanently delete all board selections, speech transcripts, and the AI
              summary recorded <strong>in this session</strong>. The visit stays open so you can
              start fresh. Past visits and their summaries are not affected.
            </p>
            <div style={modalActions}>
              <button style={modalCancel} onClick={() => setShowClearConfirm(false)}>Cancel</button>
              <button style={modalConfirmDanger} onClick={handleClearSession}>
                Yes, Clear Everything
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ COMPLETE CONSULTATION MODAL ═══ */}
      {showCompleteModal && (
        <div style={overlay} className="cc-modal-overlay">
          <div style={modal} className="cc-modal" role="dialog" aria-modal="true">
            <div style={{ ...modalIcon, fontSize: '3rem' }}>✅</div>
            <h3 style={modalTitle}>Consultation Saved!</h3>
            <p style={modalBody}>
              The consultation for <strong>{visit?.patient_name}</strong> has been completed and
              saved to their history. Would you like to start a new consultation now?
            </p>
            <div style={modalActions}>
              <button style={modalCancel} onClick={() => { setShowCompleteModal(false); navigate(`/patients/${visit?.patient_id}`); }}>
                View Patient Record
              </button>
              <button style={modalConfirmGreen} onClick={handleStartNew}>
                ＋ Start New Consultation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Styles ── */
const s = {
  page: { minHeight: '100vh', background: '#f0f4f9', fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" },
  content: { maxWidth: '1000px', margin: '0 auto', padding: '24px 20px' },
  msg:  { textAlign: 'center', color: '#7a8fa0', marginTop: '60px' },

  // Header
  topRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' },
  backBtn: {
    background: 'none', border: 'none', color: '#1565c0', fontWeight: '700',
    cursor: 'pointer', fontSize: '0.95rem', padding: 0,
  },
  visitMeta: { display: 'flex', alignItems: 'center', gap: '10px', flex: 1 },
  badge: (status) => ({
    padding: '5px 14px', borderRadius: '999px', fontSize: '0.82rem', fontWeight: '700',
    background: status === 'open' ? '#e8f5e9' : '#f0f4f9',
    color:      status === 'open' ? '#2e7d32' : '#7a8fa0',
    border:     `1.5px solid ${status === 'open' ? '#a5d6a7' : '#dde3ea'}`,
  }),
  visitDate: { fontSize: '0.85rem', color: '#7a8fa0', fontWeight: '500' },
  headerActions: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' },
  clearSessionBtn: {
    padding: '9px 18px', background: '#fff3e0', color: '#e65100',
    border: '1.5px solid #ffcc80', borderRadius: '10px',
    cursor: 'pointer', fontWeight: '700', fontSize: '0.875rem',
  },
  completeBtn: {
    padding: '9px 20px', background: '#2e7d32', color: '#fff', border: 'none',
    borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem',
  },

  // Tab bar
  tabs: {
    display: 'flex', gap: 0, marginBottom: '24px',
    borderBottom: '2px solid #dde3ea',
  },
  tab: {
    padding: '11px 22px', background: 'none', border: 'none', cursor: 'pointer',
    fontSize: '0.9rem', fontWeight: '600', color: '#7a8fa0',
    borderBottom: '2px solid transparent', marginBottom: '-2px',
    whiteSpace: 'nowrap', transition: 'color .15s',
  },
  tabActive: { color: '#1565c0', borderBottomColor: '#1565c0' },

  // Sentence display box
  sentenceBox: {
    background: '#0f1c2e', borderRadius: '16px', padding: '22px 26px',
    marginBottom: '20px', minHeight: '108px',
  },
  sentenceLabel: {
    color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: '700',
    marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.08em',
  },
  sentencePlaceholder: {
    color: 'rgba(255,255,255,0.3)', fontSize: '1.05rem', fontStyle: 'italic',
  },
  sentenceChips: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' },
  chip: {
    padding: '7px 14px', borderRadius: '999px', fontSize: '0.875rem',
    fontWeight: '700', cursor: 'pointer', userSelect: 'none',
    transition: 'opacity .1s',
    border: 'none',
  },
  sentenceFull: {
    color: '#fff', fontSize: '1.5rem', fontWeight: '800', lineHeight: 1.35, marginTop: '8px',
  },

  // Category tabs
  catTabs: { display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' },
  catTab: {
    padding: '10px 20px', borderRadius: '999px', border: '2px solid',
    fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer',
    transition: 'all .15s', whiteSpace: 'nowrap',
  },

  /*
   * AAC Board buttons — the most critical UI element in the whole app.
   * Requirements:
   *   • min 112×112px so patients with limited motor control can tap accurately
   *   • Icon 2.75rem (44px) — clearly visible at arm's length from a tablet
   *   • Label 0.9rem bold — legible even for users with low vision
   *   • Strong border so button boundaries are unambiguous
   *   • Large gap between icon and label for visual clarity
   *   • Hover/active animations handled via CSS class .board-item in index.css
   */
  boardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: '12px',
    marginBottom: '22px',
  },
  boardItem: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '18px 8px', borderRadius: '14px', border: '2px solid',
    cursor: 'pointer', gap: '10px', minHeight: '112px',
    background: '#fff',
  },
  boardIcon:  { fontSize: '2.75rem', lineHeight: 1 },
  boardLabel: { fontSize: '0.9rem', fontWeight: '700', textAlign: 'center', lineHeight: 1.2 },

  closedNote: {
    textAlign: 'center', padding: '36px', color: '#7a8fa0',
    background: '#fff', borderRadius: '12px', border: '2px dashed #dde3ea', marginBottom: '16px',
  },

  // Free text
  freeTextSection: { marginBottom: '18px' },
  freeTextLabel:   { fontSize: '0.9rem', fontWeight: '600', color: '#4f6070', display: 'block', marginBottom: '8px' },
  freeTextInput: {
    width: '100%', padding: '13px 16px', borderRadius: '10px', border: '1.5px solid #dde3ea',
    fontSize: '1rem', outline: 'none', fontFamily: 'inherit', color: '#0f1c2e',
    boxSizing: 'border-box',
  },

  // Actions
  actions: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' },
  clearBtn: {
    padding: '11px 22px', background: '#f5f7fa', border: '1.5px solid #dde3ea',
    borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', color: '#4f6070',
  },
  saveBtn: {
    padding: '11px 28px', background: '#2e7d32', color: '#fff', border: 'none',
    borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem',
  },

  // Saved tab
  savedSection: { paddingTop: '4px' },
  sectionTitle: { fontSize: '1.05rem', fontWeight: '700', color: '#0f1c2e', marginBottom: '18px' },
  emptyBox: {
    background: '#fff', borderRadius: '12px', padding: '44px 32px',
    textAlign: 'center', border: '2px dashed #dde3ea',
  },
  emptyText: { color: '#7a8fa0', fontSize: '0.9rem' },

  savedList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  savedItem: {
    background: '#fff', borderRadius: '12px', padding: '14px 18px',
    display: 'flex', alignItems: 'center', gap: '14px',
    boxShadow: '0 1px 4px rgba(15,28,46,0.05)',
  },
  savedIcon: { fontSize: '1.6rem', flexShrink: 0 },
  savedLabel: { fontWeight: '700', color: '#0f1c2e', fontSize: '0.95rem', margin: 0 },
  savedCategory: { fontSize: '0.8rem', fontWeight: '600', margin: '2px 0 0' },
  itemDeleteBtn: {
    background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem',
    color: '#b0bec5', padding: '4px 8px', borderRadius: '6px', flexShrink: 0, fontWeight: '700',
  },

  // Summary tab
  summaryHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: '22px', flexWrap: 'wrap', gap: '10px',
  },
  generateBtn: {
    padding: '11px 24px', background: '#6a1b9a', color: '#fff', border: 'none',
    borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem',
  },
  summaryError: {
    background: '#ffebee', color: '#c62828', border: '1px solid #ef9a9a',
    borderRadius: '12px', padding: '14px 18px', marginBottom: '16px', fontSize: '0.9rem',
  },
  summaryLoading: {
    background: '#f3e5f5', borderRadius: '14px', padding: '44px',
    textAlign: 'center', border: '1px solid #ce93d8',
  },
  loadingDot:  { color: '#6a1b9a', fontSize: '1.5rem', margin: '0 4px' },
  loadingText: { color: '#6a1b9a', marginTop: '16px', fontWeight: '600', fontSize: '0.9rem' },
  summaryCard: {
    background: 'linear-gradient(135deg, #f3e5f5 0%, #e3f2fd 100%)',
    border: '1px solid #ce93d8', borderRadius: '16px', padding: '28px 32px',
    boxShadow: '0 2px 16px rgba(106,27,154,0.08)',
  },
  summaryMeta: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px', flexWrap: 'wrap' },
  summaryBadge: {
    background: '#6a1b9a', color: '#fff', fontSize: '0.78rem',
    fontWeight: '700', padding: '4px 14px', borderRadius: '999px',
  },
  summaryDate: { color: '#7a8fa0', fontSize: '0.82rem' },
  summaryText: {
    color: '#0f1c2e', fontSize: '1rem', lineHeight: 1.75, fontStyle: 'italic', margin: 0,
  },
  summaryAction: {
    marginTop: '22px', paddingTop: '18px', borderTop: '1px solid rgba(206,147,216,0.5)',
  },
  summaryActionHint: {
    color: '#6a1b9a', fontSize: '0.875rem', fontWeight: '600', marginBottom: '12px',
  },
};

// Modal styles
const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(15,28,46,0.6)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000, padding: '20px',
};
const modal = {
  background: '#fff', borderRadius: '18px', padding: '40px 36px',
  maxWidth: '480px', width: '100%', boxShadow: '0 24px 80px rgba(15,28,46,0.2)',
  textAlign: 'center',
};
const modalIcon    = { fontSize: '2.5rem', marginBottom: '14px' };
const modalTitle   = { fontSize: '1.25rem', fontWeight: '800', color: '#0f1c2e', margin: '0 0 12px' };
const modalBody    = { color: '#4f6070', fontSize: '0.9rem', lineHeight: 1.65, margin: '0 0 28px' };
const modalActions = { display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' };
const modalCancel  = {
  padding: '12px 24px', background: '#f5f7fa', border: '1.5px solid #dde3ea',
  borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem',
};
const modalConfirmDanger = {
  padding: '12px 24px', background: '#c62828', color: '#fff', border: 'none',
  borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem',
};
const modalConfirmGreen = {
  padding: '12px 24px', background: '#2e7d32', color: '#fff', border: 'none',
  borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem',
};
