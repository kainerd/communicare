/**
 * Demo seed script — run AFTER initDb.js
 * Usage: node config/seedDemo.js
 *
 * Creates:
 *  - 2 demo caregivers
 *  - 3 patients (one per caregiver, one shared)
 *  - 2 visits per patient with board data, speech logs, AI summaries
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function seed() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  console.log('Connected. Seeding demo data…\n');

  // ── helpers ───────────────────────────────────────────────────────────────
  async function insertIfMissing(table, checkCol, checkVal, insertSql, insertVals) {
    const [rows] = await db.query(`SELECT id FROM ${table} WHERE ${checkCol} = ?`, [checkVal]);
    if (rows.length) {
      console.log(`  ↳ ${table} "${checkVal}" already exists — skipped`);
      return rows[0].id;
    }
    const [r] = await db.query(insertSql, insertVals);
    console.log(`  ✓ ${table} "${checkVal}" created (id=${r.insertId})`);
    return r.insertId;
  }

  // ── Caregivers ────────────────────────────────────────────────────────────
  console.log('── Caregivers');
  const hash = await bcrypt.hash('Demo1234', 12);
  const cg1 = await insertIfMissing('users', 'email', 'caregiver1@demo.com',
    "INSERT INTO users (name,email,password_hash,role,status) VALUES (?,?,?,'caregiver','active')",
    ['Sarah Mitchell', 'caregiver1@demo.com', hash]);
  const cg2 = await insertIfMissing('users', 'email', 'caregiver2@demo.com',
    "INSERT INTO users (name,email,password_hash,role,status) VALUES (?,?,?,'caregiver','active')",
    ['David Okafor', 'caregiver2@demo.com', hash]);

  // ── Patients ──────────────────────────────────────────────────────────────
  console.log('\n── Patients');
  const [existP] = await db.query('SELECT id,full_name FROM patients WHERE caregiver_id IN (?,?)', [cg1, cg2]);
  const existNames = existP.map((p) => p.full_name);

  async function maybePatient(fullName, age, gender, cgId, notes) {
    if (existNames.includes(fullName)) {
      const p = existP.find((x) => x.full_name === fullName);
      console.log(`  ↳ patient "${fullName}" already exists — skipped`);
      return p.id;
    }
    const [r] = await db.query(
      'INSERT INTO patients (full_name,age,gender,caregiver_id,medical_notes) VALUES (?,?,?,?,?)',
      [fullName, age, gender, cgId, notes],
    );
    console.log(`  ✓ patient "${fullName}" created (id=${r.insertId})`);
    return r.insertId;
  }

  const p1 = await maybePatient('John Smith', 67, 'male', cg1,
    'Post-stroke aphasia. Hypertension, Type 2 Diabetes. Allergic to sulfa drugs.');
  const p2 = await maybePatient('Priya Patel', 49, 'female', cg1,
    'ALS (early stage). No known drug allergies. Cognitively intact.');
  const p3 = await maybePatient('Carlos Rivera', 73, 'male', cg2,
    'Parkinson\'s disease with speech impairment. Levodopa therapy. Cardiac history.');

  // ── Visits ────────────────────────────────────────────────────────────────
  console.log('\n── Visits, board data, speech logs, AI summaries');

  const VISITS = [
    {
      patientId: p1, cgId: cg1, status: 'closed',
      board: [
        { category: 'body_part', label: 'Chest' },
        { category: 'body_part', label: 'Arm' },
        { category: 'symptom',   label: 'Nausea' },
        { category: 'emotion',   label: 'Anxious' },
        { category: 'need',      label: 'Medicine' },
        { category: 'free_text', label: 'Pain comes and goes since morning' },
      ],
      speech: 'John, I need you to show me where the pain is. Is it worse when you breathe in?',
      summary: 'Mr. John Smith, a 67-year-old male with a history of post-stroke aphasia, hypertension, and Type 2 diabetes, presented with complaints of chest and arm discomfort accompanied by nausea and anxiety, with the patient indicating via communication board that the pain has been intermittent since morning. The patient expressed a need for medication and appeared distressed. Given his cardiac risk profile and the nature of the symptoms, urgent evaluation for cardiac aetiology is recommended, including ECG and troponin levels, with immediate physician notification.',
    },
    {
      patientId: p1, cgId: cg1, status: 'open',
      board: [
        { category: 'emotion',   label: 'Tired' },
        { category: 'need',      label: 'Rest' },
        { category: 'symptom',   label: 'Headache' },
        { category: 'body_part', label: 'Head' },
      ],
      speech: 'Good morning John. How did you sleep last night? Can you show me how bad the headache is on the board?',
      summary: 'Mr. Smith reported fatigue and a desire to rest, with communication board selections indicating a headache localised to the head. Caregiver reported the patient had a poor night\'s sleep. Vital signs should be assessed given his hypertensive history; analgesic therapy using sulfa-free agents is appropriate if blood pressure is within acceptable range.',
    },
    {
      patientId: p2, cgId: cg1, status: 'closed',
      board: [
        { category: 'body_part', label: 'Hand' },
        { category: 'body_part', label: 'Arm' },
        { category: 'symptom',   label: 'Numbness' },
        { category: 'emotion',   label: 'Scared' },
        { category: 'need',      label: 'Doctor' },
        { category: 'free_text', label: 'Fingers feel weak today more than usual' },
      ],
      speech: 'Priya, I can see you\'re scared. The doctor will be here in 30 minutes. Can you tell me which hand feels worse?',
      summary: 'Ms. Priya Patel, a 49-year-old female with early-stage ALS, reported increased weakness and numbness in both hands and arms beyond her baseline, expressing fear and requesting physician review. Free-text input noted that finger weakness was more pronounced than usual today. Urgent neurological assessment is warranted to evaluate for disease progression; documentation of symptom change should be forwarded to her specialist.',
    },
    {
      patientId: p3, cgId: cg2, status: 'closed',
      board: [
        { category: 'body_part', label: 'Leg' },
        { category: 'body_part', label: 'Foot' },
        { category: 'symptom',   label: 'Difficulty Breathing' },
        { category: 'emotion',   label: 'Calm' },
        { category: 'need',      label: 'Water' },
        { category: 'need',      label: 'Blanket' },
      ],
      speech: 'Carlos, buenos días. I can see you want water and a blanket. Are you feeling cold? Let me check your temperature.',
      summary: 'Mr. Carlos Rivera, a 73-year-old male with Parkinson\'s disease and a cardiac history, indicated leg and foot discomfort alongside mild breathing difficulty during today\'s visit, while reporting a calm emotional state. The patient expressed needs for water and a blanket, suggesting possible chills. Temperature and oxygen saturation should be assessed; breathing difficulty in the context of his cardiac history warrants monitoring and may require physician review if it persists.',
    },
    {
      patientId: p3, cgId: cg2, status: 'open',
      board: [
        { category: 'emotion', label: 'Better' },
        { category: 'need',    label: 'Food' },
        { category: 'need',    label: 'Water' },
        { category: 'symptom', label: 'Dizzy' },
      ],
      speech: 'Great to see you doing better today Carlos! Are you dizzy when you stand up or all the time?',
      summary: 'Mr. Rivera presented in an improved emotional state compared to the previous visit, indicating he is feeling better overall. He expressed needs for food and water, and reported dizziness via the communication board. Orthostatic hypotension should be considered given his Levodopa therapy; blood pressure measurements in supine and standing positions are recommended, and dietary intake should be confirmed.',
    },
  ];

  for (const v of VISITS) {
    // Check if visit already seeded (same patient, same board label set)
    const [existV] = await db.query(
      'SELECT v.id FROM visits v WHERE v.patient_id=? AND v.caregiver_id=? AND v.status=? LIMIT 1',
      [v.patientId, v.cgId, v.status],
    );

    let visitId;
    if (existV.length) {
      visitId = existV[0].id;
      console.log(`  ↳ visit (patient=${v.patientId}, status=${v.status}) already exists — skipped`);
    } else {
      const [vr] = await db.query(
        "INSERT INTO visits (patient_id,caregiver_id,status) VALUES (?,?,?)",
        [v.patientId, v.cgId, v.status],
      );
      visitId = vr.insertId;
      console.log(`  ✓ visit id=${visitId} created`);

      // Board selections
      await db.query(
        'INSERT INTO board_selections (visit_id,category,label) VALUES ?',
        [v.board.map((b) => [visitId, b.category, b.label])],
      );
      console.log(`    + ${v.board.length} board selections`);

      // Speech log
      await db.query(
        'INSERT INTO caregiver_speech_logs (visit_id,transcript_text) VALUES (?,?)',
        [visitId, v.speech],
      );
      console.log(`    + 1 speech log`);

      // AI summary
      await db.query(
        'INSERT INTO ai_summaries (visit_id,summary_text) VALUES (?,?)',
        [visitId, v.summary],
      );
      console.log(`    + 1 AI summary`);
    }
  }

  await db.end();

  console.log('\n✓ Demo seed complete.\n');
  console.log('Demo credentials:');
  console.log('  Admin       wadenerd6@gmail.com  / Admin123');
  console.log('  Caregiver 1 caregiver1@demo.com  / Demo1234  (patients: John Smith, Priya Patel)');
  console.log('  Caregiver 2 caregiver2@demo.com  / Demo1234  (patient: Carlos Rivera)');
}

seed().catch((e) => { console.error(e.message); process.exit(1); });
