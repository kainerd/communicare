require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/db');

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

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
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
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, async () => {
  console.log(`CommuniCare server running on http://localhost:${PORT}`);
  await testConnection();
});
