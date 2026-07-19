/**
 * Quick end-to-end test: AI summary isolation between visits.
 *
 * Verifies (per the audit request):
 *   1. Visit 1 is completed and its summary is generated + saved.
 *   2. Visit 2 is started for the SAME patient with DIFFERENT symptoms.
 *   3. Visit 2's summary is generated.
 *   4. Both summaries exist as separate, independent rows in history
 *      (no overwrite, no shared slot).
 *   5. Visit 2's summary text reflects ONLY visit 2's data — it must not
 *      mention the exclusive term used only in visit 1 (and vice versa).
 *
 * This hits the REAL running API + REAL Claude API (costs a couple of
 * cents in Anthropic usage — two summary generations). It does not
 * modify any existing patient/visit; it creates a fresh throwaway
 * patient named "Summary Isolation Test <timestamp>" each run.
 *
 * Usage:
 *   1. Start the backend:  npm run dev   (in /server)
 *   2. In another terminal, from /server:
 *        node tests/summaryIsolation.test.js
 *
 * Requires a caregiver login. Defaults to the demo seed account
 * (caregiver1@demo.com / Demo1234 — see config/seedDemo.js). Override
 * with TEST_EMAIL / TEST_PASSWORD env vars if needed.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
const EMAIL    = process.env.TEST_EMAIL    || 'caregiver1@demo.com';
const PASSWORD = process.env.TEST_PASSWORD || 'Demo1234';

let pass = 0;
let fail = 0;

function check(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✓ ${label}`);
    pass++;
  } else {
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`);
    fail++;
  }
}

async function api(method, path, token, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${data.error || 'unknown error'}`);
  return data;
}

async function main() {
  console.log(`\nRunning summary isolation test against ${BASE_URL}\n`);

  // ── 0. Login ──────────────────────────────────────────────────────────────
  console.log('── Logging in as', EMAIL);
  const { token } = await api('POST', '/auth/login', null, { email: EMAIL, password: PASSWORD });
  check('Received auth token', !!token);

  // ── 1. Create a throwaway patient ────────────────────────────────────────
  const patientName = `Summary Isolation Test ${Date.now()}`;
  console.log(`\n── Creating test patient "${patientName}"`);
  const { patient } = await api('POST', '/patients', token, { full_name: patientName, age: 40 });
  check('Patient created', !!patient?.id);

  // ── 2. VISIT 1 — headache/pain symptoms ──────────────────────────────────
  console.log('\n── VISIT 1: recording headache symptoms');
  const { visit: visit1 } = await api('POST', '/visits', token, {
    patient_id: patient.id,
    visit_date: new Date().toISOString(),
  });
  check('Visit 1 created', !!visit1?.id);

  await api('POST', `/board/visit/${visit1.id}`, token, {
    selections: [
      { category: 'body_part', label: 'Head' },
      { category: 'symptom',   label: 'Headache' },
      { category: 'emotion',   label: 'Pain' },
    ],
  });
  await api('POST', `/speech/visit/${visit1.id}`, token, {
    transcript_text: 'Patient has had a severe throbbing headache since this morning, exclusive-marker-ALPHA.',
  });

  console.log('  Generating AI summary for Visit 1 (calls Claude)…');
  const { summary: summary1 } = await api('POST', `/summary/visit/${visit1.id}`, token);
  check('Visit 1 summary generated', !!summary1?.id);
  check('Visit 1 summary is tied to visit 1', summary1.visit_id === visit1.id);

  await api('PATCH', `/visits/${visit1.id}/close`, token);

  // ── 3. VISIT 2 — completely different symptoms (nausea) ─────────────────
  console.log('\n── VISIT 2: recording nausea symptoms (different visit, same patient)');
  const { visit: visit2 } = await api('POST', '/visits', token, {
    patient_id: patient.id,
    visit_date: new Date().toISOString(),
  });
  check('Visit 2 created', !!visit2?.id);
  check('Visit 2 has a different ID from Visit 1 (no slot reuse)', visit2.id !== visit1.id);

  await api('POST', `/board/visit/${visit2.id}`, token, {
    selections: [
      { category: 'body_part', label: 'Stomach' },
      { category: 'symptom',   label: 'Nausea' },
      { category: 'need',      label: 'Water' },
    ],
  });
  await api('POST', `/speech/visit/${visit2.id}`, token, {
    transcript_text: 'Patient reports nausea and dizziness after breakfast, exclusive-marker-BETA.',
  });

  console.log('  Generating AI summary for Visit 2 (calls Claude)…');
  const { summary: summary2 } = await api('POST', `/summary/visit/${visit2.id}`, token);
  check('Visit 2 summary generated', !!summary2?.id);
  check('Visit 2 summary is tied to visit 2, not visit 1', summary2.visit_id === visit2.id);
  check('Visit 2 summary is a distinct row from Visit 1\'s', summary2.id !== summary1.id);

  // ── 4. Cross-contamination check ─────────────────────────────────────────
  console.log('\n── Verifying no leakage between the two summaries');
  const s1 = summary1.summary_text.toLowerCase();
  const s2 = summary2.summary_text.toLowerCase();
  check(
    "Visit 2's summary does NOT mention Visit 1's exclusive symptom (headache)",
    !s2.includes('headache'),
    `summary2 text: "${summary2.summary_text}"`,
  );
  check(
    "Visit 1's summary does NOT mention Visit 2's exclusive symptom (nausea)",
    !s1.includes('nausea'),
    `summary1 text: "${summary1.summary_text}"`,
  );
  check("Visit 2's summary DOES reflect its own data (mentions nausea/stomach-related content)", s2.includes('nausea'));
  check("Visit 1's summary DOES reflect its own data (mentions headache-related content)", s1.includes('headache'));

  // ── 5. History view shows both, independently, in order ──────────────────
  console.log('\n── Verifying visit history log');
  const { visits: history } = await api('GET', `/visits/patient/${patient.id}`, token);
  const h1 = history.find((v) => v.id === visit1.id);
  const h2 = history.find((v) => v.id === visit2.id);

  check('History contains both visits', !!h1 && !!h2);
  check('History shows a summary flag for Visit 1', Number(h1?.has_summary) === 1);
  check('History shows a summary flag for Visit 2', Number(h2?.has_summary) === 1);
  check(
    "History's Visit 1 preview does not contain Visit 2's marker",
    !(h1?.summary_preview || '').toLowerCase().includes('nausea'),
  );
  check(
    "History's Visit 2 preview does not contain Visit 1's marker",
    !(h2?.summary_preview || '').toLowerCase().includes('headache'),
  );
  check(
    'History is ordered most-recent-first (Visit 2 before Visit 1)',
    history.findIndex((v) => v.id === visit2.id) < history.findIndex((v) => v.id === visit1.id),
  );

  // ── 6. Cleanup ────────────────────────────────────────────────────────────
  console.log('\n── Cleaning up test patient');
  await api('DELETE', `/patients/${patient.id}`, token);
  console.log('  ✓ Test patient and all its data removed');

  // ── Result ────────────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`RESULT: ${pass} passed, ${fail} failed`);
  console.log('─'.repeat(50));
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('\n❌ Test crashed:', err.message);
  process.exit(1);
});
