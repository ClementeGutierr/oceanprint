const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Migration: add evidence column if it doesn't exist yet
try { db.exec('ALTER TABLE user_missions ADD COLUMN evidence TEXT') } catch {}
// Migration: track social shares for "Embajador Digital" mission
try { db.exec('ALTER TABLE users ADD COLUMN has_shared_post INTEGER DEFAULT 0') } catch {}
// Migration: rename "Embajador Oceánico" → "Embajador Digital" in existing DBs
try {
  db.exec(`UPDATE missions SET name='Embajador Digital', description='Comparte tu compensación en WhatsApp o descarga la tarjeta para Instagram', icon='📣', category='social' WHERE name='Embajador Oceánico'`)
} catch {}

function updateUserLevel(userId) {
  const user = db.prepare('SELECT points FROM users WHERE id = ?').get(userId);
  let level = 'Plancton';
  if (user.points >= 1000) level = 'Ballena Azul';
  else if (user.points >= 600) level = 'Mantarraya';
  else if (user.points >= 300) level = 'Tortuga Marina';
  else if (user.points >= 100) level = 'Caballito de Mar';
  db.prepare('UPDATE users SET level = ? WHERE id = ?').run(level, userId);
}

// Auto-complete missions that depend on real platform data.
// Called on every GET /missions so they unlock as soon as conditions are met.
function autoCompleteMissions(userId) {
  const user = db.prepare('SELECT trips_count, compensated_co2, has_shared_post FROM users WHERE id = ?').get(userId);
  if (!user) return;

  const checks = [
    // "Compensador Activo" — user has compensated >= 1000 kg total
    { category: 'compensacion', met: (user.compensated_co2  || 0) >= 1000 },
    // "Buceador Consciente" — user has calculated >= 5 trips
    { category: 'calculadora',  met: (user.trips_count     || 0) >= 5    },
    // "Embajador Digital" — user has shared a compensation post
    { category: 'social',       met: (user.has_shared_post || 0) >= 1    },
  ];

  for (const { category, met } of checks) {
    if (!met) continue;
    const mission = db.prepare('SELECT id, points FROM missions WHERE category = ? LIMIT 1').get(category);
    if (!mission) continue;
    const already = db.prepare('SELECT id FROM user_missions WHERE user_id = ? AND mission_id = ?').get(userId, mission.id);
    if (already) continue;
    db.prepare('INSERT OR IGNORE INTO user_missions (user_id, mission_id) VALUES (?, ?)').run(userId, mission.id);
    db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(mission.points, userId);
    updateUserLevel(userId);
  }
}

// GET — list all missions with user completion status + evidence
router.get('/', authenticateToken, (req, res) => {
  autoCompleteMissions(req.user.id);

  const missions = db.prepare(`
    SELECT m.*,
      CASE WHEN um.id IS NOT NULL THEN 1 ELSE 0 END AS completed,
      um.completed_at,
      um.evidence
    FROM missions m
    LEFT JOIN user_missions um ON m.id = um.mission_id AND um.user_id = ?
    ORDER BY m.points ASC
  `).all(req.user.id);

  res.json(missions);
});

// POST /:id/complete — complete a manual mission (with optional evidence)
router.post('/:id/complete', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { evidence } = req.body;

    const mission = db.prepare('SELECT * FROM missions WHERE id = ?').get(id);
    if (!mission) return res.status(404).json({ error: 'Misión no encontrada' });

    // Auto-complete categories cannot be triggered manually
    if (['compensacion', 'calculadora', 'social'].includes(mission.category)) {
      return res.status(403).json({ error: 'Esta misión se completa automáticamente al usar la plataforma' });
    }

    const already = db.prepare(
      'SELECT id FROM user_missions WHERE user_id = ? AND mission_id = ?'
    ).get(req.user.id, id);
    if (already) return res.status(409).json({ error: 'Misión ya completada' });

    db.prepare('INSERT INTO user_missions (user_id, mission_id, evidence) VALUES (?, ?, ?)')
      .run(req.user.id, id, evidence || null);
    db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(mission.points, req.user.id);
    updateUserLevel(req.user.id);

    const user = db.prepare('SELECT points, level FROM users WHERE id = ?').get(req.user.id);
    res.json({
      success: true,
      points_earned: mission.points,
      total_points: user.points,
      level: user.level,
      mission: mission.name,
    });
  } catch (error) {
    console.error('Complete mission error:', error);
    res.status(500).json({ error: 'Error completando la misión' });
  }
});

module.exports = router;
