const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// ── Rate limiter: max 30 /calculate requests per minute per IP ───────────────
const _rateLimits = new Map();
function checkRateLimit(req, res, next) {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const rec = _rateLimits.get(ip);
  if (!rec || now > rec.resetAt) {
    _rateLimits.set(ip, { count: 1, resetAt: now + 60_000 });
    return next();
  }
  rec.count++;
  if (rec.count > 30) {
    return res.status(429).json({ error: 'Demasiadas peticiones. Espera un momento e intenta de nuevo.' });
  }
  next();
}

// CO2 emission factors
const FLIGHT_FACTORS = {
  short: 0.255,   // < 1500 km
  medium: 0.195,  // 1500-4000 km
  long: 0.147,    // > 4000 km
};

const SEA_FACTORS = {
  'bote_buceo': 12.5,
  'lancha': 8.5,
  'ferry': 0.19,
  'none': 0,
};

const LAND_FACTORS = {
  'bus': 0.089,
  'van': 0.158,
  'taxi': 0.171,
  'suv': 0.209,
  'none': 0,
};

function getFlightFactor(distanceKm) {
  if (distanceKm < 1500) return FLIGHT_FACTORS.short;
  if (distanceKm < 4000) return FLIGHT_FACTORS.medium;
  return FLIGHT_FACTORS.long;
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Resolves an airport IATA code or city name to { lat, lng }. Returns null if not found. */
function findAirport(q) {
  if (!q) return null;
  const s = String(q).trim();
  return db.prepare(
    `SELECT lat, lng FROM airports
     WHERE UPPER(iata) = UPPER(?) OR LOWER(city) = LOWER(?) LIMIT 1`
  ).get(s, s) ?? null;
}

function updateUserLevel(userId) {
  const user = db.prepare('SELECT points FROM users WHERE id = ?').get(userId);
  let level = 'Plancton';
  if (user.points >= 1000) level = 'Ballena Azul';
  else if (user.points >= 600) level = 'Mantarraya';
  else if (user.points >= 300) level = 'Tortuga Marina';
  else if (user.points >= 100) level = 'Caballito de Mar';
  db.prepare('UPDATE users SET level = ? WHERE id = ?').run(level, userId);
}

function r2(n) { return Math.round(n * 100) / 100; }

// ── Per-leg CO2 helpers (one direction only, no ×2) ──────────────────────────

function calcFlightCO2(waypoints) {
  if (!Array.isArray(waypoints) || waypoints.length < 2) return { co2: 0, distKm: 0 };
  const resolved = waypoints.map(q => findAirport(q));
  if (!resolved.every(a => a !== null)) return { co2: 0, distKm: 0 };
  let co2 = 0, distKm = 0;
  for (let i = 0; i < resolved.length - 1; i++) {
    const d = haversine(resolved[i].lat, resolved[i].lng, resolved[i + 1].lat, resolved[i + 1].lng);
    co2 += d * getFlightFactor(d);
    distKm += d;
  }
  return { co2, distKm };
}

function calcSeaCO2(seaSegs) {
  let co2 = 0;
  for (const seg of (seaSegs || [])) {
    if (!seg.type || seg.type === 'none') continue;
    const factor = SEA_FACTORS[seg.type] || 0;
    co2 += seg.type === 'ferry' ? (seg.km ?? 20) * factor : factor * (seg.hours || 6);
  }
  return co2;
}

function calcLandCO2(landSegs) {
  let co2 = 0;
  for (const seg of (landSegs || [])) {
    if (!seg.type || seg.type === 'none') continue;
    const factor = LAND_FACTORS[seg.type] || 0;
    co2 += ((seg.km != null && seg.km > 0) ? seg.km : 20) * factor;
  }
  return co2;
}

// Public destinations list (used by calculator)
router.get('/destinations', (req, res) => {
  const rows = db.prepare('SELECT name, icon, dive_hours FROM destinations ORDER BY sort_order, name').all();
  res.json(rows);
});

// Airport autocomplete search (public — no auth)
router.get('/airports', (req, res) => {
  const q = (req.query.q || '').trim();
  if (q.length < 2) return res.json([]);
  const rows = db.prepare(`
    SELECT iata, name, city, country, lat, lng,
      CASE
        WHEN UPPER(iata) = UPPER(?) THEN 0
        WHEN LOWER(city) LIKE LOWER(?)  THEN 1
        WHEN LOWER(name) LIKE LOWER(?)  THEN 2
        ELSE 3
      END AS relevance
    FROM airports
    WHERE UPPER(iata) = UPPER(?) OR LOWER(city) LIKE LOWER(?) OR LOWER(name) LIKE LOWER(?)
    ORDER BY relevance, city
    LIMIT 10
  `).all(q, `${q}%`, `${q}%`, q, `%${q}%`, `%${q}%`);
  const seen = new Set();
  res.json(rows.filter(r => { if (seen.has(r.iata)) return false; seen.add(r.iata); return true; }));
});

// Calculate carbon footprint
router.post('/calculate', authenticateToken, checkRateLimit, (req, res) => {
  try {
    const {
      origin, destination,
      passengers = 1,
      expedition_id = null,
      // New format: separate outbound and return legs
      outbound: rawOutbound,
      return_trip: rawReturn,
      // Legacy format (backward compat — treated as outbound + same return)
      route_waypoints: legacyWaypoints = null,
      sea_segments: legacySeaSegs,
      land_segments: legacyLandSegs,
      transport_sea = 'bote_buceo',
      transport_land = 'van',
      sea_hours = 6,
    } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origen y destino son requeridos' });
    }

    // Normalize to outbound / return structure
    let outboundData, returnData;
    if (rawOutbound) {
      outboundData = rawOutbound;
      returnData = rawReturn || { same_as_outbound: true };
    } else {
      // Legacy: single set of segments → treat as outbound, mirror for return
      outboundData = {
        route_waypoints: legacyWaypoints,
        sea_segments: legacySeaSegs || [{ type: transport_sea, hours: sea_hours }],
        land_segments: legacyLandSegs || [{ type: transport_land, km: null }],
      };
      returnData = { same_as_outbound: true };
    }

    const pax = Math.max(1, passengers);

    // ── Outbound leg ────────────────────────────────────────
    const obFlight = calcFlightCO2(outboundData.route_waypoints);
    const obSea    = calcSeaCO2(outboundData.sea_segments) / pax;
    const obLand   = calcLandCO2(outboundData.land_segments) / pax;
    const obTotal  = obFlight.co2 + obSea + obLand;

    // ── Return leg ──────────────────────────────────────────
    let retFlightCO2, retSea, retLand;
    if (returnData.same_as_outbound) {
      retFlightCO2 = obFlight.co2;
      retSea       = obSea;
      retLand      = obLand;
    } else {
      const rf = calcFlightCO2(returnData.route_waypoints);
      retFlightCO2 = rf.co2;
      retSea  = calcSeaCO2(returnData.sea_segments) / pax;
      retLand = calcLandCO2(returnData.land_segments) / pax;
    }
    const retTotal = retFlightCO2 + retSea + retLand;

    // ── Grand totals ────────────────────────────────────────
    const co2Flight = obFlight.co2 + retFlightCO2;
    const co2Sea    = obSea + retSea;
    const co2Land   = obLand + retLand;
    const co2Total  = co2Flight + co2Sea + co2Land;
    const flightDistKm = Math.round(obFlight.distKm);

    // Validate expedition_id
    let validExpeditionId = null;
    if (expedition_id) {
      const today = new Date().toISOString().split('T')[0];
      const exp = db.prepare('SELECT id FROM expeditions WHERE id = ? AND end_date >= ?').get(expedition_id, today);
      if (exp) {
        const isMember = db.prepare('SELECT COUNT(*) as count FROM expedition_members WHERE expedition_id = ? AND user_id = ?').get(expedition_id, req.user.id);
        if (isMember.count > 0) validExpeditionId = expedition_id;
      }
    }

    // Store outbound segments for audit trail
    const transportSeaStr  = JSON.stringify((outboundData.sea_segments  || []).filter(s => s.type && s.type !== 'none'));
    const transportLandStr = JSON.stringify((outboundData.land_segments || []).filter(s => s.type && s.type !== 'none'));

    // Save trip
    const result = db.prepare(`
      INSERT INTO trips (user_id, origin, destination, transport_flight, transport_sea, transport_land,
        co2_flight, co2_sea, co2_land, co2_total, passengers, expedition_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id, origin, destination, 'economica', transportSeaStr, transportLandStr,
      r2(co2Flight), r2(co2Sea), r2(co2Land), r2(co2Total),
      passengers, validExpeditionId
    );

    // Update user stats
    db.prepare(`
      UPDATE users SET
        total_co2   = total_co2 + ?,
        trips_count = trips_count + 1
      WHERE id = ?
    `).run(r2(co2Total), req.user.id);

    // Award points for calculating (10 pts per trip)
    db.prepare('UPDATE users SET points = points + 10 WHERE id = ?').run(req.user.id);
    updateUserLevel(req.user.id);

    // Check mission: Buceador Consciente (5 trips)
    let missionCompleted = null;
    const tripsCount = db.prepare('SELECT trips_count FROM users WHERE id = ?').get(req.user.id);
    if (tripsCount.trips_count >= 5) {
      const mission = db.prepare('SELECT id, points, name FROM missions WHERE name = ?').get('Buceador Consciente');
      if (mission) {
        const r = db.prepare('INSERT OR IGNORE INTO user_missions (user_id, mission_id) VALUES (?, ?)').run(req.user.id, mission.id);
        if (r.changes > 0) {
          db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(mission.points, req.user.id);
          updateUserLevel(req.user.id);
          missionCompleted = { name: mission.name, points: mission.points };
        }
      }
    }

    res.json({
      trip_id: result.lastInsertRowid,
      origin,
      destination,
      flight_distance_km: flightDistKm,
      route_waypoints: outboundData.route_waypoints || null,
      return_same_as_outbound: returnData.same_as_outbound,
      co2: {
        flight: r2(co2Flight),
        sea:    r2(co2Sea),
        land:   r2(co2Land),
        total:  r2(co2Total),
        outbound: { flight: r2(obFlight.co2), sea: r2(obSea), land: r2(obLand),    total: r2(obTotal)  },
        return:   { flight: r2(retFlightCO2), sea: r2(retSea), land: r2(retLand),   total: r2(retTotal) },
      },
      breakdown_pct: {
        flight: co2Total > 0 ? Math.round((co2Flight / co2Total) * 100) : 0,
        sea:    co2Total > 0 ? Math.round((co2Sea    / co2Total) * 100) : 0,
        land:   co2Total > 0 ? Math.round((co2Land   / co2Total) * 100) : 0,
      },
      points_earned: 10,
      expedition_id: validExpeditionId,
      mission_completed: missionCompleted,
    });
  } catch (error) {
    console.error('Calculate error:', error);
    res.status(500).json({ error: `Error calculando la huella de carbono: ${error.message}` });
  }
});

// Get user trips
router.get('/', authenticateToken, (req, res) => {
  const trips = db.prepare('SELECT * FROM trips WHERE user_id = ? ORDER BY created_at DESC LIMIT 10').all(req.user.id);
  res.json(trips);
});

// Delete a trip and revert user stats
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const tripId = parseInt(req.params.id);
    const trip = db.prepare('SELECT * FROM trips WHERE id = ? AND user_id = ?').get(tripId, req.user.id);

    if (!trip) {
      return res.status(404).json({ error: 'Viaje no encontrado' });
    }

    db.prepare('DELETE FROM trips WHERE id = ?').run(tripId);

    db.prepare(`
      UPDATE users SET
        total_co2   = MAX(0, total_co2 - ?),
        trips_count = MAX(0, trips_count - 1),
        points      = MAX(0, points - 10)
      WHERE id = ?
    `).run(trip.co2_total, req.user.id);

    updateUserLevel(req.user.id);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete trip error:', error);
    res.status(500).json({ error: 'Error eliminando el viaje' });
  }
});

module.exports = router;
