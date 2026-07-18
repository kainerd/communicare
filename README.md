<div align="center">

# CommuniCare

**An AI-powered communication assistant for patients with speech impairments**

Built for INES Ruhengeri — Final Year Project, BSc Software Engineering

</div>

---

## Overview

CommuniCare helps patients with speech impairments communicate with caregivers and medical staff during clinical visits. It combines a tap-based communication board, live speech-to-text captioning, and AI-generated clinical visit summaries into a single, accessible workflow — designed to be usable at the bedside by patients, caregivers, and clinicians alike.

**Core capabilities:**

- **Communication Board** — a 48-item, 4-category tap board (Body Parts, Needs, Emotions, Symptoms) that lets patients build messages without speaking
- **Speech-to-Text** — caregiver speech is transcribed live and displayed on-screen for the patient to read
- **AI Visit Summaries** — Claude generates a clinical-style summary from each visit's board selections and transcripts
- **PDF Export** — full patient visit history, including AI summaries, exportable as a report
- **Role-based access** — separate caregiver, admin, and patient-facing experiences, with an approval + email-verification workflow for new caregiver accounts

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router |
| Backend | Node.js, Express 5 |
| Database | MySQL 8 (via XAMPP) |
| Auth | JWT (8-hour sessions), bcrypt |
| Email | Nodemailer (Ethereal in dev, any SMTP in prod) |
| Speech-to-Text | Web Speech API (browser-native) |
| AI Summaries | Anthropic Claude |
| PDF Export | jsPDF, jspdf-autotable |

---

## Prerequisites

- [Node.js](https://nodejs.org) 18 or newer
- [XAMPP](https://www.apachefriends.org) or any MySQL 8 server
- Chrome or Edge (required for the Web Speech API)
- An Anthropic API key

---

## Getting Started

### 1. Project structure

```
/client      React frontend
/server      Node.js backend
```

### 2. Start MySQL

Open the XAMPP Control Panel and start **MySQL**.

### 3. Configure environment variables

```bash
cd server
cp .env.example .env
```

Edit `server/.env` with your own local values:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=communicare

JWT_SECRET=replace_with_a_long_random_string

PORT=5000
APP_URL=http://localhost:5173

# SMTP — leave blank in dev to use an auto-generated Ethereal test account
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=

ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

> `server/.env` is gitignored and must never be committed. Only `.env.example`, with placeholder values, belongs in version control.

### 4. Initialize the database

```bash
node config/initDb.js
```

Creates all tables and seeds the initial admin account. Run once.

### 5. Apply the approval migration

```bash
node config/migrateApproval.js
```

Adds `is_approved`, `is_verified`, and email-verification columns. Safe to re-run — existing users are automatically backfilled to approved and verified.

### 6. (Optional) Load demo data

```bash
node config/seedDemo.js
```

Seeds 2 demo caregivers, 3 patients, 5 visits with board data, speech logs, and pre-written AI summaries — useful for demos and testing.

### 7. Start the backend

```bash
npm run dev
```

Runs on `http://localhost:5000`. Health check: `GET /api/health`

### 8. Start the frontend

```bash
cd client
npm install   # first time only
npm run dev
```

Runs on `http://localhost:5173`

---

## Demo Access

Demo/seed accounts are created locally by `initDb.js` and `seedDemo.js` and are **not stored in this repository**. After running the seed scripts, check those files for the generated login details, or set your own.

| Role | Notes |
|---|---|
| Admin | Seeded via `initDb.js` |
| Caregiver 1 | Patients: John Smith, Priya Patel |
| Caregiver 2 | Patient: Carlos Rivera |

Demo credentials are for local development only and should never be reused in a deployed or public-facing instance.

---

## Caregiver Registration Flow

New caregivers go through a two-step approval process before they can log in:

```
Register → pending admin approval → admin approves → verification email sent
       → caregiver clicks link → email verified → can now log in
```

1. `POST /api/auth/register` — account created with `is_approved=false`, `is_verified=false`; no JWT issued yet
2. Admin views the pending list via `GET /api/admin/caregivers/pending`
3. `PATCH /api/admin/caregivers/:id/approve` — sets `is_approved=true`, generates a 24-hour token, and sends a verification email
4. Caregiver clicks the emailed link → `GET /api/auth/verify?token=xxx` → sets `is_verified=true`
5. Login now succeeds and returns a JWT

Admins can also reject a registration via `PATCH /api/admin/caregivers/:id/reject`, which sets `status='rejected'` and blocks login with a clear message.

**Email in development:** if no `SMTP_*` variables are set, Nodemailer automatically creates a free [Ethereal](https://ethereal.email) test account. After approving a caregiver, the server console prints a preview link — open it to view the rendered email and copy the verification link.

---

## Features by Role

### Caregiver
- Register (pending approval workflow) and log in (blocked until approved and verified)
- Update own profile — name, email, password (current password required for changes)
- Add and manage patients, with medical notes
- Start and manage visit sessions
- Use the communication board or free-text input during a visit
- Capture live speech-to-text, shown large-format for the patient to read
- Launch a fullscreen, high-contrast patient view
- Generate an AI clinical summary from visit data
- Export a patient's full visit history as a PDF report

### Admin
- View all caregiver accounts, approved and pending
- Approve or reject pending registrations
- Enable or disable active accounts
- Edit caregiver details or reset a caregiver's password
- View all patients and visits (read-only)

### Patient
- No login required — the communication board is operated on the caregiver's device during a visit

---

## API Reference

### Auth
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register a caregiver (pending approval, no JWT issued) |
| POST | `/api/auth/login` | Public | Log in — requires `is_approved` and `is_verified` |
| GET | `/api/auth/verify?token=` | Public | Verify email from the emailed link |
| GET | `/api/auth/me` | Caregiver, Admin | Get the current user's profile |

### Caregiver
| Method | Route | Access | Description |
|---|---|---|---|
| PUT | `/api/caregiver/me` | Caregiver | Update name, email, or password |

### Patients
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/patients` | Caregiver | List own patients |
| POST | `/api/patients` | Caregiver | Create a patient |
| GET | `/api/patients/:id` | Caregiver, Admin | Get a patient |
| PUT | `/api/patients/:id` | Caregiver | Update patient info or notes |
| GET | `/api/patients/:id/report` | Caregiver, Admin | Full report data for PDF export |

### Visits
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/visits` | Caregiver | Start a new visit |
| GET | `/api/visits/patient/:id` | Caregiver, Admin | List visits for a patient |
| GET | `/api/visits/:id` | Caregiver, Admin | Get a single visit |
| PATCH | `/api/visits/:id/close` | Caregiver | Close a visit |

### Communication Board
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/board/visit/:id` | Caregiver, Admin | Get board selections |
| POST | `/api/board/visit/:id` | Caregiver | Save selections |
| DELETE | `/api/board/visit/:id` | Caregiver | Clear selections |

### Speech
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/speech/visit/:id` | Caregiver, Admin | Get speech logs |
| POST | `/api/speech/visit/:id` | Caregiver | Save a transcript |

### AI Summary
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/summary/visit/:id` | Caregiver, Admin | Get a saved summary |
| POST | `/api/summary/visit/:id` | Caregiver | Generate and save a summary via Claude |

### Admin
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/admin/caregivers` | Admin | List all caregivers |
| GET | `/api/admin/caregivers/pending` | Admin | List caregivers awaiting approval |
| PATCH | `/api/admin/caregivers/:id/approve` | Admin | Approve and send verification email |
| PATCH | `/api/admin/caregivers/:id/reject` | Admin | Reject a registration |
| PUT | `/api/admin/caregivers/:id` | Admin | Edit details or reset password |
| PATCH | `/api/admin/caregivers/:id/status` | Admin | Enable or disable an account |
| GET | `/api/admin/patients` | Admin | View all patients (read-only) |
| GET | `/api/admin/visits` | Admin | View all visits (read-only) |

---

## Database Schema

```sql
users (
  id, name, email, password_hash,
  role          ENUM('patient','caregiver','admin'),
  status        ENUM('active','disabled','rejected'),
  is_approved   TINYINT(1) DEFAULT 0,
  is_verified   TINYINT(1) DEFAULT 0,
  verification_token            VARCHAR(128) NULL,
  verification_token_expires_at DATETIME NULL,
  created_at
)

patients (
  id, user_id (nullable), full_name, age, gender,
  caregiver_id (FK -> users.id), medical_notes, created_at
)

visits (
  id, patient_id (FK), caregiver_id (FK),
  visit_date, status ENUM('open','closed'), created_at
)

board_selections (
  id, visit_id (FK),
  category ENUM('body_part','need','emotion','symptom','free_text'),
  label, created_at
)

caregiver_speech_logs (id, visit_id (FK), transcript_text, created_at)

ai_summaries (id, visit_id (FK), summary_text, generated_at)
```

---

## Environment Variables

See `server/.env.example` for the full template.

| Variable | Required | Default | Description |
|---|---|---|---|
| `DB_HOST` | Yes | `localhost` | MySQL host |
| `DB_PORT` | Yes | `3306` | MySQL port |
| `DB_USER` | Yes | `root` | MySQL username |
| `DB_PASSWORD` | Yes | *(empty)* | MySQL password |
| `DB_NAME` | Yes | `communicare` | Database name |
| `JWT_SECRET` | Yes | — | Secret used to sign JWTs — generate your own; never reuse a sample value |
| `PORT` | No | `5000` | Express server port |
| `APP_URL` | No | `http://localhost:5173` | Base URL used in email verification links |
| `SMTP_HOST` | No | — | SMTP host (omit to use Ethereal in development) |
| `SMTP_PORT` | No | `587` | SMTP port |
| `SMTP_SECURE` | No | `false` | Use TLS (`true` / `false`) |
| `SMTP_USER` | No | — | SMTP username |
| `SMTP_PASS` | No | — | SMTP password |
| `ANTHROPIC_API_KEY` | Yes | — | Anthropic API key used for AI summaries — keep secret, never commit |

---

## Security Notes

- `server/.env` is gitignored and must never be committed. Only `server/.env.example`, containing placeholders, belongs in version control.
- If `JWT_SECRET` or `ANTHROPIC_API_KEY` were ever committed or shared publicly, rotate them immediately.
- Demo credentials are for local development only and must not be reused in any deployed or public-facing environment.
- All write operations (delete, update) are protected by server-side role checks — UI-level restrictions alone are not treated as sufficient authorization.

---

## Project Status

| Phase | Description | Status |
|---|---|---|
| 0 | Project setup and scaffolding | Complete |
| 1 | Auth and user roles (JWT, bcrypt, role guards, approval workflow, email verification) | Complete |
| 2 | Patient and caregiver records (CRUD + visits) | Complete |
| 3 | Communication board (48 items, 4 categories, free text) | Complete |
| 4 | Speech-to-text (Web Speech API, patient view, saved logs) | Complete |
| 5 | AI visit summaries (Claude, clinical prompt, stored summaries) | Complete |
| 6 | Admin panel (account management, approval workflow, read-only data views) | Complete |
| 7 | PDF export (full visit history with AI summaries) | Complete |
| 8 | Polish (error boundary, 404 page, responsive CSS, seed data) | Complete |

---

## Author

Wade — Final Year BSc Computer Science (Software Engineering), INES Ruhengeri
