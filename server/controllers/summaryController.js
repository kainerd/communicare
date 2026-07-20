const Anthropic = require('@anthropic-ai/sdk');
const { pool } = require('../config/db');
const { findById: findVisit } = require('../models/visitModel');
const { findById: findPatient } = require('../models/patientModel');

// Prefer a capacity-friendly default. Opus was observed returning HTTP 529
// overloaded_error under normal local testing; Sonnet is the same API surface
// with higher availability. Override with ANTHROPIC_MODEL if needed.
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5';
const MAX_ANTHROPIC_ATTEMPTS = 3;

// Warn loudly at startup if the key is missing so it shows up in Railway logs
// immediately rather than only when a caregiver first tries to generate a summary.
if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your-anthropic-api-key-here') {
  console.warn('[summaryController] WARNING: ANTHROPIC_API_KEY is not set or still uses the placeholder value. AI summary generation will fail with a 503 until this is configured.');
} else {
  console.log(`[summaryController] Anthropic client ready (model=${ANTHROPIC_MODEL}).`);
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableAnthropicError(apiErr) {
  const status = apiErr?.status;
  const type = apiErr?.error?.type || apiErr?.error?.error?.type;
  return status === 529 || status === 429 || type === 'overloaded_error' || type === 'rate_limit_error';
}

function mapAnthropicError(apiErr) {
  const status = apiErr?.status;
  const type = apiErr?.error?.type || apiErr?.error?.error?.type;

  if (status === 401) {
    return {
      httpStatus: 503,
      message: 'AI service authentication failed. Check that ANTHROPIC_API_KEY is correct in your environment.',
    };
  }
  if (status === 529 || type === 'overloaded_error') {
    return {
      httpStatus: 503,
      message: 'AI service is temporarily overloaded. Please wait a few seconds and try again.',
    };
  }
  if (status === 429 || type === 'rate_limit_error') {
    return {
      httpStatus: 503,
      message: 'AI service rate limit reached. Please wait a moment and try again.',
    };
  }
  return {
    httpStatus: 502,
    message: `AI service error: ${apiErr?.message || 'Unknown error from Anthropic.'}`,
  };
}

/**
 * Call Anthropic with a short retry/backoff for transient overload (529) and
 * rate-limit (429) responses. Those were the live failure mode for Clinical
 * Summary generation — not null DB rows or PDF generation.
 */
async function createSummaryMessage(prompt, visitId) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_ANTHROPIC_ATTEMPTS; attempt += 1) {
    try {
      console.log(`[summaryController] Anthropic request attempt ${attempt}/${MAX_ANTHROPIC_ATTEMPTS}`, {
        visitId,
        model: ANTHROPIC_MODEL,
      });
      return await anthropic.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      });
    } catch (apiErr) {
      lastErr = apiErr;
      console.error('[summaryController] Anthropic API error:', {
        visitId,
        attempt,
        status: apiErr.status ?? null,
        type: apiErr.error?.type || apiErr.error?.error?.type || null,
        message: apiErr.message,
        stack: apiErr.stack,
      });
      if (attempt < MAX_ANTHROPIC_ATTEMPTS && isRetryableAnthropicError(apiErr)) {
        const delayMs = 800 * attempt;
        console.warn(`[summaryController] Retrying Anthropic call in ${delayMs}ms (visitId=${visitId})`);
        await sleep(delayMs);
        continue;
      }
      throw apiErr;
    }
  }
  throw lastErr;
}

async function getSummary(req, res, next) {
  try {
    const { visitId } = req.params;
    console.log('[summaryController] getSummary start', { visitId, userId: req.dbUser?.id });

    // Ownership check (read access): the owning caregiver, or an admin
    // (read-only access per spec — same convention as getPatient/getVisit).
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
  } catch (err) {
    console.error('[summaryController] getSummary failed:', {
      visitId: req.params.visitId,
      message: err.message,
      stack: err.stack,
    });
    next(err);
  }
}

async function generateSummary(req, res, next) {
  const { visitId } = req.params;
  try {
    console.log('[summaryController] generateSummary start', {
      visitId,
      userId: req.dbUser?.id,
      role: req.dbUser?.role,
    });

    const visit = await findVisit(visitId);
    if (!visit) return res.status(404).json({ error: 'Visit not found' });

    // Ownership check (write access): only the owning caregiver — matches
    // the convention used everywhere else a visit is mutated.
    if (visit.caregiver_id !== req.dbUser.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Closed visits are immutable everywhere else in the app.
    if (visit.status === 'closed') {
      return res.status(400).json({ error: 'Visit is closed — cannot generate a new summary.' });
    }

    const patient = await findPatient(visit.patient_id);
    if (!patient) {
      console.error('[summaryController] Patient missing for visit', {
        visitId,
        patientId: visit.patient_id,
      });
      return res.status(404).json({ error: 'Patient record not found for this visit.' });
    }

    // Pull all visit data
    const [boardRows] = await pool.query(
      'SELECT category, label FROM board_selections WHERE visit_id = ? ORDER BY created_at ASC',
      [visitId],
    );
    const [speechRows] = await pool.query(
      'SELECT transcript_text FROM caregiver_speech_logs WHERE visit_id = ? ORDER BY created_at ASC',
      [visitId],
    );

    console.log('[summaryController] Visit inputs loaded', {
      visitId,
      patientId: patient.id,
      boardCount: boardRows.length,
      speechCount: speechRows.length,
    });

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

    // Guard: API key must be configured before making the call.
    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your-anthropic-api-key-here') {
      return res.status(503).json({ error: 'AI summary service is not configured. Ask your administrator to set the ANTHROPIC_API_KEY environment variable.' });
    }

    let message;
    try {
      message = await createSummaryMessage(prompt, visitId);
    } catch (apiErr) {
      const mapped = mapAnthropicError(apiErr);
      return res.status(mapped.httpStatus).json({ error: mapped.message });
    }

    // Validate the response shape before accessing content[0].text
    const textBlock = message.content?.find((b) => b.type === 'text');
    if (!textBlock || typeof textBlock.text !== 'string') {
      console.error('[summaryController] Unexpected Anthropic response shape:', {
        visitId,
        content: message.content,
      });
      return res.status(502).json({ error: 'AI service returned an unexpected response. Please try again.' });
    }

    const summaryText = textBlock.text.trim();
    console.log('[summaryController] Anthropic summary received', {
      visitId,
      chars: summaryText.length,
    });

    // Store in ai_summaries
    const [result] = await pool.query(
      'INSERT INTO ai_summaries (visit_id, summary_text) VALUES (?, ?)',
      [visitId, summaryText],
    );

    const [saved] = await pool.query('SELECT * FROM ai_summaries WHERE id = ?', [result.insertId]);
    if (!saved[0]) {
      console.error('[summaryController] Insert succeeded but SELECT returned no row', {
        visitId,
        insertId: result.insertId,
      });
      return res.status(500).json({ error: 'Summary was generated but could not be reloaded from the database.' });
    }

    console.log('[summaryController] generateSummary success', {
      visitId,
      summaryId: saved[0].id,
    });
    res.status(201).json({ summary: saved[0] });
  } catch (err) {
    // Any unexpected DB / runtime failure lands here. Log the full object so
    // the next Internal Server Error is diagnosable from server logs.
    console.error('[summaryController] generateSummary failed (uncaught):', {
      visitId,
      message: err.message,
      code: err.code,
      sqlMessage: err.sqlMessage,
      stack: err.stack,
    });
    next(err);
  }
}

module.exports = { getSummary, generateSummary };
