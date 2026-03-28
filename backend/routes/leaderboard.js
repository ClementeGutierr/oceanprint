const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const userId = req.user.id;

  const leaders = db.prepare(`
    SELECT
      id, name, points, level, trips_count,
      total_co2, compensated_co2,
      CASE WHEN total_co2 > 0 THEN ROUND((compensated_co2 / total_co2) * 100, 1) ELSE 0 END as compensation_pct
    FROM users
    ORDER BY points DESC
    LIMIT 20
  `).all().map(l => ({
    ...l,
    is_me:   l.id === userId,
    is_demo: l.id >= 9000,
  }));

  const userRank = db.prepare(`
    SELECT COUNT(*) + 1 as rank FROM users WHERE points > (SELECT points FROM users WHERE id = ?)
  `).get(userId);

  res.json({
    leaders,
    my_rank: userRank.rank,
  });
});

module.exports = router;
