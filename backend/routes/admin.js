const express = require('express');
const multer  = require('multer');
const XLSX    = require('xlsx');
const { db } = require('../database');
const { requireAdmin } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const router = express.Router();
router.use(requireAdmin);

// ── CO2 helpers for expedition trip recalculation ─────────
const _SEA_F = { 'bote_buceo': 12.5, 'lancha': 8.5, 'ferry': 0.19 };
const _LAND_F = { 'bus': 0.089, 'van': 0.158, 'taxi': 0.171, 'suv': 0.209 };
const _LOCAL_D = {
  'Galápagos': 25, 'Isla Malpelo': 0, 'Isla del Coco': 0,
  'Islas Revillagigedo': 15, 'Raja Ampat': 30, 'Providencia': 20,
};

function _updateLevel(userId) {
  const u = db.prepare('SELECT points FROM users WHERE id = ?').get(userId);
  if (!u) return;
  let level = 'Plancton';
  if (u.points >= 1000) level = 'Ballena Azul';
  else if (u.points >= 600) level = 'Mantarraya';
  else if (u.points >= 300) level = 'Tortuga Marina';
  else if (u.points >= 100) level = 'Caballito de Mar';
  db.prepare('UPDATE users SET level = ? WHERE id = ?').run(level, userId);
}

function _calcSea(segs, destination, pax) {
  const localRow = db.prepare('SELECT distancia_local_km FROM emission_routes WHERE destino = ? LIMIT 1').get(destination);
  let co2 = 0;
  for (const seg of segs) {
    if (!seg.type || seg.type === 'none') continue;
    const factor = _SEA_F[seg.type] || 0;
    if (seg.type === 'ferry') {
      const d = localRow?.distancia_local_km ?? _LOCAL_D[destination] ?? 20;
      co2 += d * 2 * factor;
    } else {
      co2 += factor * (seg.hours || 6);
    }
  }
  return co2 / Math.max(1, pax || 1);
}

function _calcLand(segs, destination, pax) {
  let co2 = 0;
  for (const seg of segs) {
    if (!seg.type || seg.type === 'none') continue;
    const factor = _LAND_F[seg.type] || 0;
    const dist = (seg.km != null && seg.km > 0) ? seg.km : (_LOCAL_D[destination] ?? 20);
    co2 += dist * 2 * factor;
  }
  return co2 / Math.max(1, pax || 1);
}

function recalcExpeditionTrips(expeditionId, seaStr, landStr, fixedPax) {
  const trips = db.prepare('SELECT * FROM trips WHERE expedition_id = ?').all(expeditionId);
  if (!trips.length) return null;

  let seaSegs = [], landSegs = [];
  try { if (seaStr) seaSegs = JSON.parse(seaStr); } catch {}
  try { if (landStr) landSegs = JSON.parse(landStr); } catch {}
  const pax = fixedPax || 1;

  let oldSum = 0, newSum = 0;
  const updates = [];
  for (const trip of trips) {
    const newSea  = Math.round(_calcSea(seaSegs, trip.destination, pax) * 100) / 100;
    const newLand = Math.round(_calcLand(landSegs, trip.destination, pax) * 100) / 100;
    const newTotal = Math.round((trip.co2_flight + newSea + newLand) * 100) / 100;
    oldSum += trip.co2_total;
    newSum += newTotal;
    updates.push({ trip, newSea, newLand, newTotal, delta: newTotal - trip.co2_total });
  }

  db.transaction(() => {
    for (const { trip, newSea, newLand, newTotal, delta } of updates) {
      db.prepare('UPDATE trips SET co2_sea=?, co2_land=?, co2_total=? WHERE id=?')
        .run(newSea, newLand, newTotal, trip.id);
      db.prepare('UPDATE users SET total_co2 = MAX(0, total_co2 + ?) WHERE id = ?')
        .run(delta, trip.user_id);
    }
    const uids = [...new Set(updates.map(u => u.trip.user_id))];
    for (const uid of uids) _updateLevel(uid);
  })();

  const n = updates.length;
  return {
    trips_recalculated: n,
    old_avg_co2: n ? Math.round(oldSum / n * 10) / 10 : 0,
    new_avg_co2: n ? Math.round(newSum / n * 10) / 10 : 0,
  };
}

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
  const { name, destination, start_date, end_date, invite_code, prize_description = '', sea_transports = null, land_transports = null, fixed_passengers = null } = req.body;
  if (!name || !destination || !start_date || !end_date || !invite_code)
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  if (start_date && end_date && start_date >= end_date)
    return res.status(400).json({ error: 'La fecha de inicio debe ser anterior a la fecha de fin' });
  try {
    const r = db.prepare(
      'INSERT INTO expeditions (name, destination, start_date, end_date, invite_code, prize_description, sea_transports, land_transports, fixed_passengers) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(name, destination, start_date, end_date, invite_code.toUpperCase().trim(), prize_description, sea_transports || null, land_transports || null, fixed_passengers || null);
    res.status(201).json(db.prepare('SELECT * FROM expeditions WHERE id = ?').get(r.lastInsertRowid));
  } catch (e) {
    if (e.message?.includes('UNIQUE')) return res.status(400).json({ error: 'El código de invitación ya existe' });
    res.status(500).json({ error: 'Error creando expedición' });
  }
});

router.put('/expeditions/:id', (req, res) => {
  const { name, destination, start_date, end_date, invite_code, prize_description = '',
          sea_transports = null, land_transports = null, fixed_passengers = null,
          recalculate = false } = req.body;
  const id = parseInt(req.params.id);
  if (start_date && end_date && start_date >= end_date)
    return res.status(400).json({ error: 'La fecha de inicio debe ser anterior a la fecha de fin' });
  try {
    db.prepare('UPDATE expeditions SET name=?, destination=?, start_date=?, end_date=?, invite_code=?, prize_description=?, sea_transports=?, land_transports=?, fixed_passengers=? WHERE id=?')
      .run(name, destination, start_date, end_date, invite_code?.toUpperCase().trim(), prize_description, sea_transports || null, land_transports || null, fixed_passengers || null, id);
    const updated = db.prepare('SELECT * FROM expeditions WHERE id = ?').get(id);
    let recalc_summary = null;
    if (recalculate) {
      recalc_summary = recalcExpeditionTrips(id, sea_transports, land_transports, fixed_passengers);
    }
    res.json({ ...updated, recalc_summary });
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

// ── DESTINATIONS ──────────────────────────────────────────
router.get('/destinations', (req, res) => {
  res.json(db.prepare('SELECT * FROM destinations ORDER BY sort_order, name').all());
});

router.post('/destinations', (req, res) => {
  const { name, country = '', icon = '🌊', dive_hours = 6, sort_order = 0 } = req.body;
  if (!name) return res.status(400).json({ error: 'Nombre requerido' });
  try {
    const r = db.prepare('INSERT INTO destinations (name, country, icon, dive_hours, sort_order) VALUES (?, ?, ?, ?, ?)')
      .run(name, country, icon, parseFloat(dive_hours) || 6, parseInt(sort_order) || 0);
    res.status(201).json(db.prepare('SELECT * FROM destinations WHERE id = ?').get(r.lastInsertRowid));
  } catch (e) {
    if (e.message?.includes('UNIQUE')) return res.status(400).json({ error: 'El destino ya existe' });
    res.status(500).json({ error: 'Error creando destino' });
  }
});

router.put('/destinations/:id', (req, res) => {
  const { name, country = '', icon = '🌊', dive_hours = 6, sort_order = 0 } = req.body;
  const id = parseInt(req.params.id);
  try {
    db.prepare('UPDATE destinations SET name=?, country=?, icon=?, dive_hours=?, sort_order=? WHERE id=?')
      .run(name, country, icon, parseFloat(dive_hours) || 6, parseInt(sort_order) || 0, id);
    res.json(db.prepare('SELECT * FROM destinations WHERE id = ?').get(id));
  } catch (e) {
    if (e.message?.includes('UNIQUE')) return res.status(400).json({ error: 'El destino ya existe' });
    res.status(500).json({ error: 'Error actualizando destino' });
  }
});

router.delete('/destinations/:id', (req, res) => {
  db.prepare('DELETE FROM destinations WHERE id = ?').run(parseInt(req.params.id));
  res.json({ success: true });
});

// ── ORIGINS ───────────────────────────────────────────────
router.get('/origins', (req, res) => {
  res.json(db.prepare('SELECT * FROM origins ORDER BY sort_order, name').all());
});

router.post('/origins', (req, res) => {
  const { name, country = '', sort_order = 0 } = req.body;
  if (!name) return res.status(400).json({ error: 'Nombre requerido' });
  try {
    const r = db.prepare('INSERT INTO origins (name, country, sort_order) VALUES (?, ?, ?)')
      .run(name, country, parseInt(sort_order) || 0);
    res.status(201).json(db.prepare('SELECT * FROM origins WHERE id = ?').get(r.lastInsertRowid));
  } catch (e) {
    if (e.message?.includes('UNIQUE')) return res.status(400).json({ error: 'El origen ya existe' });
    res.status(500).json({ error: 'Error creando origen' });
  }
});

router.put('/origins/:id', (req, res) => {
  const { name, country = '', sort_order = 0 } = req.body;
  const id = parseInt(req.params.id);
  try {
    db.prepare('UPDATE origins SET name=?, country=?, sort_order=? WHERE id=?')
      .run(name, country, parseInt(sort_order) || 0, id);
    res.json(db.prepare('SELECT * FROM origins WHERE id = ?').get(id));
  } catch (e) {
    if (e.message?.includes('UNIQUE')) return res.status(400).json({ error: 'El origen ya existe' });
    res.status(500).json({ error: 'Error actualizando origen' });
  }
});

router.delete('/origins/:id', (req, res) => {
  db.prepare('DELETE FROM origins WHERE id = ?').run(parseInt(req.params.id));
  res.json({ success: true });
});

// ── STOPOVERS ─────────────────────────────────────────────
router.get('/stopovers', (req, res) => {
  res.json(db.prepare('SELECT * FROM route_stopovers ORDER BY origin, destination, stopover_city').all());
});

router.post('/stopovers', (req, res) => {
  const { origin, destination, stopover_city, dist_origin_stopover, dist_stopover_dest } = req.body;
  if (!origin || !destination || !stopover_city || !dist_origin_stopover || !dist_stopover_dest)
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  try {
    const r = db.prepare('INSERT INTO route_stopovers (origin, destination, stopover_city, dist_origin_stopover, dist_stopover_dest) VALUES (?, ?, ?, ?, ?)')
      .run(origin, destination, stopover_city, parseFloat(dist_origin_stopover), parseFloat(dist_stopover_dest));
    res.status(201).json(db.prepare('SELECT * FROM route_stopovers WHERE id = ?').get(r.lastInsertRowid));
  } catch (e) {
    if (e.message?.includes('UNIQUE')) return res.status(400).json({ error: 'Esta escala ya existe para esa ruta' });
    res.status(500).json({ error: 'Error creando escala' });
  }
});

router.put('/stopovers/:id', (req, res) => {
  const { origin, destination, stopover_city, dist_origin_stopover, dist_stopover_dest } = req.body;
  const id = parseInt(req.params.id);
  try {
    db.prepare('UPDATE route_stopovers SET origin=?, destination=?, stopover_city=?, dist_origin_stopover=?, dist_stopover_dest=? WHERE id=?')
      .run(origin, destination, stopover_city, parseFloat(dist_origin_stopover), parseFloat(dist_stopover_dest), id);
    res.json(db.prepare('SELECT * FROM route_stopovers WHERE id = ?').get(id));
  } catch (e) {
    if (e.message?.includes('UNIQUE')) return res.status(400).json({ error: 'Esta escala ya existe para esa ruta' });
    res.status(500).json({ error: 'Error actualizando escala' });
  }
});

router.delete('/stopovers/:id', (req, res) => {
  db.prepare('DELETE FROM route_stopovers WHERE id = ?').run(parseInt(req.params.id));
  res.json({ success: true });
});

// ── EXCEL IMPORT ──────────────────────────────────────────
router.get('/emission-routes', (req, res) => {
  const routes = db.prepare('SELECT * FROM emission_routes ORDER BY origen, destino').all();
  res.json(routes);
});

router.post('/import-excel', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });

    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });

    const upsert = db.prepare(`
      INSERT INTO emission_routes (origen, destino, distancia_km, distancia_local_km)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(origen, destino) DO UPDATE SET
        distancia_km       = excluded.distancia_km,
        distancia_local_km = excluded.distancia_local_km,
        updated_at         = CURRENT_TIMESTAMP
    `);

    let imported = 0, updated = 0, skipped = 0;
    const errors = [];

    // Column aliases accepted (case-insensitive)
    const COL = {
      origen:             ['origen', 'origin', 'ciudad_origen', 'desde'],
      destino:            ['destino', 'destination', 'ciudad_destino', 'hasta'],
      distancia_km:       ['distancia_km', 'distancia', 'distance_km', 'distance', 'km'],
      distancia_local_km: ['distancia_local_km', 'distancia_local', 'local_km', 'local'],
    };

    function findCol(headers, aliases) {
      return headers.findIndex(h => aliases.includes(String(h).toLowerCase().trim()));
    }

    for (const sheetName of wb.SheetNames) {
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: '' });
      if (rows.length < 2) continue;

      const rawHeaders = rows[0].map(h => String(h).toLowerCase().trim());
      const iOrigen    = findCol(rawHeaders, COL.origen);
      const iDestino   = findCol(rawHeaders, COL.destino);
      const iDist      = findCol(rawHeaders, COL.distancia_km);
      const iLocal     = findCol(rawHeaders, COL.distancia_local_km);

      if (iOrigen === -1 || iDestino === -1 || iDist === -1) {
        errors.push(`Hoja "${sheetName}": faltan columnas obligatorias (origen, destino, distancia_km)`);
        continue;
      }

      const doImport = db.transaction(() => {
        for (let r = 1; r < rows.length; r++) {
          const row = rows[r];
          const origen  = String(row[iOrigen]  || '').trim();
          const destino = String(row[iDestino] || '').trim();
          const distKm  = parseFloat(row[iDist]);
          const localKm = iLocal >= 0 ? parseFloat(row[iLocal] || 0) : 0;

          if (!origen || !destino || isNaN(distKm) || distKm <= 0) { skipped++; continue; }

          const existing = db.prepare('SELECT id FROM emission_routes WHERE origen=? AND destino=?').get(origen, destino);
          upsert.run(origen, destino, distKm, isNaN(localKm) ? 0 : localKm);
          existing ? updated++ : imported++;
        }
      });
      doImport();
    }

    res.json({
      success: true,
      sheets_processed: wb.SheetNames.length,
      imported,
      updated,
      skipped,
      errors,
      total_routes: db.prepare('SELECT COUNT(*) as n FROM emission_routes').get().n,
    });
  } catch (err) {
    console.error('Import error:', err);
    res.status(500).json({ error: 'Error procesando el archivo: ' + err.message });
  }
});

module.exports = router;
