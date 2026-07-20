require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/db');
const { autoMigrate } = require('./config/autoMigrate');

const healthRouter = require('./routes/health');
const authRouter = require('./routes/auth');
const caregiverRouter = require('./routes/caregiver');
const patientsRouter = require('./routes/patients');
const visitsRouter = require('./routes/visits');
const boardRouter = require('./routes/board');
const speechRouter = require('./routes/speech');
const summaryRouter = require('./routes/summary');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Allow the Vercel frontend URL in production; fall back to localhost in dev.
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, mobile apps, same-origin) and listed origins
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/caregiver', caregiverRouter);
app.use('/api/patients', patientsRouter);
app.use('/api/visits', visitsRouter);
app.use('/api/board', boardRouter);
app.use('/api/speech', speechRouter);
app.use('/api/summary', summaryRouter);
app.use('/api/admin', adminRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  // Always log the full error + stack so Railway/server logs capture the real cause.
  console.error(`[ERROR] ${req.method} ${req.path} →`, err.message);
  console.error(err.stack);

  // In development expose the actual message to the client too, which makes
  // debugging from the browser much faster. In production keep it generic.
  const body = process.env.NODE_ENV !== 'production'
    ? { error: err.message || 'Internal server error' }
    : { error: 'Internal server error' };

  res.status(err.status || 500).json(body);
});

app.listen(PORT, async () => {
  console.log(`CommuniCare server running on http://localhost:${PORT}`);
  await testConnection();
  await autoMigrate();
});
