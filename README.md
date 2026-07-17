# CommuniCare
### AI Health Assistant for Patients with Speech Impairment

CommuniCare gives patients with speech impairments a structured way to communicate with caregivers through a tap-based communication board, converts caregiver speech to on-screen text for patients to read, and uses AI (Claude) to generate clinical-style visit summaries.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + React Router |
| Backend | Node.js + Express 5 |
| Database | MySQL 8 (XAMPP) |
| Email | Nodemailer + Ethereal (dev) / any SMTP (prod) |
| Speech-to-Text | Web Speech API (browser-native) |
| AI Summary | Anthropic Claude (claude-opus-4-5) |
| PDF Export | jsPDF + jspdf-autotable |
| Auth | JWT (8-hour sessions) |

---

## Prerequisites

- **Node.js** 18 or newer — [nodejs.org](https://nodejs.org)
- **XAMPP** (or any MySQL 8 server) — [apachefriends.org](https://www.apachefriends.org)
- A modern browser — **Chrome or Edge** (required for Web Speech API)

---

## Setup Instructions

### 1. Clone / open the project

```
/client      React frontend
/server      Node.js backend
```

### 2. Start MySQL

Open **XAMPP Control Panel** and click **Start** next to **MySQL**.

### 3. Configure the backend

The `server/.env` file is pre-configured for XAMPP defaults:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=communicare

JWT_SECRET=communicare_jwt_secret_change_in_production
PORT=5000

APP_URL=http://localhost:5173

# SMTP — leave blank in dev to use Ethereal auto-account
# SMTP_HOST=
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=
# SMTP_PASS=

ANTHROPIC_API_KEY=<already set>
```

> If your MySQL has a password, update `DB_PASSWORD`.

### 4. Initialise the database

Run **once** — creates all tables and seeds the admin account:

```bash
cd server
node config/initDb.js
```

### 5. Apply the approval migration

Run **once** — adds `is_approved`, `is_verified`, and email-verification columns:

```bash
node config/migrateApproval.js
```

> This is safe to re-run. Existing users (admin + demo caregivers) are automatically backfilled to approved + verified.

### 6. Load demo data (recommended for demos)

```bash
node config/seedDemo.js
```

Creates 2 demo caregivers, 3 patients, 5 visits with board data, speech logs, and pre-written AI summaries.

### 7. Start the backend

```bash
npm run dev
```

Runs on **http://localhost:5000** — health check: `GET /api/health`

### 8. Start the frontend

```bash
cd client
npm install   # first time only
npm run dev
```

Runs on **http://localhost:5173**

---

## Demo Credentials

> All demo accounts are pre-approved and pre-verified — they bypass the approval workflow and can log in immediately.

| Role | Email | Password | Notes |
|---|---|---|---|
| Admin | wadenerd6@gmail.com | Admin123 | Seeded via `initDb.js` |
| Caregiver 1 | caregiver1@demo.com | Demo1234 | Patients: John Smith, Priya Patel |
| Caregiver 2 | caregiver2@demo.com | Demo1234 | Patient: Carlos Rivera |

---

## Caregiver Registration Flow

New caregivers go through a two-step approval process before they can log in:

```
Register → pending admin approval → admin approves → verification email sent
→ caregiver clicks link → email verified → can now log in
```

1. Caregiver submits `POST /api/auth/register` → account created with `is_approved=false, is_verified=false`; no JWT issued
2. Admin sees the account in `GET /api/admin/caregivers/pending`
3. Admin calls `PATCH /api/admin/caregivers/:id/approve` → sets `is_approved=true`, generates a 24-hour token, sends a verification email
4. Caregiver clicks the link → `GET /api/auth/verify?token=xxx` → sets `is_verified=true`
5. Login now succeeds and returns a JWT

**Rejection:** `PATCH /api/admin/caregivers/:id/reject` sets `status='rejected'`; login is blocked with a clear message.

### Email in development (Ethereal)

If no `SMTP_*` env vars are set, Nodemailer auto-creates a free [Ethereal](https://ethereal.email) test account. After approving a caregiver, the server prints:

```
📧 Email preview (Ethereal): https://ethereal.email/message/xxx...
```

Open that URL to see the rendered email and copy the verification link.

---

## Features by Role

### Caregiver
- Register (pending approval workflow)
- Login (blocked until approved + email verified)
- Update own profile — name, email, password (`PUT /api/caregiver/me`, requires current password for password changes)
- Add patients with medical notes
- Start and manage visit sessions
- **Communication Board** — 48 items across 4 categories (Body Parts, Needs, Emotions, Symptoms) — patient taps to build a message
- Free-text input as an alternative to the board
- **Speech-to-Text** — speak into the microphone; transcript appears large on screen for the patient to read; save to visit record
- **Patient View** — fullscreen high-contrast display for the patient
- Generate AI clinical summary from visit data (powered by Claude)
- Export patient visit history as a PDF report

### Admin
- View all caregiver accounts (approved + pending)
- Approve pending registrations (triggers verification email)
- Reject pending registrations
- Enable / disable active accounts
- Edit caregiver name, email, reset password (`PUT /api/admin/caregivers/:id`)
- View all patients and visits (read-only)

### Patient
- No login required — operated via the caregiver's device
- Taps the communication board during a visit session

---

## API Routes Reference

### Auth
| Method | Route | Access | Description |
|---|---|---|---|
| POST | /api/auth/register | Public | Register caregiver (returns pending message, no JWT) |
| POST | /api/auth/login | Public | Login — requires `is_approved=true` AND `is_verified=true` |
| GET | /api/auth/verify?token= | Public | Verify email from link; sets `is_verified=true` |
| GET | /api/auth/me | Caregiver, Admin | Current user profile |

### Caregiver (self)
| Method | Route | Access | Description |
|---|---|---|---|
| PUT | /api/caregiver/me | Caregiver | Update name, email, password (current password required for password change) |

### Patients
| Method | Route | Access | Description |
|---|---|---|---|
| GET | /api/patients | Caregiver | List own patients |
| POST | /api/patients | Caregiver | Create patient |
| GET | /api/patients/:id | Caregiver, Admin | Get patient |
| PUT | /api/patients/:id | Caregiver | Update patient info / notes |
| GET | /api/patients/:id/report | Caregiver, Admin | Full report data (for PDF export) |

### Visits
| Method | Route | Access | Description |
|---|---|---|---|
| POST | /api/visits | Caregiver | Start new visit |
| GET | /api/visits/patient/:id | Caregiver, Admin | List visits for a patient |
| GET | /api/visits/:id | Caregiver, Admin | Get single visit |
| PATCH | /api/visits/:id/close | Caregiver | Close a visit |

### Board
| Method | Route | Access | Description |
|---|---|---|---|
| GET | /api/board/visit/:id | Caregiver, Admin | Get board selections |
| POST | /api/board/visit/:id | Caregiver | Save selections |
| DELETE | /api/board/visit/:id | Caregiver | Clear selections |

### Speech
| Method | Route | Access | Description |
|---|---|---|---|
| GET | /api/speech/visit/:id | Caregiver, Admin | Get speech logs |
| POST | /api/speech/visit/:id | Caregiver | Save transcript |

### AI Summary
| Method | Route | Access | Description |
|---|---|---|---|
| GET | /api/summary/visit/:id | Caregiver, Admin | Get saved summary |
| POST | /api/summary/visit/:id | Caregiver | Generate + save summary via Claude |

### Admin
| Method | Route | Access | Description |
|---|---|---|---|
| GET | /api/admin/caregivers | Admin | All caregivers |
| GET | /api/admin/caregivers/pending | Admin | Caregivers awaiting approval |
| PATCH | /api/admin/caregivers/:id/approve | Admin | Approve + send verification email |
| PATCH | /api/admin/caregivers/:id/reject | Admin | Reject registration |
| PUT | /api/admin/caregivers/:id | Admin | Edit name, email, reset password |
| PATCH | /api/admin/caregivers/:id/status | Admin | Enable / disable account |
| GET | /api/admin/patients | Admin | All patients (read-only) |
| GET | /api/admin/visits | Admin | All visits (read-only) |

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
  caregiver_id (FK → users.id), medical_notes, created_at
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

| Variable | Required | Default | Description |
|---|---|---|---|
| `DB_HOST` | Yes | `localhost` | MySQL host |
| `DB_PORT` | Yes | `3306` | MySQL port |
| `DB_USER` | Yes | `root` | MySQL username |
| `DB_PASSWORD` | Yes | *(empty)* | MySQL password |
| `DB_NAME` | Yes | `communicare` | Database name |
| `JWT_SECRET` | Yes | — | Secret for signing JWTs |
| `PORT` | No | `5000` | Express server port |
| `APP_URL` | No | `http://localhost:5173` | Base URL for email verification links |
| `SMTP_HOST` | No | — | SMTP host (omit to use Ethereal in dev) |
| `SMTP_PORT` | No | `587` | SMTP port |
| `SMTP_SECURE` | No | `false` | Use TLS (`true`/`false`) |
| `SMTP_USER` | No | — | SMTP username |
| `SMTP_PASS` | No | — | SMTP password |
| `ANTHROPIC_API_KEY` | Yes | — | Anthropic API key for Claude |

---

## Project Phases

- [x] Phase 0 — Project Setup & Scaffolding
- [x] Phase 1 — Auth & User Roles (JWT, bcrypt, role guards, approval workflow, email verification)
- [x] Phase 2 — Patient & Caregiver Records (CRUD + visits)
- [x] Phase 3 — Communication Board (48 items, 4 categories, free text)
- [x] Phase 4 — Speech-to-Text (Web Speech API, patient view, saved logs)
- [x] Phase 5 — AI Summary (Claude claude-opus-4-5, clinical prompt, stored summaries)
- [x] Phase 6 — Admin Panel (account management, approval workflow, read-only data views)
- [x] Phase 7 — PDF Export (jsPDF, full visit history with AI summaries)
- [x] Phase 8 — Polish (error boundary, 404 page, responsive CSS, seed data)
