const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const PROFILE_FIELDS = 'id, name, email, display_name, hide_email, points, level, total_co2, compensated_co2, trips_count, created_at, avatar, origin_city, bio, instagram, whatsapp, role';

router.get('/', authenticateToken, (req, res) => {
  const user = db.prepare(`SELECT ${PROFILE_FIELDS} FROM users WHERE id = ?`).get(req.user.id);

  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  const completedMissions = db.prepare(`
    SELECT m.name, m.icon, m.points, um.completed_at
    FROM user_missions um
    JOIN missions m ON um.mission_id = m.id
    WHERE um.user_id = ?
    ORDER BY um.completed_at DESC
  `).all(req.user.id);

  const compensations = db.prepare(`
    SELECT type, organization, co2_compensated, points_earned, created_at
    FROM compensations WHERE user_id = ?
    ORDER BY created_at DESC LIMIT 5
  `).all(req.user.id);

  const recentTrips = db.prepare(`
    SELECT id, origin, destination, co2_total, created_at
    FROM trips WHERE user_id = ?
    ORDER BY created_at DESC LIMIT 5
  `).all(req.user.id);

  const levelThresholds = {
    'Plancton':         { min: 0,    max: 100,  next: 'Caballito de Mar' },
    'Caballito de Mar': { min: 100,  max: 300,  next: 'Tortuga Marina'   },
    'Tortuga Marina':   { min: 300,  max: 600,  next: 'Mantarraya'       },
    'Mantarraya':       { min: 600,  max: 1000, next: 'Ballena Azul'     },
    'Ballena Azul':     { min: 1000, max: 1000, next: null               },
  };

  const currentLevel = levelThresholds[user.level] || levelThresholds['Plancton'];
  const levelProgress = currentLevel.max > currentLevel.min
    ? Math.min(100, Math.round(((user.points - currentLevel.min) / (currentLevel.max - currentLevel.min)) * 100))
    : 100;

  const compensationPct = user.total_co2 > 0
    ? Math.min(100, Math.round((user.compensated_co2 / user.total_co2) * 100))
    : 0;

  res.json({
    ...user,
    completed_missions: completedMissions,
    recent_compensations: compensations,
    recent_trips: recentTrips,
    level_progress: levelProgress,
    next_level: currentLevel.next,
    compensation_pct: compensationPct,
    missions_count: completedMissions.length,
  });
});

router.put('/', authenticateToken, (req, res) => {
  const { name, display_name, hide_email, avatar, origin_city, bio, instagram, whatsapp } = req.body;

  // Validation
  if (name !== undefined) {
    const t = String(name).trim();
    if (t.length < 2) return res.status(400).json({ error: 'El nombre debe tener al menos 2 caracteres' });
    if (t.length > 60) return res.status(400).json({ error: 'El nombre no puede superar 60 caracteres' });
  }
  if (display_name !== undefined && display_name !== null && display_name !== '') {
    const t = String(display_name).trim();
    if (t.length < 2) return res.status(400).json({ error: 'El nombre público debe tener al menos 2 caracteres' });
    if (t.length > 60) return res.status(400).json({ error: 'El nombre público no puede superar 60 caracteres' });
  }
  if (bio !== undefined && String(bio).length > 160) {
    return res.status(400).json({ error: 'La bio no puede superar 160 caracteres' });
  }

  const ALLOWED_AVATARS = ['Plancton', 'Caballito de Mar', 'Tortuga Marina', 'Mantarraya', 'Ballena Azul'];
  const fields = {};
  if (name         !== undefined) fields.name         = String(name).trim();
  if (display_name !== undefined) fields.display_name = String(display_name || '').trim().slice(0, 60) || null;
  if (hide_email   !== undefined) fields.hide_email   = hide_email ? 1 : 0;
  if (avatar       !== undefined) fields.avatar       = ALLOWED_AVATARS.includes(avatar) ? avatar : null;
  if (origin_city  !== undefined) fields.origin_city  = String(origin_city).trim().slice(0, 80) || null;
  if (bio          !== undefined) fields.bio          = String(bio).trim().slice(0, 160) || null;
  if (instagram    !== undefined) fields.instagram    = String(instagram).trim().replace(/^@/, '').slice(0, 60) || null;
  if (whatsapp     !== undefined) fields.whatsapp     = String(whatsapp).replace(/[^\d+\s()-]/g, '').trim().slice(0, 20) || null;

  if (Object.keys(fields).length === 0) {
    return res.status(400).json({ error: 'No hay datos para actualizar' });
  }

  const setCols = Object.keys(fields).map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE users SET ${setCols} WHERE id = ?`).run(...Object.values(fields), req.user.id);

  const updated = db.prepare(`SELECT ${PROFILE_FIELDS} FROM users WHERE id = ?`).get(req.user.id);
  res.json(updated);
});

module.exports = router;
