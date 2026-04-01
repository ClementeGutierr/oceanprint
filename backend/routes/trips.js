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

const DISTANCES = {
  'Bogotá-Galápagos': 2100, 'Bogotá-Isla Malpelo': 500, 'Bogotá-Isla del Coco': 1300,
  'Bogotá-Islas Revillagigedo': 3200, 'Bogotá-Raja Ampat': 18500, 'Bogotá-Providencia': 780,
  'Medellín-Galápagos': 2300, 'Medellín-Isla Malpelo': 620, 'Medellín-Isla del Coco': 1500,
  'Medellín-Islas Revillagigedo': 3400, 'Medellín-Raja Ampat': 18700, 'Medellín-Providencia': 900,
  'Cali-Galápagos': 1950, 'Cali-Isla Malpelo': 380, 'Cali-Isla del Coco': 1200,
  'Cali-Islas Revillagigedo': 3100, 'Cali-Raja Ampat': 18300, 'Cali-Providencia': 1100,
  'Miami-Galápagos': 3800, 'Miami-Isla Malpelo': 2900, 'Miami-Isla del Coco': 2600,
  'Miami-Islas Revillagigedo': 2700, 'Miami-Raja Ampat': 20200, 'Miami-Providencia': 1200,
  'New York-Galápagos': 4600, 'New York-Isla Malpelo': 3700, 'New York-Isla del Coco': 3400,
  'New York-Islas Revillagigedo': 3200, 'New York-Raja Ampat': 21000, 'New York-Providencia': 2100,
  'Ciudad de México-Galápagos': 3600, 'Ciudad de México-Isla Malpelo': 2700, 'Ciudad de México-Isla del Coco': 2400,
  'Ciudad de México-Islas Revillagigedo': 1200, 'Ciudad de México-Raja Ampat': 19800, 'Ciudad de México-Providencia': 2300,
  'Lima-Galápagos': 1580, 'Lima-Isla Malpelo': 1800, 'Lima-Isla del Coco': 2100,
  'Lima-Islas Revillagigedo': 4200, 'Lima-Raja Ampat': 17800, 'Lima-Providencia': 2400,
};

const LOCAL_DISTANCES = {
  'Galápagos': 25, 'Isla Malpelo': 0, 'Isla del Coco': 0,
  'Islas Revillagigedo': 15, 'Raja Ampat': 30, 'Providencia': 20,
};

function getFlightFactor(distanceKm) {
  if (distanceKm < 1500) return FLIGHT_FACTORS.short;
  if (distanceKm < 4000) return FLIGHT_FACTORS.medium;
  return FLIGHT_FACTORS.long;
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

// Calculate carbon footprint
router.post('/calculate', authenticateToken, checkRateLimit, (req, res) => {
  try {
    const {
      origin, destination,
      passengers = 1,
      expedition_id = null,
      // Multi-segment format (new)
      sea_segments: rawSeaSegs,
      land_segments: rawLandSegs,
      // Legacy single-transport format (backward compat)
      transport_sea = 'bote_buceo',
      transport_land = 'van',
      sea_hours = 6,
    } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origen y destino son requeridos' });
    }

    // Normalize to segment arrays
    const seaSegments = rawSeaSegs || [{ type: transport_sea, hours: sea_hours }];
    const landSegments = rawLandSegs || [{ type: transport_land, km: null }];

    const distanceKey = `${origin}-${destination}`;
    const dbRoute = db.prepare('SELECT distancia_km, distancia_local_km FROM emission_routes WHERE origen=? AND destino=?').get(origin, destination);
    const flightDistance = dbRoute?.distancia_km ?? DISTANCES[distanceKey] ?? 2000;

    // CO2 flight (round trip)
    const co2Flight = flightDistance * 2 * getFlightFactor(flightDistance);

    // CO2 sea — sum all segments
    let co2Sea = 0;
    for (const seg of seaSegments) {
      if (!seg.type || seg.type === 'none') continue;
      const factor = SEA_FACTORS[seg.type] || 0;
      if (seg.type === 'ferry') {
        const localDist = dbRoute?.distancia_local_km ?? LOCAL_DISTANCES[destination] ?? 20;
        co2Sea += localDist * 2 * factor;
      } else {
        co2Sea += factor * (seg.hours || 6);
      }
    }

    // CO2 land — sum all segments
    let co2Land = 0;
    for (const seg of landSegments) {
      if (!seg.type || seg.type === 'none') continue;
      const factor = LAND_FACTORS[seg.type] || 0;
      const dist = (seg.km != null && seg.km > 0) ? seg.km : (LOCAL_DISTANCES[destination] ?? 20);
      co2Land += dist * 2 * factor;
    }

    const co2Total = co2Flight + co2Sea + co2Land;

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

    // Store transport segments as JSON for audit trail
    const transportSeaStr = JSON.stringify(seaSegments.filter(s => s.type && s.type !== 'none'));
    const transportLandStr = JSON.stringify(landSegments.filter(s => s.type && s.type !== 'none'));

    // Save trip
    const result = db.prepare(`
      INSERT INTO trips (user_id, origin, destination, transport_flight, transport_sea, transport_land,
        co2_flight, co2_sea, co2_land, co2_total, passengers, expedition_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id, origin, destination, 'economica', transportSeaStr, transportLandStr,
      Math.round(co2Flight * 100) / 100,
      Math.round(co2Sea * 100) / 100,
      Math.round(co2Land * 100) / 100,
      Math.round(co2Total * 100) / 100,
      passengers,
      validExpeditionId
    );

    // Update user stats
    db.prepare(`
      UPDATE users SET
        total_co2 = total_co2 + ?,
        trips_count = trips_count + 1
      WHERE id = ?
    `).run(Math.round(co2Total * 100) / 100, req.user.id);

    // Award points for calculating (10 pts per trip)
    db.prepare('UPDATE users SET points = points + 10 WHERE id = ?').run(req.user.id);
    updateUserLevel(req.user.id);

    // Check mission: Buceador Consciente (5 trips) — award points only if newly completed
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
      flight_distance_km: flightDistance,
      co2: {
        flight: Math.round(co2Flight * 100) / 100,
        sea: Math.round(co2Sea * 100) / 100,
        land: Math.round(co2Land * 100) / 100,
        total: Math.round(co2Total * 100) / 100,
      },
      breakdown_pct: {
        flight: co2Total > 0 ? Math.round((co2Flight / co2Total) * 100) : 0,
        sea: co2Total > 0 ? Math.round((co2Sea / co2Total) * 100) : 0,
        land: co2Total > 0 ? Math.round((co2Land / co2Total) * 100) : 0,
      },
      points_earned: 10,
      expedition_id: validExpeditionId,
      mission_completed: missionCompleted,
    });
  } catch (error) {
    console.error('Calculate error:', error);
    res.status(500).json({ error: 'Error calculando la huella de carbono' });
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
