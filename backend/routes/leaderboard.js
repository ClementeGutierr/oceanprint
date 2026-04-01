const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const limit  = Math.min(parseInt(req.query.limit)  || 20, 100);
  const offset = Math.max(parseInt(req.query.offset) || 0,  0);

  const total = db.prepare("SELECT COUNT(*) as count FROM users WHERE role != 'admin'").get().count;

  const leaders = db.prepare(`
    SELECT
      id, name, points, level, trips_count,
      total_co2, compensated_co2,
      CASE WHEN total_co2 > 0 THEN ROUND((compensated_co2 / total_co2) * 100, 1) ELSE 0 END as compensation_pct
    FROM users
    ORDER BY points DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset).map(l => ({
    ...l,
    is_me:   l.id === userId,
    is_demo: l.id >= 9000,
  }));

  const userRank = db.prepare(`
    SELECT COUNT(*) + 1 as rank FROM users WHERE points > (SELECT points FROM users WHERE id = ?)
  `).get(userId);

  const groupStats = db.prepare(`
    SELECT
      ROUND(SUM(total_co2), 1)       AS total_co2,
      ROUND(SUM(compensated_co2), 1) AS total_compensated,
      CASE WHEN SUM(total_co2) > 0
        THEN ROUND((SUM(compensated_co2) / SUM(total_co2)) * 100, 1)
        ELSE 0
      END AS compensation_pct
    FROM users
  `).get();

  res.json({
    leaders,
    my_rank:     userRank.rank,
    group_stats: groupStats,
    total,
    has_more:    offset + limit < total,
  });
});

module.exports = router;
