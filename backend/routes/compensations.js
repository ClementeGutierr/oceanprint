const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

function getCompensationOptions() {
  return db.prepare('SELECT * FROM compensation_options ORDER BY sort_order').all();
}

function updateUserLevel(userId) {
  const user = db.prepare('SELECT points FROM users WHERE id = ?').get(userId);
  let level = 'Plancton';
  if (user.points >= 1000) level = 'Ballena Azul';
  else if (user.points >= 600) level = 'Mantarraya';
  else if (user.points >= 300) level = 'Tortuga Marina';
  else if (user.points >= 100) level = 'Caballito de Mar';
  db.prepare('UPDATE users SET level = ? WHERE id = ?').run(level, userId);
}

// Get compensation options
router.get('/options', authenticateToken, (req, res) => {
  res.json(getCompensationOptions());
});

// Register a compensation
router.post('/', authenticateToken, (req, res) => {
  try {
    const { type, units = 1 } = req.body;

    const option = getCompensationOptions().find(o => o.id === type);
    if (!option) {
      return res.status(400).json({ error: 'Tipo de compensación inválido' });
    }

    const co2Compensated = option.co2_per_unit * units;
    const cost = option.cost_per_unit * units;
    const pointsEarned = option.points_per_unit * units;

    db.prepare(`
      INSERT INTO compensations (user_id, type, organization, co2_compensated, cost, points_earned)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.user.id, type, option.organization, co2Compensated, cost, pointsEarned);

    db.prepare('UPDATE users SET compensated_co2 = compensated_co2 + ?, points = points + ? WHERE id = ?')
      .run(co2Compensated, pointsEarned, req.user.id);

    updateUserLevel(req.user.id);

    // Check Compensador Activo mission (compensate >= 1000 kg = 1 ton in one action)
    if (co2Compensated >= 1000) {
      const mission = db.prepare("SELECT id FROM missions WHERE name = 'Compensador Activo'").get();
      if (mission) {
        db.prepare('INSERT OR IGNORE INTO user_missions (user_id, mission_id) VALUES (?, ?)').run(req.user.id, mission.id);
      }
    }

    const user = db.prepare('SELECT points, level, total_co2, compensated_co2 FROM users WHERE id = ?').get(req.user.id);
    const compensationPct = user.total_co2 > 0 ? Math.min(100, Math.round((user.compensated_co2 / user.total_co2) * 100)) : 0;

    res.json({
      success: true,
      co2_compensated: co2Compensated,
      points_earned: pointsEarned,
      total_points: user.points,
      level: user.level,
      compensation_pct: compensationPct,
      total_co2: user.total_co2,
      compensated_co2: user.compensated_co2,
    });
  } catch (error) {
    console.error('Compensation error:', error);
    res.status(500).json({ error: 'Error registrando compensación' });
  }
});

// Get user compensations history
router.get('/', authenticateToken, (req, res) => {
  const compensations = db.prepare(`
    SELECT * FROM compensations WHERE user_id = ? ORDER BY created_at DESC LIMIT 20
  `).all(req.user.id);
  res.json(compensations);
});

module.exports = router;
