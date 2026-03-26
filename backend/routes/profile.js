const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const user = db.prepare(`
    SELECT id, name, email, points, level, total_co2, compensated_co2, trips_count, created_at
    FROM users WHERE id = ?
  `).get(req.user.id);

  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  const completedMissions = db.prepare(`
    SELECT m.name, m.icon, m.points, um.completed_at
    FROM user_missions um
    JOIN missions m ON um.mission_id = m.id
    WHERE um.user_id = ?
    ORDER BY um.completed_at DESC
  `).all(req.user.id);

  const compensations = db.prepare(`
    SELECT type, organization, co2_compensated, points_earned, created_at
    FROM compensations WHERE user_id = ?
    ORDER BY created_at DESC LIMIT 5
  `).all(req.user.id);

  const recentTrips = db.prepare(`
    SELECT origin, destination, co2_total, created_at
    FROM trips WHERE user_id = ?
    ORDER BY created_at DESC LIMIT 5
  `).all(req.user.id);

  // Level progress
  const levelThresholds = {
    'Plancton': { min: 0, max: 100, next: 'Caballito de Mar' },
    'Caballito de Mar': { min: 100, max: 300, next: 'Tortuga Marina' },
    'Tortuga Marina': { min: 300, max: 600, next: 'Mantarraya' },
    'Mantarraya': { min: 600, max: 1000, next: 'Ballena Azul' },
    'Ballena Azul': { min: 1000, max: 1000, next: null },
  };

  const currentLevel = levelThresholds[user.level] || levelThresholds['Plancton'];
  const levelProgress = currentLevel.max > currentLevel.min
    ? Math.min(100, Math.round(((user.points - currentLevel.min) / (currentLevel.max - currentLevel.min)) * 100))
    : 100;

  const compensationPct = user.total_co2 > 0
    ? Math.min(100, Math.round((user.compensated_co2 / user.total_co2) * 100))
    : 0;

  res.json({
    ...user,
    completed_missions: completedMissions,
    recent_compensations: compensations,
    recent_trips: recentTrips,
    level_progress: levelProgress,
    next_level: currentLevel.next,
    compensation_pct: compensationPct,
    missions_count: completedMissions.length,
  });
});

module.exports = router;
