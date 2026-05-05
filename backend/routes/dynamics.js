const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/dynamics — dynamics for the user's active expedition(s)
router.get('/', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const today = new Date().toISOString().split('T')[0];

  // Find active expedition(s) the user belongs to (still ongoing)
  const activeExp = db.prepare(`
    SELECT e.id, e.name, e.destination, e.start_date, e.end_date
    FROM expeditions e
    JOIN expedition_members em ON em.expedition_id = e.id AND em.user_id = ?
    WHERE e.end_date >= ?
    ORDER BY e.start_date ASC
    LIMIT 1
  `).get(userId, today);

  if (!activeExp) {
    return res.json({ has_active: false, expedition: null, dynamics: [] });
  }

  const dynamics = db.prepare(`
    SELECT
      d.id, d.name, d.description, d.points, d.type, d.date, d.created_at,
      ud.points_awarded, ud.participated, ud.notes, ud.assigned_at
    FROM dynamics d
    LEFT JOIN user_dynamics ud ON ud.dynamic_id = d.id AND ud.user_id = ?
    WHERE d.expedition_id = ?
    ORDER BY d.date DESC, d.created_at DESC
  `).all(userId, activeExp.id);

  const total_points = dynamics.reduce((sum, d) => sum + (d.points_awarded || 0), 0);

  res.json({
    has_active: true,
    expedition: activeExp,
    dynamics,
    total_points,
  });
});

module.exports = router;
