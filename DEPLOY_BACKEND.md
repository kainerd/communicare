# Deploy CommuniCare Backend to Railway

Your **frontend is already live** at:
> https://client-ashen-zeta-86.vercel.app

Follow these steps to get the backend (Node.js + MySQL) online.
Total time: ~10 minutes.

---

## Step 1 — Create a Railway account

1. Go to https://railway.app
2. Sign up with GitHub or email (free tier, no credit card needed)

---

## Step 2 — Create a new project

1. Click **New Project**
2. Choose **Empty Project**
3. Name it `communicare`

---

## Step 3 — Add a MySQL database

1. Inside your project, click **+ New Service**
2. Choose **Database → MySQL**
3. Railway provisions a MySQL 8 instance automatically
4. Click the MySQL service → **Connect** tab
5. Copy the value for **`MYSQL_URL`** (you need it in Step 5)

---

## Step 4 — Add the Node.js backend service

1. Click **+ New Service → Empty Service**
2. Name it `communicare-api`
3. Go to the **Settings** tab of that service
4. Set **Root Directory** to `server`
5. Set **Start Command** to `node index.js`
6. Under **Source**, choose **Local Directory** (or connect a GitHub repo if you have one)

### Upload method (no GitHub needed):

Railway supports deployment via their CLI. Open a terminal in your project folder and run:

```powershell
# From the project root  (c:\Users\hp\Desktop\New folder)
$env:TEMP\railway.exe login
# Complete the browser login, then:
$env:TEMP\railway.exe link   # select your project + service
$env:TEMP\railway.exe up --service communicare-api --rootDirectory server
```

---

## Step 5 — Set environment variables on Railway

On the `communicare-api` service, go to **Variables** and add each of these:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `MYSQL_URL` | *(paste from Step 3)* |
| `JWT_SECRET` | *(any long random string, e.g. 64 random characters)* |
| `CLIENT_URL` | `https://client-ashen-zeta-86.vercel.app` |
| `APP_URL` | `https://client-ashen-zeta-86.vercel.app` |
| `ANTHROPIC_API_KEY` | *(your Anthropic API key)* |

> For SMTP/email in production, add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS too.
> Leave them blank to keep using Ethereal (preview emails only, not real delivery).

---

## Step 6 — Initialise the database

After the backend deploys successfully, open the Railway service shell
(Settings → Shell) or your local terminal with the Railway CLI and run:

```bash
node config/initDb.js
node config/migrateApproval.js
node config/seedDemo.js   # optional demo data
```

---

## Step 7 — Get your Railway backend URL

1. On the `communicare-api` service → **Settings → Networking**
2. Click **Generate Domain** 
3. Copy the URL (looks like `https://communicare-api-production.up.railway.app`)

---

## Step 8 — Tell Vercel about your backend URL

Go to https://vercel.com → your `client` project → **Settings → Environment Variables**

Add:

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://communicare-api-production.up.railway.app` |

Then **Redeploy** the Vercel project (Deployments tab → click the latest → Redeploy).

---

## Done!

| Part | URL |
|---|---|
| Frontend | https://client-ashen-zeta-86.vercel.app |
| Backend API | https://communicare-api-production.up.railway.app |
| Health check | https://communicare-api-production.up.railway.app/api/health |

The Railway CLI binary is already downloaded at `%TEMP%\railway.exe` —
no installation needed, just use `$env:TEMP\railway.exe` in PowerShell.
