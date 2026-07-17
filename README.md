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

Open the project folder in your editor. The structure is:
```
/client      React frontend
/server      Node.js backend
```

### 2. Start MySQL

Open **XAMPP Control Panel** and click **Start** next to **MySQL**.

### 3. Configure the backend

```bash
cd server
```

The `.env` file is already configured for XAMPP defaults:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=communicare
ANTHROPIC_API_KEY=<already set>
JWT_SECRET=communicare_jwt_secret_change_in_production
PORT=5000
```

> If your MySQL has a different root password, update `DB_PASSWORD` in `server/.env`.

### 4. Initialise the database

Run **once** to create the database, all tables, and seed the admin account:

```bash
cd server
node config/initDb.js
```

Expected output:
```
Connected to MySQL.
Database 'communicare' ready.
Table: users ✓
Table: patients ✓
Table: visits ✓
Table: board_selections ✓
Table: caregiver_speech_logs ✓
Table: ai_summaries ✓
Admin account seeded ✓
✓ Database initialisation complete.
```

### 5. Load demo data (recommended for demo/defence)

```bash
node config/seedDemo.js
```

This creates 2 demo caregivers, 3 patients, 5 visits with board selections, speech logs, and pre-written AI summaries.

### 6. Start the backend

```bash
npm run dev
```

Server runs on **http://localhost:5000**

Health check: `GET http://localhost:5000/api/health`

### 7. Install and start the frontend

In a new terminal:

```bash
cd client
npm install
npm run dev
```

Frontend runs on **http://localhost:5173**

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | wadenerd6@gmail.com | Admin123 |
| Caregiver 1 | caregiver1@demo.com | Demo1234 |
| Caregiver 2 | caregiver2@demo.com | Demo1234 |

**Caregiver 1** has patients: John Smith, Priya Patel
**Caregiver 2** has patient: Carlos Rivera

---

## Features by Role

### Caregiver
- Register / login
- Add patients with medical notes
- Start and manage visit sessions
- **Communication Board** — 48 items across 4 categories (Body Parts, Needs, Emotions, Symptoms) — patient taps to build a message
- Free-text input as an alternative to the board
- **Speech-to-Text** — speak into the microphone; transcript appears large on screen for the patient to read; save to visit record
- **Patient View** — fullscreen high-contrast display for the patient
- Generate AI clinical summary from visit data (powered by Claude)
- Export patient visit history as a PDF report

### Admin
- View all caregiver accounts
- Enable / disable caregiver accounts
- Reset a caregiver's password
- View all patients and visits (read-only)

### Patient
- No login required — operated via the caregiver's device
- Taps the communication board during a visit session

---

## API Routes Reference

### Auth
| Method | Route | Access |
|---|---|---|
| POST | /api/auth/register | Public |
| POST | /api/auth/login | Public |
| GET | /api/auth/me | Caregiver, Admin |

### Patients
| Method | Route | Access |
|---|---|---|
| GET | /api/patients | Caregiver |
| POST | /api/patients | Caregiver |
| GET | /api/patients/:id | Caregiver, Admin |
| PUT | /api/patients/:id | Caregiver |
| GET | /api/patients/:id/report | Caregiver, Admin |

### Visits
| Method | Route | Access |
|---|---|---|
| POST | /api/visits | Caregiver |
| GET | /api/visits/patient/:id | Caregiver, Admin |
| GET | /api/visits/:id | Caregiver, Admin |
| PATCH | /api/visits/:id/close | Caregiver |

### Board
| Method | Route | Access |
|---|---|---|
| GET | /api/board/visit/:id | Caregiver, Admin |
| POST | /api/board/visit/:id | Caregiver |
| DELETE | /api/board/visit/:id | Caregiver |

### Speech
| Method | Route | Access |
|---|---|---|
| GET | /api/speech/visit/:id | Caregiver, Admin |
| POST | /api/speech/visit/:id | Caregiver |

### AI Summary
| Method | Route | Access |
|---|---|---|
| GET | /api/summary/visit/:id | Caregiver, Admin |
| POST | /api/summary/visit/:id | Caregiver |

### Admin
| Method | Route | Access |
|---|---|---|
| GET | /api/admin/caregivers | Admin |
| PATCH | /api/admin/caregivers/:id/status | Admin |
| PATCH | /api/admin/caregivers/:id/reset-password | Admin |
| GET | /api/admin/patients | Admin |
| GET | /api/admin/visits | Admin |

---

## Database Schema

```sql
users              (id, name, email, password_hash, role, status, created_at)
patients           (id, user_id, full_name, age, gender, caregiver_id, medical_notes, created_at)
visits             (id, patient_id, caregiver_id, visit_date, status, created_at)
board_selections   (id, visit_id, category, label, created_at)
caregiver_speech_logs (id, visit_id, transcript_text, created_at)
ai_summaries       (id, visit_id, summary_text, generated_at)
```

---

## Project Phases Completed

- [x] Phase 0 — Project Setup & Scaffolding
- [x] Phase 1 — Auth & User Roles (JWT, bcrypt, role guards)
- [x] Phase 2 — Patient & Caregiver Records (CRUD + visits)
- [x] Phase 3 — Communication Board (48 items, 4 categories, free text)
- [x] Phase 4 — Speech-to-Text (Web Speech API, patient view, saved logs)
- [x] Phase 5 — AI Summary (Claude claude-opus-4-5, clinical prompt, stored summaries)
- [x] Phase 6 — Admin Panel (account management, read-only data views)
- [x] Phase 7 — PDF Export (jsPDF, full visit history with AI summaries)
- [x] Phase 8 — Polish (error boundary, 404 page, responsive CSS, seed data, README)
