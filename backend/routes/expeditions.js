const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/expeditions/active?destination=xxx
// Active (not yet ended) expeditions, optionally filtered by destination
router.get('/active', authenticateToken, (req, res) => {
  const { destination } = req.query;
  const today = new Date().toISOString().split('T')[0];

  const params = [req.user.id, today];
  let where = 'e.end_date >= ?';
  if (destination) {
    where += ' AND e.destination = ?';
    params.push(destination);
  }

  const expeditions = db.prepare(`
    SELECT e.*,
      (SELECT COUNT(*) FROM expedition_members em WHERE em.expedition_id = e.id) AS member_count,
      (SELECT COUNT(*) FROM expedition_members em WHERE em.expedition_id = e.id AND em.user_id = ?) AS _is_member
    FROM expeditions e
    WHERE ${where}
    ORDER BY e.start_date ASC
  `).all(...params).map(e => ({ ...e, is_member: e._is_member > 0, _is_member: undefined }));

  res.json(expeditions);
});

// GET /api/expeditions/mine — expeditions the current user has joined
router.get('/mine', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const today = new Date().toISOString().split('T')[0];

  const expeditions = db.prepare(`
    SELECT
      e.*,
      em.joined_at,
      (SELECT COUNT(*) FROM expedition_members em2 WHERE em2.expedition_id = e.id) AS member_count,
      CASE WHEN e.end_date >= ? THEN 1 ELSE 0 END AS is_active,
      (SELECT COUNT(*) * 10 FROM trips t WHERE t.user_id = ? AND t.expedition_id = e.id) AS my_expedition_points,
      (SELECT COUNT(*) FROM trips t WHERE t.user_id = ? AND t.expedition_id = e.id) AS my_trip_count
    FROM expeditions e
    JOIN expedition_members em ON em.expedition_id = e.id AND em.user_id = ?
    ORDER BY e.start_date DESC
  `).all(today, userId, userId, userId);

  res.json(expeditions);
});

// POST /api/expeditions/join — join with invite code
router.post('/join', authenticateToken, (req, res) => {
  const { invite_code } = req.body;
  if (!invite_code) {
    return res.status(400).json({ error: 'Código de invitación requerido' });
  }

  const expedition = db.prepare(
    'SELECT * FROM expeditions WHERE invite_code = ?'
  ).get(invite_code.toUpperCase().trim());

  if (!expedition) {
    return res.status(404).json({ error: 'Código de invitación inválido' });
  }

  const today = new Date().toISOString().split('T')[0];
  if (expedition.end_date < today) {
    return res.status(400).json({ error: 'Esta expedición ya ha terminado' });
  }

  const alreadyMember = db.prepare(
    'SELECT COUNT(*) as count FROM expedition_members WHERE expedition_id = ? AND user_id = ?'
  ).get(expedition.id, req.user.id);

  if (alreadyMember.count > 0) {
    return res.status(400).json({ error: 'Ya eres miembro de esta expedición' });
  }

  db.prepare(
    'INSERT INTO expedition_members (expedition_id, user_id) VALUES (?, ?)'
  ).run(expedition.id, req.user.id);

  const memberCount = db.prepare(
    'SELECT COUNT(*) as count FROM expedition_members WHERE expedition_id = ?'
  ).get(expedition.id);

  res.json({
    success: true,
    expedition: { ...expedition, member_count: memberCount.count, is_member: true },
  });
});

// GET /api/expeditions/:id — expedition detail
router.get('/:id', authenticateToken, (req, res) => {
  const expeditionId = parseInt(req.params.id);

  const expedition = db.prepare('SELECT * FROM expeditions WHERE id = ?').get(expeditionId);
  if (!expedition) {
    return res.status(404).json({ error: 'Expedición no encontrada' });
  }

  const memberCount = db.prepare(
    'SELECT COUNT(*) as count FROM expedition_members WHERE expedition_id = ?'
  ).get(expeditionId);

  const isMember = db.prepare(
    'SELECT COUNT(*) as count FROM expedition_members WHERE expedition_id = ? AND user_id = ?'
  ).get(expeditionId, req.user.id);

  res.json({
    ...expedition,
    member_count: memberCount.count,
    is_member: isMember.count > 0,
  });
});

// GET /api/expeditions/:id/leaderboard — ranking for this expedition only
router.get('/:id/leaderboard', authenticateToken, (req, res) => {
  const expeditionId = parseInt(req.params.id);
  const userId = req.user.id;

  const expedition = db.prepare('SELECT * FROM expeditions WHERE id = ?').get(expeditionId);
  if (!expedition) {
    return res.status(404).json({ error: 'Expedición no encontrada' });
  }

  const leaders = db.prepare(`
    SELECT
      u.id, u.name, u.level,
      COUNT(t.id) AS trip_count,
      COUNT(t.id) * 10 AS expedition_points,
      u.total_co2,
      u.compensated_co2
    FROM expedition_members em
    JOIN users u ON u.id = em.user_id
    LEFT JOIN trips t ON t.user_id = em.user_id AND t.expedition_id = ?
    GROUP BY u.id
    ORDER BY expedition_points DESC, em.joined_at ASC
  `).all(expeditionId).map((l, i) => ({
    ...l,
    rank: i + 1,
    is_me: l.id === userId,
    is_demo: l.id >= 9000,
  }));

  const myEntry = leaders.find(l => l.id === userId);

  const groupStats = db.prepare(`
    SELECT
      ROUND(SUM(u.total_co2), 1)       AS total_co2,
      ROUND(SUM(u.compensated_co2), 1) AS total_compensated,
      CASE WHEN SUM(u.total_co2) > 0
        THEN ROUND((SUM(u.compensated_co2) / SUM(u.total_co2)) * 100, 1)
        ELSE 0
      END AS compensation_pct
    FROM expedition_members em
    JOIN users u ON u.id = em.user_id
    WHERE em.expedition_id = ?
  `).get(expeditionId);

  res.json({
    expedition,
    leaders,
    my_rank: myEntry?.rank ?? null,
    group_stats: groupStats,
  });
});

// POST /api/expeditions — create expedition (admin / Diving Life)
router.post('/', authenticateToken, (req, res) => {
  const { name, destination, start_date, end_date, invite_code, prize_description } = req.body;

  if (!name || !destination || !start_date || !end_date || !invite_code) {
    return res.status(400).json({ error: 'name, destination, start_date, end_date e invite_code son requeridos' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO expeditions (name, destination, start_date, end_date, invite_code, prize_description)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, destination, start_date, end_date, invite_code.toUpperCase().trim(), prize_description || '');

    res.status(201).json(db.prepare('SELECT * FROM expeditions WHERE id = ?').get(result.lastInsertRowid));
  } catch (e) {
    if (e.message?.includes('UNIQUE')) {
      return res.status(400).json({ error: 'El código de invitación ya existe' });
    }
    console.error(e);
    res.status(500).json({ error: 'Error creando la expedición' });
  }
});

module.exports = router;
