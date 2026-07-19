const Anthropic = require('@anthropic-ai/sdk');
const { pool } = require('../config/db');
const { findById: findVisit } = require('../models/visitModel');
const { findById: findPatient } = require('../models/patientModel');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function getSummary(req, res, next) {
  try {
    const { visitId } = req.params;

    // Ownership check (read access): the owning caregiver, or an admin
    // (read-only access per spec — same convention as getPatient/getVisit).
    // This was previously missing entirely, letting any authenticated
    // caregiver read any other caregiver's patient's clinical AI summary.
    const visit = await findVisit(visitId);
    if (!visit) return res.status(404).json({ error: 'Visit not found' });
    if (visit.caregiver_id !== req.dbUser.id && req.dbUser.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM ai_summaries WHERE visit_id = ? ORDER BY generated_at DESC LIMIT 1',
      [visitId],
    );
    res.json({ summary: rows[0] || null });
  } catch (err) { next(err); }
}

async function generateSummary(req, res, next) {
  try {
    const { visitId } = req.params;

    const visit = await findVisit(visitId);
    if (!visit) return res.status(404).json({ error: 'Visit not found' });

    // Ownership check (write access): only the owning caregiver — matches
    // the convention used everywhere else a visit is mutated (saveSelections,
    // saveLog, closeVisit, clearVisitData). This was previously missing,
    // letting any authenticated caregiver (or admin) trigger AI summary
    // generation — and consume the Anthropic API quota — against a visit
    // that isn't theirs.
    if (visit.caregiver_id !== req.dbUser.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Closed visits are immutable everywhere else in the app (board/speech
    // writes are blocked once a visit is closed) — summary generation should
    // follow the same rule instead of allowing a "final" visit record to keep
    // changing after it's been completed & saved.
    if (visit.status === 'closed') {
      return res.status(400).json({ error: 'Visit is closed — cannot generate a new summary.' });
    }

    const patient = await findPatient(visit.patient_id);

    // Pull all visit data
    const [boardRows] = await pool.query(
      'SELECT category, label FROM board_selections WHERE visit_id = ? ORDER BY created_at ASC',
      [visitId],
    );
    const [speechRows] = await pool.query(
      'SELECT transcript_text FROM caregiver_speech_logs WHERE visit_id = ? ORDER BY created_at ASC',
      [visitId],
    );

    if (boardRows.length === 0 && speechRows.length === 0) {
      return res.status(400).json({ error: 'No visit data to summarise. Add board selections or speech logs first.' });
    }

    // Format inputs for prompt
    const patientInfo = [
      `Name: ${patient.full_name}`,
      patient.age ? `Age: ${patient.age}` : null,
      patient.gender ? `Gender: ${patient.gender}` : null,
      patient.medical_notes ? `Medical background: ${patient.medical_notes}` : null,
    ].filter(Boolean).join('\n');

    const boardByCategory = {};
    for (const row of boardRows) {
      if (!boardByCategory[row.category]) boardByCategory[row.category] = [];
      boardByCategory[row.category].push(row.label);
    }

    const boardSummaryLines = Object.entries(boardByCategory).map(([cat, labels]) => {
      const catName = cat === 'body_part' ? 'Body parts indicated'
        : cat === 'need' ? 'Needs expressed'
        : cat === 'emotion' ? 'Emotions communicated'
        : cat === 'symptom' ? 'Symptoms indicated'
        : 'Free-text input';
      return `${catName}: ${labels.join(', ')}`;
    });

    const speechLines = speechRows.map((r, i) => `Caregiver statement ${i + 1}: "${r.transcript_text}"`);

    const prompt = `You are a clinical documentation assistant. Your task is to produce a clear, concise, clinical-style visit summary based on structured communication data collected from a patient with a speech impairment.

PATIENT INFORMATION:
${patientInfo}

VISIT DATE: ${new Date(visit.visit_date).toLocaleString()}

COMMUNICATION BOARD SELECTIONS (patient indicated these by tapping):
${boardSummaryLines.length > 0 ? boardSummaryLines.join('\n') : 'None recorded'}

CAREGIVER SPEECH TRANSCRIPTS (caregiver spoke, patient read on screen):
${speechLines.length > 0 ? speechLines.join('\n') : 'None recorded'}

INSTRUCTIONS:
- Write a clinical-style paragraph summarising this visit, as it would appear in a patient's medical record.
- Infer clinically meaningful patterns from the data (e.g. if the patient indicated "Head", "Headache", and "Pain", conclude that the patient is experiencing head pain/headache).
- Include: chief complaint, observed symptoms, patient-expressed needs, emotional state, and any relevant caregiver observations from the speech transcripts.
- Do NOT simply list or repeat the raw inputs — synthesise them into coherent clinical language.
- Keep the summary to 2–4 sentences, factual, and written in third person (e.g. "The patient indicated…").
- End with a brief note on recommended follow-up if clinically appropriate based on the data.`;

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    const summaryText = message.content[0].text.trim();

    // Store in ai_summaries
    const [result] = await pool.query(
      'INSERT INTO ai_summaries (visit_id, summary_text) VALUES (?, ?)',
      [visitId, summaryText],
    );

    const [saved] = await pool.query('SELECT * FROM ai_summaries WHERE id = ?', [result.insertId]);
    res.status(201).json({ summary: saved[0] });
  } catch (err) { next(err); }
}

module.exports = { getSummary, generateSummary };
