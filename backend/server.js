require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Initialize DB
initDatabase();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/trips', require('./routes/trips'));
app.use('/api/missions', require('./routes/missions'));
app.use('/api/quizzes', require('./routes/quizzes'));
app.use('/api/compensations', require('./routes/compensations'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/expeditions', require('./routes/expeditions'));
app.use('/api/dynamics', require('./routes/dynamics'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'OceanPrint API running', version: '1.0.0' });
});

app.listen(PORT, () => {
  console.log(`🌊 OceanPrint Backend running on port ${PORT}`);
  console.log(`📡 Health: http://localhost:${PORT}/api/health`);
});
