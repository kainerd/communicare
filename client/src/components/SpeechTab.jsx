import { useState, useEffect, useRef } from 'react';
import apiClient from '../api/client';

const SpeechSupported = typeof window !== 'undefined' &&
  ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

export default function SpeechTab({ visitId, isOpen }) {
  const [recording, setRecording] = useState(false);
  const [liveText, setLiveText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [logs, setLogs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [patientView, setPatientView] = useState(false);

  const recognitionRef = useRef(null);

  useEffect(() => {
    fetchLogs();
  }, [visitId]);

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

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interim = '';
      let final = finalText;
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
    };

    recognition.onend = () => setRecording(false);

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

  const displayText = finalText + (liveText ? (finalText ? ' ' : '') + liveText : '');

  // ─── Patient view (fullscreen large text) ────────────────────────────────
  if (patientView) {
    return (
      <div style={pv.overlay}>
        <button style={pv.exitBtn} onClick={() => setPatientView(false)}>✕ Exit patient view</button>
        <div style={pv.textBox}>
          {displayText ? (
            <p style={pv.text}>{displayText}</p>
          ) : (
            <p style={pv.placeholder}>Waiting for caregiver to speak…</p>
          )}
        </div>
        {recording && <div style={pv.pulse}>🔴 Recording</div>}
      </div>
    );
  }

  // ─── Normal caregiver view ────────────────────────────────────────────────
  return (
    <div>
      {/* Live transcript box */}
      <div style={s.transcriptBox}>
        <div style={s.transcriptHeader}>
          <span style={s.transcriptTitle}>Live Transcript</span>
          {recording && <span style={s.recBadge}>🔴 Recording…</span>}
          <button style={s.patientViewBtn} onClick={() => setPatientView(true)} title="Show large text for patient to read">
            👁️ Patient View
          </button>
        </div>
        {displayText ? (
          <p style={s.transcriptText}>{displayText}</p>
        ) : (
          <p style={s.transcriptPlaceholder}>
            {SpeechSupported
              ? "Press Start Recording, then speak. Text will appear here for the patient to read."
              : "⚠️ Web Speech API is not supported in this browser. Please use Chrome or Edge."}
          </p>
        )}
      </div>

      {/* Controls */}
      {isOpen && (
        <div style={s.controls}>
          {!recording ? (
            <button
              style={s.startBtn}
              onClick={startRecording}
              disabled={!SpeechSupported}
            >
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
            <span style={{ color: msg.startsWith('✓') ? '#16a34a' : '#dc2626', fontSize: '0.875rem', fontWeight: '600' }}>
              {msg}
            </span>
          )}
        </div>
      )}

      {/* Saved speech logs */}
      <h3 style={s.logsTitle}>Saved Speech Logs</h3>
      {logs.length === 0 ? (
        <div style={s.emptyBox}>
          <p style={{ color: '#94a3b8' }}>No speech logs yet.</p>
        </div>
      ) : (
        <div style={s.logsList}>
          {logs.map((log) => (
            <div key={log.id} style={s.logItem}>
              <div style={s.logMeta}>
                🎤 <span style={s.logTime}>{new Date(log.created_at).toLocaleTimeString()}</span>
              </div>
              <p style={s.logText}>"{log.transcript_text}"</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = {
  transcriptBox: {
    background: '#0f172a', borderRadius: '14px', padding: '24px 28px',
    marginBottom: '20px', minHeight: '140px',
  },
  transcriptHeader: {
    display: 'flex', alignItems: 'center', gap: '12px',
    marginBottom: '14px',
  },
  transcriptTitle: { color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em', flex: 1 },
  recBadge: { color: '#ef4444', fontSize: '0.82rem', fontWeight: '700', animation: 'pulse 1.5s infinite' },
  patientViewBtn: {
    background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '6px', padding: '5px 12px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '600',
  },
  transcriptText: {
    color: '#fff', fontSize: '1.5rem', fontWeight: '700',
    lineHeight: 1.5, margin: 0,
  },
  transcriptPlaceholder: {
    color: 'rgba(255,255,255,0.3)', fontSize: '1rem', fontStyle: 'italic', margin: 0,
  },

  controls: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '28px' },
  startBtn: {
    padding: '11px 24px', background: '#ef4444', color: '#fff', border: 'none',
    borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem',
  },
  stopBtn: {
    padding: '11px 24px', background: '#f59e0b', color: '#fff', border: 'none',
    borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem',
  },
  saveBtn: {
    padding: '11px 24px', background: '#22c55e', color: '#fff', border: 'none',
    borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem',
  },
  clearBtn: {
    padding: '11px 18px', background: '#f1f5f9', border: '1px solid #cbd5e1',
    borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem',
  },

  logsTitle: { fontSize: '1rem', fontWeight: '700', color: '#1e3a5f', marginBottom: '12px' },
  emptyBox: {
    background: '#fff', borderRadius: '10px', padding: '32px',
    textAlign: 'center', border: '2px dashed #e2e8f0',
  },
  logsList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  logItem: {
    background: '#fff', borderRadius: '10px', padding: '14px 18px',
    borderLeft: '4px solid #1e3a5f', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  logMeta: { marginBottom: '6px' },
  logTime: { color: '#64748b', fontSize: '0.78rem', fontWeight: '600' },
  logText: { color: '#1e293b', fontSize: '0.95rem', fontWeight: '500', margin: 0, lineHeight: 1.5, fontStyle: 'italic' },
};

// Patient fullscreen overlay styles
const pv = {
  overlay: {
    position: 'fixed', inset: 0, background: '#0f172a', zIndex: 9999,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '40px',
  },
  exitBtn: {
    position: 'absolute', top: '24px', right: '24px',
    background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600',
  },
  textBox: { maxWidth: '900px', width: '100%', textAlign: 'center' },
  text: {
    color: '#ffffff', fontSize: 'clamp(2rem, 6vw, 4.5rem)',
    fontWeight: '800', lineHeight: 1.3, margin: 0,
    textShadow: '0 2px 20px rgba(0,0,0,0.4)',
  },
  placeholder: {
    color: 'rgba(255,255,255,0.3)', fontSize: 'clamp(1.2rem, 3vw, 2rem)',
    fontStyle: 'italic', margin: 0,
  },
  pulse: {
    position: 'absolute', bottom: '32px',
    color: '#ef4444', fontSize: '1.1rem', fontWeight: '800',
    background: 'rgba(239,68,68,0.12)', padding: '8px 20px', borderRadius: '999px',
  },
};
