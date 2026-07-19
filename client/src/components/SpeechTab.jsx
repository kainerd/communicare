import { useState, useEffect, useRef } from 'react';
import apiClient from '../api/client';
import { deleteSpeechLog } from '../services/consultationService';

const SpeechSupported = typeof window !== 'undefined' &&
  ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

// Web Speech API error codes → user-facing messages. Previously these were
// only logged to the console, so if a caregiver denied mic access (or the
// mic was unavailable/muted), Start Recording would silently flip back to
// its idle state with zero indication of what went wrong.
const SPEECH_ERROR_MESSAGES = {
  'not-allowed':    'Microphone access was denied. Please allow microphone permissions for this site and try again.',
  'permission-denied': 'Microphone access was denied. Please allow microphone permissions for this site and try again.',
  'audio-capture':  'No microphone was found. Please connect a microphone and try again.',
  'no-speech':      'No speech was detected. Please try again.',
  'network':        'A network error interrupted speech recognition. Please check your connection and try again.',
  'aborted':        '', // user-initiated stop — not an error worth surfacing
};

export default function SpeechTab({ visitId, isOpen }) {
  const [recording, setRecording]       = useState(false);
  const [liveText, setLiveText]         = useState('');
  const [finalText, setFinalText]       = useState('');
  const [logs, setLogs]                 = useState([]);
  const [saving, setSaving]             = useState(false);
  const [msg, setMsg]                   = useState('');
  const [patientView, setPatientView]   = useState(false);
  const [deletingLogId, setDeletingLogId] = useState(null);

  const recognitionRef = useRef(null);

  useEffect(() => { fetchLogs(); }, [visitId]);

  async function fetchLogs() {
    try {
      const { data } = await apiClient.get(`/speech/visit/${visitId}`);
      setLogs(data.logs);
    } catch { /* ignore */ }
  }

  function startRecording() {
    if (!SpeechSupported) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous     = true;
    recognition.interimResults = true;
    recognition.lang           = 'en-US';

    recognition.onresult = (event) => {
      let interim = '';
      let final   = finalText;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += (final ? ' ' : '') + transcript;
        } else {
          interim = transcript;
        }
      }
      setFinalText(final);
      setLiveText(interim);
    };

    recognition.onerror = (e) => {
      console.error('Speech error:', e.error);
      setRecording(false);
      setMsg(SPEECH_ERROR_MESSAGES[e.error] || 'Speech recognition stopped due to an error. Please try again.');
    };
    recognition.onend   = () => setRecording(false);

    recognition.start();
    setRecording(true);
    setMsg('');
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    setRecording(false);
    setLiveText('');
  }

  function clearTranscript() {
    stopRecording();
    setFinalText('');
    setLiveText('');
    setMsg('');
  }

  async function handleSave() {
    const text = (finalText + (liveText ? ' ' + liveText : '')).trim();
    if (!text) return setMsg('Nothing to save — record something first.');
    setSaving(true);
    setMsg('');
    try {
      stopRecording();
      await apiClient.post(`/speech/visit/${visitId}`, { transcript_text: text });
      setMsg('✓ Transcript saved!');
      setFinalText('');
      setLiveText('');
      fetchLogs();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteLog(logId) {
    if (!window.confirm('Delete this speech log entry? This cannot be undone.')) return;
    setDeletingLogId(logId);
    try {
      await deleteSpeechLog(visitId, logId);
      setLogs((prev) => prev.filter((l) => l.id !== logId));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete log entry.');
    } finally {
      setDeletingLogId(null);
    }
  }

  const displayText = finalText + (liveText ? (finalText ? ' ' : '') + liveText : '');

  // ── Patient fullscreen view ──────────────────────────────────────────────
  if (patientView) {
    return (
      <div style={pv.overlay} role="dialog" aria-label="Patient text display">
        <button style={pv.exitBtn} onClick={() => setPatientView(false)}>✕ Exit patient view</button>
        <div style={pv.textBox}>
          {displayText ? (
            <p style={pv.text}>{displayText}</p>
          ) : (
            <p style={pv.placeholder}>Waiting for caregiver to speak…</p>
          )}
        </div>
        {recording && <div style={pv.pulse} aria-live="polite">🔴 Recording</div>}
      </div>
    );
  }

  // ── Normal caregiver view ────────────────────────────────────────────────
  return (
    <div>
      {/* Live transcript display */}
      <div style={s.transcriptBox} aria-live="polite" aria-label="Live transcript">
        <div style={s.transcriptHeader}>
          <span style={s.transcriptTitle}>Live Transcript</span>
          {recording && <span style={s.recBadge} role="status">🔴 Recording…</span>}
          <button
            style={s.patientViewBtn}
            onClick={() => setPatientView(true)}
            title="Show large text for patient to read"
          >
            👁️ Patient View
          </button>
        </div>
        {displayText ? (
          <p style={s.transcriptText}>{displayText}</p>
        ) : (
          <p style={s.transcriptPlaceholder}>
            {SpeechSupported
              ? 'Press Start Recording, then speak. Text appears here for the patient to read.'
              : '⚠️ Web Speech API not supported in this browser. Please use Chrome or Edge.'}
          </p>
        )}
      </div>

      {/* Controls */}
      {isOpen && (
        <div style={s.controls}>
          {!recording ? (
            <button style={s.startBtn} onClick={startRecording} disabled={!SpeechSupported}>
              🎤 Start Recording
            </button>
          ) : (
            <button style={s.stopBtn} onClick={stopRecording}>
              ⏹ Stop
            </button>
          )}
          <button style={s.saveBtn} onClick={handleSave} disabled={saving || !displayText}>
            {saving ? 'Saving…' : '💾 Save Transcript'}
          </button>
          <button style={s.clearBtn} onClick={clearTranscript} disabled={!displayText}>
            Clear
          </button>
          {msg && (
            <span style={{ color: msg.startsWith('✓') ? '#2e7d32' : '#c62828', fontSize: '0.9rem', fontWeight: '700' }}>
              {msg}
            </span>
          )}
        </div>
      )}

      {/* Saved logs */}
      <h3 style={s.logsTitle}>Saved Speech Logs</h3>
      {logs.length === 0 ? (
        <div style={s.emptyBox}>
          <p style={s.emptyText}>No speech logs yet.</p>
        </div>
      ) : (
        <div style={s.logsList}>
          {logs.map((log) => (
            <div key={log.id} style={s.logItem}>
              <div style={s.logHeader}>
                <div style={s.logMeta}>
                  🎤 <span style={s.logTime}>{new Date(log.created_at).toLocaleTimeString()}</span>
                </div>
                {isOpen && (
                  <button
                    style={s.logDeleteBtn}
                    disabled={deletingLogId === log.id}
                    onClick={() => handleDeleteLog(log.id)}
                    title="Delete this log entry"
                    aria-label="Delete speech log"
                  >
                    {deletingLogId === log.id ? '⏳' : '🗑'}
                  </button>
                )}
              </div>
              <p style={s.logText}>"{log.transcript_text}"</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const s = {
  transcriptBox: {
    background: '#0f1c2e', borderRadius: '16px', padding: '22px 26px',
    marginBottom: '22px', minHeight: '140px',
  },
  transcriptHeader: {
    display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px',
  },
  transcriptTitle: {
    color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: '0.08em', flex: 1,
  },
  recBadge: { color: '#ef5350', fontSize: '0.85rem', fontWeight: '700' },
  patientViewBtn: {
    background: 'rgba(255,255,255,0.1)', color: '#fff',
    border: '1.5px solid rgba(255,255,255,0.25)',
    borderRadius: '8px', padding: '6px 14px', fontSize: '0.82rem', cursor: 'pointer', fontWeight: '600',
  },
  transcriptText: {
    color: '#fff', fontSize: '1.5rem', fontWeight: '700', lineHeight: 1.4, margin: 0,
  },
  transcriptPlaceholder: {
    color: 'rgba(255,255,255,0.3)', fontSize: '1rem', fontStyle: 'italic', margin: 0,
  },

  controls: {
    display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '28px',
  },
  startBtn: {
    padding: '12px 26px', background: '#c62828', color: '#fff', border: 'none',
    borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem',
  },
  stopBtn: {
    padding: '12px 26px', background: '#e65100', color: '#fff', border: 'none',
    borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem',
  },
  saveBtn: {
    padding: '12px 26px', background: '#2e7d32', color: '#fff', border: 'none',
    borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem',
  },
  clearBtn: {
    padding: '12px 20px', background: '#f5f7fa', border: '1.5px solid #dde3ea',
    borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', color: '#4f6070',
  },

  logsTitle: { fontSize: '1rem', fontWeight: '700', color: '#0f1c2e', marginBottom: '14px' },
  emptyBox: {
    background: '#fff', borderRadius: '12px', padding: '36px',
    textAlign: 'center', border: '2px dashed #dde3ea',
  },
  emptyText: { color: '#b0bec5' },

  logsList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  logItem: {
    background: '#fff', borderRadius: '12px', padding: '14px 18px',
    borderLeft: '4px solid #1565c0', boxShadow: '0 1px 5px rgba(15,28,46,0.05)',
  },
  logHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '7px',
  },
  logMeta: {},
  logTime:  { color: '#7a8fa0', fontSize: '0.8rem', fontWeight: '600' },
  logText: {
    color: '#0f1c2e', fontSize: '0.95rem', fontWeight: '500', margin: 0, lineHeight: 1.5, fontStyle: 'italic',
  },
  logDeleteBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: '0.95rem', color: '#b0bec5', padding: '2px 6px', borderRadius: '6px',
  },
};

// Patient fullscreen overlay
const pv = {
  overlay: {
    position: 'fixed', inset: 0, background: '#0f1c2e', zIndex: 9999,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '40px',
  },
  exitBtn: {
    position: 'absolute', top: '24px', right: '24px',
    background: 'rgba(255,255,255,0.1)', color: '#fff',
    border: '1.5px solid rgba(255,255,255,0.25)', borderRadius: '10px',
    padding: '10px 20px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '700',
  },
  textBox: { maxWidth: '900px', width: '100%', textAlign: 'center' },
  text: {
    color: '#ffffff',
    fontSize: 'clamp(2.2rem, 7vw, 5rem)',
    fontWeight: '800', lineHeight: 1.25, margin: 0,
    textShadow: '0 2px 20px rgba(0,0,0,0.4)',
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
  },
  placeholder: {
    color: 'rgba(255,255,255,0.3)', fontSize: 'clamp(1.4rem, 3vw, 2.2rem)',
    fontStyle: 'italic', margin: 0,
  },
  pulse: {
    position: 'absolute', bottom: '36px', color: '#ef5350',
    fontSize: '1.1rem', fontWeight: '800',
    background: 'rgba(239,83,80,0.12)', padding: '10px 24px', borderRadius: '999px',
  },
};
