const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const COMPENSATION_OPTIONS = [
  {
    id: 'corales',
    name: 'Plantar Corales',
    organization: 'Fundación Corales de Paz',
    description: 'Cada coral plantado captura 0.5 kg CO2/año durante 20+ años en los arrecifes del Caribe',
    co2_per_unit: 0.5,
    cost_per_unit: 15000,
    unit: 'coral',
    icon: '🪸',
    points_per_unit: 25,
    currency: 'COP',
  },
  {
    id: 'manglares',
    name: 'Plantar Manglares',
    organization: 'Fundación Mar Viva',
    description: 'Los manglares secuestran hasta 4x más carbono que los bosques tropicales. Cada árbol captura 12 kg CO2/año',
    co2_per_unit: 12,
    cost_per_unit: 25000,
    unit: 'árbol',
    icon: '🌿',
    points_per_unit: 40,
    currency: 'COP',
  },
  {
    id: 'limpieza',
    name: 'Limpieza de Playa',
    organization: 'Ocean Conservancy',
    description: 'Patrocina la recolección de residuos plásticos que afectan la vida marina. Cada jornada remueve 50 kg de plástico',
    co2_per_unit: 8,
    cost_per_unit: 50000,
    unit: 'jornada',
    icon: '♻️',
    points_per_unit: 60,
    currency: 'COP',
  },
  {
    id: 'voluntariado',
    name: 'Voluntariado Marino',
    organization: 'Diving Life Foundation',
    description: 'Participa activamente en expediciones de monitoreo y restauración de ecosistemas marinos',
    co2_per_unit: 20,
    cost_per_unit: 0,
    unit: 'expedición',
    icon: '🤿',
    points_per_unit: 100,
    currency: 'COP',
  },
];

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
  res.json(COMPENSATION_OPTIONS);
});

// Register a compensation
router.post('/', authenticateToken, (req, res) => {
  try {
    const { type, units = 1 } = req.body;

    const option = COMPENSATION_OPTIONS.find(o => o.id === type);
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
