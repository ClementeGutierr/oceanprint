const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

function updateUserLevel(userId) {
  const user = db.prepare('SELECT points FROM users WHERE id = ?').get(userId);
  let level = 'Plancton';
  if (user.points >= 1000) level = 'Ballena Azul';
  else if (user.points >= 600) level = 'Mantarraya';
  else if (user.points >= 300) level = 'Tortuga Marina';
  else if (user.points >= 100) level = 'Caballito de Mar';
  db.prepare('UPDATE users SET level = ? WHERE id = ?').run(level, userId);
}

// Get all missions with user completion status
router.get('/', authenticateToken, (req, res) => {
  const missions = db.prepare(`
    SELECT m.*,
      CASE WHEN um.id IS NOT NULL THEN 1 ELSE 0 END as completed,
      um.completed_at
    FROM missions m
    LEFT JOIN user_missions um ON m.id = um.mission_id AND um.user_id = ?
    ORDER BY m.points ASC
  `).all(req.user.id);

  res.json(missions);
});

// Complete a mission
router.post('/:id/complete', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;

    const mission = db.prepare('SELECT * FROM missions WHERE id = ?').get(id);
    if (!mission) {
      return res.status(404).json({ error: 'Misión no encontrada' });
    }

    const alreadyCompleted = db.prepare(
      'SELECT id FROM user_missions WHERE user_id = ? AND mission_id = ?'
    ).get(req.user.id, id);

    if (alreadyCompleted) {
      return res.status(409).json({ error: 'Misión ya completada' });
    }

    db.prepare('INSERT INTO user_missions (user_id, mission_id) VALUES (?, ?)').run(req.user.id, id);
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
