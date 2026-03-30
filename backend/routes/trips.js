const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// CO2 emission factors
const FLIGHT_FACTORS = {
  // kg CO2 per km per passenger (economy class, with radiative forcing multiplier 1.9)
  short: 0.255,   // < 1500 km
  medium: 0.195,  // 1500-4000 km
  long: 0.147,    // > 4000 km
};

const SEA_FACTORS = {
  'bote_buceo': 12.5,    // kg CO2 per hour per person (dive boat ~40hp)
  'lancha': 8.5,         // kg CO2 per hour per person (speedboat)
  'ferry': 0.19,         // kg CO2 per km per person (ferry)
  'none': 0,
};

const LAND_FACTORS = {
  'bus': 0.089,    // kg CO2 per km per person
  'van': 0.158,    // kg CO2 per km per person
  'taxi': 0.171,   // kg CO2 per km per person
  'suv': 0.209,    // kg CO2 per km per person
  'none': 0,
};

// Distances in km (origin -> destination, one way)
const DISTANCES = {
  'Bogotá-Galápagos': 2100,
  'Bogotá-Isla Malpelo': 500,
  'Bogotá-Isla del Coco': 1300,
  'Bogotá-Islas Revillagigedo': 3200,
  'Bogotá-Raja Ampat': 18500,
  'Bogotá-Providencia': 780,
  'Medellín-Galápagos': 2300,
  'Medellín-Isla Malpelo': 620,
  'Medellín-Isla del Coco': 1500,
  'Medellín-Islas Revillagigedo': 3400,
  'Medellín-Raja Ampat': 18700,
  'Medellín-Providencia': 900,
  'Cali-Galápagos': 1950,
  'Cali-Isla Malpelo': 380,
  'Cali-Isla del Coco': 1200,
  'Cali-Islas Revillagigedo': 3100,
  'Cali-Raja Ampat': 18300,
  'Cali-Providencia': 1100,
  'Miami-Galápagos': 3800,
  'Miami-Isla Malpelo': 2900,
  'Miami-Isla del Coco': 2600,
  'Miami-Islas Revillagigedo': 2700,
  'Miami-Raja Ampat': 20200,
  'Miami-Providencia': 1200,
  'New York-Galápagos': 4600,
  'New York-Isla Malpelo': 3700,
  'New York-Isla del Coco': 3400,
  'New York-Islas Revillagigedo': 3200,
  'New York-Raja Ampat': 21000,
  'New York-Providencia': 2100,
  'Ciudad de México-Galápagos': 3600,
  'Ciudad de México-Isla Malpelo': 2700,
  'Ciudad de México-Isla del Coco': 2400,
  'Ciudad de México-Islas Revillagigedo': 1200,
  'Ciudad de México-Raja Ampat': 19800,
  'Ciudad de México-Providencia': 2300,
  'Lima-Galápagos': 1580,
  'Lima-Isla Malpelo': 1800,
  'Lima-Isla del Coco': 2100,
  'Lima-Islas Revillagigedo': 4200,
  'Lima-Raja Ampat': 17800,
  'Lima-Providencia': 2400,
};

// Local transport distances from airport/port to destination (km)
const LOCAL_DISTANCES = {
  'Galápagos': 25,
  'Isla Malpelo': 0,
  'Isla del Coco': 0,
  'Islas Revillagigedo': 15,
  'Raja Ampat': 30,
  'Providencia': 20,
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
router.post('/calculate', authenticateToken, (req, res) => {
  try {
    const {
      origin, destination,
      transport_flight = 'economica',
      transport_sea = 'bote_buceo',
      sea_hours = 6,
      transport_land = 'van',
      passengers = 1,
      expedition_id = null,
    } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origen y destino son requeridos' });
    }

    const distanceKey = `${origin}-${destination}`;
    const flightDistance = DISTANCES[distanceKey] || 2000;

    // CO2 flight (round trip)
    const flightFactor = getFlightFactor(flightDistance);
    const co2Flight = flightDistance * 2 * flightFactor;

    // CO2 sea transport
    const seaFactor = SEA_FACTORS[transport_sea] || 0;
    let co2Sea = 0;
    if (transport_sea === 'ferry') {
      co2Sea = (LOCAL_DISTANCES[destination] || 20) * 2 * seaFactor;
    } else {
      co2Sea = seaFactor * (sea_hours || 6);
    }

    // CO2 land transport
    const localDist = LOCAL_DISTANCES[destination] || 20;
    const landFactor = LAND_FACTORS[transport_land] || 0;
    const co2Land = localDist * 2 * landFactor;

    const co2Total = co2Flight + co2Sea + co2Land;

    // Validate expedition_id if provided (must exist and user must be a member)
    let validExpeditionId = null;
    if (expedition_id) {
      const exp = db.prepare(
        'SELECT id FROM expeditions WHERE id = ? AND end_date >= date("now")'
      ).get(expedition_id);
      if (exp) {
        const isMember = db.prepare(
          'SELECT COUNT(*) as count FROM expedition_members WHERE expedition_id = ? AND user_id = ?'
        ).get(expedition_id, req.user.id);
        if (isMember.count > 0) validExpeditionId = expedition_id;
      }
    }

    // Save trip
    const result = db.prepare(`
      INSERT INTO trips (user_id, origin, destination, transport_flight, transport_sea, transport_land,
        co2_flight, co2_sea, co2_land, co2_total, passengers, expedition_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id, origin, destination, transport_flight, transport_sea, transport_land,
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

    // Check mission: Buceador Consciente (5 trips)
    const tripsCount = db.prepare('SELECT trips_count FROM users WHERE id = ?').get(req.user.id);
    if (tripsCount.trips_count >= 5) {
      const mission = db.prepare('SELECT id FROM missions WHERE name = ?').get('Buceador Consciente');
      if (mission) {
        try {
          db.prepare('INSERT OR IGNORE INTO user_missions (user_id, mission_id) VALUES (?, ?)').run(req.user.id, mission.id);
        } catch (e) {}
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

    // Revert stats (floor at 0 to avoid negatives)
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
