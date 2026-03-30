const express = require('express');
const { db } = require('../database');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAdmin);

// ── DASHBOARD ─────────────────────────────────────────────
router.get('/dashboard', (req, res) => {
  const totals = db.prepare(`
    SELECT
      COUNT(*) AS users_count,
      COALESCE(SUM(trips_count), 0) AS trips_count,
      ROUND(COALESCE(SUM(total_co2), 0), 1) AS total_co2,
      ROUND(COALESCE(SUM(compensated_co2), 0), 1) AS total_compensated,
      CASE WHEN SUM(total_co2) > 0
        THEN ROUND((SUM(compensated_co2) / SUM(total_co2)) * 100, 1)
        ELSE 0
      END AS compensation_pct
    FROM users WHERE role != 'admin'
  `).get();

  const recentUsers = db.prepare(`
    SELECT id, name, email, level, points, trips_count, created_at
    FROM users WHERE role != 'admin'
    ORDER BY created_at DESC LIMIT 5
  `).all();

  const recentTrips = db.prepare(`
    SELECT t.id, t.origin, t.destination, t.co2_total, t.created_at, u.name AS user_name
    FROM trips t
    JOIN users u ON u.id = t.user_id
    ORDER BY t.created_at DESC LIMIT 5
  `).all();

  res.json({ totals, recent_users: recentUsers, recent_trips: recentTrips });
});

// ── USERS ─────────────────────────────────────────────────
router.get('/users', (req, res) => {
  const { search = '', level = '', expedition_id = '' } = req.query;
  const params = [];
  let where = "u.role != 'admin'";

  if (search) {
    where += ' AND (u.name LIKE ? OR u.email LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (level) {
    where += ' AND u.level = ?';
    params.push(level);
  }

  let query;
  if (expedition_id) {
    query = `
      SELECT u.id, u.name, u.email, u.level, u.points, u.trips_count,
        u.total_co2, u.compensated_co2, u.created_at,
        CASE WHEN u.total_co2 > 0 THEN ROUND((u.compensated_co2 / u.total_co2) * 100, 1) ELSE 0 END AS compensation_pct
      FROM users u
      JOIN expedition_members em ON em.user_id = u.id AND em.expedition_id = ?
      WHERE ${where} ORDER BY u.points DESC`;
    params.unshift(parseInt(expedition_id));
  } else {
    query = `
      SELECT u.id, u.name, u.email, u.level, u.points, u.trips_count,
        u.total_co2, u.compensated_co2, u.created_at,
        CASE WHEN u.total_co2 > 0 THEN ROUND((u.compensated_co2 / u.total_co2) * 100, 1) ELSE 0 END AS compensation_pct
      FROM users u WHERE ${where} ORDER BY u.points DESC`;
  }

  res.json(db.prepare(query).all(...params));
});

router.get('/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const user = db.prepare(
    'SELECT id, name, email, level, points, trips_count, total_co2, compensated_co2, bio, origin_city, instagram, created_at FROM users WHERE id = ?'
  ).get(userId);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  const trips = db.prepare('SELECT * FROM trips WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(userId);
  const compensations = db.prepare('SELECT * FROM compensations WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  const expeditions = db.prepare(`
    SELECT e.id, e.name, e.destination, e.start_date, e.end_date,
      (SELECT COUNT(*) FROM trips t WHERE t.user_id = ? AND t.expedition_id = e.id) AS trip_count
    FROM expeditions e JOIN expedition_members em ON em.expedition_id = e.id AND em.user_id = ?
  `).all(userId, userId);

  res.json({ ...user, trips, compensations, expeditions });
});

// ── EXPEDITIONS ───────────────────────────────────────────
router.get('/expeditions', (req, res) => {
  res.json(db.prepare(`
    SELECT e.*,
      (SELECT COUNT(*) FROM expedition_members em WHERE em.expedition_id = e.id) AS member_count,
      (SELECT COUNT(*) FROM trips t WHERE t.expedition_id = e.id) AS trips_count
    FROM expeditions e ORDER BY e.start_date DESC
  `).all());
});

router.post('/expeditions', (req, res) => {
  const { name, destination, start_date, end_date, invite_code, prize_description = '' } = req.body;
  if (!name || !destination || !start_date || !end_date || !invite_code)
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  try {
    const r = db.prepare(
      'INSERT INTO expeditions (name, destination, start_date, end_date, invite_code, prize_description) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(name, destination, start_date, end_date, invite_code.toUpperCase().trim(), prize_description);
    res.status(201).json(db.prepare('SELECT * FROM expeditions WHERE id = ?').get(r.lastInsertRowid));
  } catch (e) {
    if (e.message?.includes('UNIQUE')) return res.status(400).json({ error: 'El código de invitación ya existe' });
    res.status(500).json({ error: 'Error creando expedición' });
  }
});

router.put('/expeditions/:id', (req, res) => {
  const { name, destination, start_date, end_date, invite_code, prize_description = '' } = req.body;
  const id = parseInt(req.params.id);
  try {
    db.prepare('UPDATE expeditions SET name=?, destination=?, start_date=?, end_date=?, invite_code=?, prize_description=? WHERE id=?')
      .run(name, destination, start_date, end_date, invite_code?.toUpperCase().trim(), prize_description, id);
    res.json(db.prepare('SELECT * FROM expeditions WHERE id = ?').get(id));
  } catch (e) {
    if (e.message?.includes('UNIQUE')) return res.status(400).json({ error: 'El código de invitación ya existe' });
    res.status(500).json({ error: 'Error actualizando expedición' });
  }
});

router.delete('/expeditions/:id', (req, res) => {
  const id = parseInt(req.params.id);
  db.prepare('DELETE FROM expedition_members WHERE expedition_id = ?').run(id);
  db.prepare('UPDATE trips SET expedition_id = NULL WHERE expedition_id = ?').run(id);
  db.prepare('DELETE FROM expeditions WHERE id = ?').run(id);
  res.json({ success: true });
});

router.get('/expeditions/:id/members', (req, res) => {
  const id = parseInt(req.params.id);
  res.json(db.prepare(`
    SELECT u.id, u.name, u.email, u.level, u.points, em.joined_at,
      COUNT(t.id) AS trip_count,
      COUNT(t.id) * 10 AS expedition_points
    FROM expedition_members em
    JOIN users u ON u.id = em.user_id
    LEFT JOIN trips t ON t.user_id = em.user_id AND t.expedition_id = ?
    GROUP BY u.id ORDER BY expedition_points DESC
  `).all(id));
});

// ── EMISSIONS ─────────────────────────────────────────────
router.get('/emissions', (req, res) => {
  // Use users table for totals — same source as Dashboard, includes demo users
  const userTotals = db.prepare(`
    SELECT
      ROUND(COALESCE(SUM(total_co2), 0), 1) AS co2_total,
      ROUND(COALESCE(SUM(compensated_co2), 0), 1) AS total_compensated
    FROM users WHERE role != 'admin'
  `).get();

  // Breakdown by transport type (from trips table — best effort, excludes pre-set demo data)
  const tripBreakdown = db.prepare(`
    SELECT ROUND(COALESCE(SUM(co2_flight),0),1) AS co2_flight,
      ROUND(COALESCE(SUM(co2_sea),0),1) AS co2_sea,
      ROUND(COALESCE(SUM(co2_land),0),1) AS co2_land
    FROM trips
  `).get();

  const overview = {
    co2_flight: tripBreakdown.co2_flight,
    co2_sea:    tripBreakdown.co2_sea,
    co2_land:   tripBreakdown.co2_land,
    co2_total:  userTotals.co2_total,
  };

  const totalComp = { total: userTotals.total_compensated };

  const byDestination = db.prepare(`
    SELECT destination, COUNT(*) AS trips, ROUND(SUM(co2_total),1) AS total_co2
    FROM trips GROUP BY destination ORDER BY total_co2 DESC
  `).all();

  const byExpedition = db.prepare(`
    SELECT e.name, COUNT(t.id) AS trips, ROUND(SUM(t.co2_total),1) AS total_co2
    FROM trips t JOIN expeditions e ON e.id = t.expedition_id
    GROUP BY e.id ORDER BY total_co2 DESC
  `).all();

  const compensations = db.prepare(`
    SELECT c.*, u.name AS user_name
    FROM compensations c JOIN users u ON u.id = c.user_id
    ORDER BY c.created_at DESC LIMIT 100
  `).all();

  res.json({
    overview,
    total_compensated: totalComp.total ?? 0,
    by_destination: byDestination,
    by_expedition: byExpedition,
    compensations,
  });
});

// ── MISSIONS ──────────────────────────────────────────────
router.get('/missions', (req, res) => {
  res.json(db.prepare(`
    SELECT m.*, COUNT(um.id) AS completion_count
    FROM missions m LEFT JOIN user_missions um ON um.mission_id = m.id
    GROUP BY m.id ORDER BY m.id
  `).all());
});

router.post('/missions', (req, res) => {
  const { name, description, icon, points, category, quiz_id } = req.body;
  if (!name || !description || !icon || !points || !category)
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  const r = db.prepare(
    'INSERT INTO missions (name, description, icon, points, category, quiz_id) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(name, description, icon, parseInt(points), category, quiz_id || null);
  res.status(201).json(db.prepare('SELECT * FROM missions WHERE id = ?').get(r.lastInsertRowid));
});

router.put('/missions/:id', (req, res) => {
  const { name, description, icon, points, category, quiz_id } = req.body;
  const id = parseInt(req.params.id);
  db.prepare('UPDATE missions SET name=?, description=?, icon=?, points=?, category=?, quiz_id=? WHERE id=?')
    .run(name, description, icon, parseInt(points), category, quiz_id || null, id);
  res.json(db.prepare('SELECT * FROM missions WHERE id = ?').get(id));
});

router.delete('/missions/:id', (req, res) => {
  const id = parseInt(req.params.id);
  db.prepare('DELETE FROM user_missions WHERE mission_id = ?').run(id);
  db.prepare('DELETE FROM missions WHERE id = ?').run(id);
  res.json({ success: true });
});

// ── QUIZZES ───────────────────────────────────────────────
router.get('/quizzes', (req, res) => {
  res.json(db.prepare('SELECT * FROM quizzes ORDER BY id').all());
});

router.post('/quizzes', (req, res) => {
  const { question, option_a, option_b, option_c, option_d, correct_answer, explanation, category, points } = req.body;
  if (!question || !option_a || !option_b || !option_c || !option_d || !correct_answer || !explanation || !category)
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  const r = db.prepare(
    'INSERT INTO quizzes (question, option_a, option_b, option_c, option_d, correct_answer, explanation, category, points) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(question, option_a, option_b, option_c, option_d, correct_answer, explanation, category, parseInt(points) || 20);
  res.status(201).json(db.prepare('SELECT * FROM quizzes WHERE id = ?').get(r.lastInsertRowid));
});

router.put('/quizzes/:id', (req, res) => {
  const { question, option_a, option_b, option_c, option_d, correct_answer, explanation, category, points } = req.body;
  const id = parseInt(req.params.id);
  db.prepare('UPDATE quizzes SET question=?, option_a=?, option_b=?, option_c=?, option_d=?, correct_answer=?, explanation=?, category=?, points=? WHERE id=?')
    .run(question, option_a, option_b, option_c, option_d, correct_answer, explanation, category, parseInt(points) || 20, id);
  res.json(db.prepare('SELECT * FROM quizzes WHERE id = ?').get(id));
});

router.delete('/quizzes/:id', (req, res) => {
  db.prepare('DELETE FROM quizzes WHERE id = ?').run(parseInt(req.params.id));
  res.json({ success: true });
});

// ── COMPENSATION OPTIONS ───────────────────────────────────
router.get('/compensation-options', (req, res) => {
  res.json(db.prepare('SELECT * FROM compensation_options ORDER BY sort_order').all());
});

router.put('/compensation-options/:id', (req, res) => {
  const { name, organization, description, co2_per_unit, cost_per_unit, unit, icon, points_per_unit } = req.body;
  const id = req.params.id;
  db.prepare('UPDATE compensation_options SET name=?, organization=?, description=?, co2_per_unit=?, cost_per_unit=?, unit=?, icon=?, points_per_unit=? WHERE id=?')
    .run(name, organization, description, parseFloat(co2_per_unit), parseFloat(cost_per_unit), unit, icon, parseInt(points_per_unit), id);
  res.json(db.prepare('SELECT * FROM compensation_options WHERE id = ?').get(id));
});

module.exports = router;
