const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const db = new DatabaseSync(path.join(__dirname, 'oceanprint.db'));

// Pragmas
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      points INTEGER DEFAULT 0,
      level TEXT DEFAULT 'Plancton',
      total_co2 REAL DEFAULT 0,
      compensated_co2 REAL DEFAULT 0,
      trips_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );


    CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      transport_flight TEXT,
      transport_sea TEXT,
      transport_land TEXT,
      co2_flight REAL DEFAULT 0,
      co2_sea REAL DEFAULT 0,
      co2_land REAL DEFAULT 0,
      co2_total REAL DEFAULT 0,
      passengers INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS missions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      points INTEGER NOT NULL,
      category TEXT NOT NULL,
      quiz_id INTEGER
    );

    CREATE TABLE IF NOT EXISTS user_missions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      mission_id INTEGER NOT NULL,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (mission_id) REFERENCES missions(id),
      UNIQUE(user_id, mission_id)
    );

    CREATE TABLE IF NOT EXISTS quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT NOT NULL,
      option_d TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      explanation TEXT NOT NULL,
      category TEXT NOT NULL,
      points INTEGER DEFAULT 20
    );

    CREATE TABLE IF NOT EXISTS compensations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      organization TEXT NOT NULL,
      co2_compensated REAL NOT NULL,
      cost REAL NOT NULL,
      points_earned INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS expeditions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      destination TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      invite_code TEXT UNIQUE NOT NULL,
      prize_description TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS expedition_members (
      expedition_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (expedition_id, user_id),
      FOREIGN KEY (expedition_id) REFERENCES expeditions(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS compensation_options (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      organization TEXT NOT NULL,
      description TEXT NOT NULL,
      co2_per_unit REAL NOT NULL,
      cost_per_unit REAL NOT NULL,
      unit TEXT NOT NULL,
      icon TEXT NOT NULL,
      points_per_unit INTEGER NOT NULL,
      currency TEXT DEFAULT 'COP',
      sort_order INTEGER DEFAULT 0
    );
  `);

  // Emission routes table (populated via Excel import)
  db.exec(`
    CREATE TABLE IF NOT EXISTS emission_routes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      origen TEXT NOT NULL,
      destino TEXT NOT NULL,
      distancia_km REAL NOT NULL,
      distancia_local_km REAL DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(origen, destino)
    )
  `);

  // Safe migrations — add columns if they don't exist yet
  for (const sql of [
    "ALTER TABLE users ADD COLUMN avatar TEXT",
    "ALTER TABLE users ADD COLUMN origin_city TEXT",
    "ALTER TABLE users ADD COLUMN bio TEXT",
    "ALTER TABLE users ADD COLUMN instagram TEXT",
    "ALTER TABLE users ADD COLUMN whatsapp TEXT",
    "ALTER TABLE trips ADD COLUMN expedition_id INTEGER REFERENCES expeditions(id)",
    "ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'",
  ]) {
    try { db.exec(sql) } catch {}
  }

  seedData();
}

function seedData() {
  const missionCount = db.prepare('SELECT COUNT(*) as count FROM missions').get();
  if (missionCount.count === 0) {

  const insertMission = db.prepare(
    'INSERT INTO missions (name, description, icon, points, category, quiz_id) VALUES (?, ?, ?, ?, ?, ?)'
  );

  const missions = [
    ['Protector Reef-Safe', 'Usa solo protector solar libre de oxibenzona y octinoxato en tus buceos', '🪸', 50, 'conservacion', 1],
    ['Cero Plástico', 'Completa un viaje sin usar plásticos de un solo uso', '🌊', 75, 'sostenibilidad', 2],
    ['Avistamiento Registrado', 'Registra y reporta un avistamiento de fauna marina en iNaturalist', '🐠', 60, 'ciencia', 3],
    ['Embajador Digital', 'Comparte tu compensación en WhatsApp o descarga la tarjeta para Instagram', '📣', 100, 'social', null],
    ['Ritual del Océano', 'Completa el quiz sobre fauna marina con 100% de aciertos', '🐋', 80, 'educacion', 4],
    ['Compensador Activo', 'Compensa al menos 1 tonelada de CO2 en una sola acción', '🌱', 120, 'compensacion', null],
    ['Guardián de Manglares', 'Participa en la plantación de manglares con Fundación Mar Viva', '🌿', 150, 'voluntariado', 5],
    ['Buceador Consciente', 'Calcula la huella de carbono de 5 viajes de buceo', '🤿', 90, 'calculadora', null],
    ['Limpieza Oceánica', 'Participa en una limpieza de playa con Ocean Conservancy', '♻️', 110, 'voluntariado', 6],
    ['Maestro del Coral', 'Completa todos los quizzes sobre coral y arrecifes', '🐡', 200, 'educacion', 7],
  ];

  for (const mission of missions) {
    insertMission.run(...mission);
  }

  const insertQuiz = db.prepare(
    'INSERT INTO quizzes (question, option_a, option_b, option_c, option_d, correct_answer, explanation, category, points) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );

  const quizzes = [
    ['¿Qué químico en el protector solar daña más los corales?', 'Titanio dióxido', 'Oxibenzona', 'Vitamina E', 'Zinc óxido', 'B', 'La oxibenzona (benzofenona-3) es altamente tóxica para los corales, causa blanqueamiento y daña el ADN de los pólipos.', 'conservacion', 20],
    ['¿Cuántos años tarda una botella de plástico en degradarse en el océano?', '10 años', '50 años', '200 años', '450 años', 'D', 'Una botella de plástico PET tarda aproximadamente 450 años en descomponerse en el océano, fragmentándose en microplásticos.', 'sostenibilidad', 20],
    ['¿Cuál es el pez payaso más conocido y cómo se llama su familia de anémonas preferida?', 'Nemo - Anémona de burbuja', 'Dory - Anémona de alfombra', 'Nemo - Anémona de boca gigante', 'Marlin - Anémona de plumas', 'A', 'El pez payaso (Amphiprion ocellaris) habita principalmente en la anémona de burbuja (Entacmaea quadricolor), con la que tiene una relación simbiótica.', 'fauna', 20],
    ['¿Cuánto CO2 absorben los océanos del total de emisiones globales anuales?', '10%', '20%', '30%', '50%', 'C', 'Los océanos absorben aproximadamente el 30% de las emisiones de CO2 globales, actuando como el mayor sumidero de carbono del planeta.', 'emisiones', 20],
    ['¿Cuál es la profundidad máxima registrada de buceo libre (apnea)?', '150 metros', '214 metros', '253 metros', '300 metros', 'C', 'Herbert Nitsch estableció el récord mundial de apnea en 253.2 metros en 2012 en la modalidad "Sin Límites".', 'buceo', 20],
    ['¿Qué porcentaje de los arrecifes de coral del mundo están en riesgo crítico?', '25%', '50%', '75%', '90%', 'C', 'Según el Global Coral Reef Monitoring Network, más del 75% de los arrecifes de coral mundiales están amenazados por actividades humanas y el cambio climático.', 'conservacion', 20],
    ['¿Cuántos tipos de tortugas marinas existen en el mundo?', '5', '7', '9', '12', 'B', 'Existen 7 especies de tortugas marinas: tortuga verde, carey, laud, cabezona, olivácea, plana y de Kemp. Todas están en algún grado de amenaza.', 'fauna', 20],
    ['¿Cuál es el principal gas de efecto invernadero emitido por los vuelos de larga distancia?', 'Metano (CH4)', 'CO2 y vapor de agua', 'Óxido nitroso (N2O)', 'Ozono (O3)', 'B', 'Los aviones emiten principalmente CO2 y vapor de agua. A alta altitud, el vapor de agua forma contrails que tienen un efecto de calentamiento adicional significativo.', 'emisiones', 20],
    ['¿Qué es el "blanqueamiento de corales"?', 'Una enfermedad causada por bacterias', 'La expulsión de algas simbióticas por estrés térmico', 'Un proceso de reproducción del coral', 'La calcificación excesiva del coral', 'B', 'El blanqueamiento ocurre cuando el coral expulsa las algas zooxantelas (que le dan color y nutrientes) debido al estrés por temperatura. Sin ellas, el coral queda blanco y puede morir.', 'conservacion', 20],
    ['¿Qué destino de buceo alberga el mayor número de especies marinas endémicas de América Latina?', 'Isla Malpelo', 'Islas Galápagos', 'Isla del Coco', 'Providencia', 'B', 'Las Islas Galápagos tienen la mayor concentración de especies endémicas marinas de América Latina, incluyendo la iguana marina, el pingüino de Galápagos y el lobo marino de Galápagos.', 'fauna', 20],
  ];

  for (const quiz of quizzes) {
    insertQuiz.run(...quiz);
  }
  } // end if (missionCount.count === 0)

  // Seed admin user (idempotent)
  const bcrypt = require('bcryptjs');
  const adminExists = db.prepare("SELECT id FROM users WHERE email = ?").get('admin@divinglife.co');
  if (!adminExists) {
    db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)")
      .run('Admin Diving Life', 'admin@divinglife.co', bcrypt.hashSync('divinglife2026', 10), 'admin');
  }

  // Seed compensation options (idempotent)
  const compOptCount = db.prepare('SELECT COUNT(*) as count FROM compensation_options').get();
  if (compOptCount.count === 0) {
    const insertOpt = db.prepare(
      'INSERT INTO compensation_options (id, name, organization, description, co2_per_unit, cost_per_unit, unit, icon, points_per_unit, currency, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    insertOpt.run('corales',    'Plantar Corales',     'Fundación Corales de Paz', 'Cada coral plantado captura 0.5 kg CO2/año durante 20+ años en los arrecifes del Caribe', 0.5,  15000, 'coral',       '🪸', 25,  'COP', 1);
    insertOpt.run('manglares',  'Plantar Manglares',   'Fundación Mar Viva',       'Los manglares secuestran hasta 4x más carbono que los bosques tropicales. Cada árbol captura 12 kg CO2/año', 12, 25000, 'árbol', '🌿', 40, 'COP', 2);
    insertOpt.run('limpieza',   'Limpieza de Playa',   'Ocean Conservancy',        'Patrocina la recolección de residuos plásticos que afectan la vida marina. Cada jornada remueve 50 kg de plástico', 8, 50000, 'jornada', '♻️', 60, 'COP', 3);
    insertOpt.run('voluntariado','Voluntariado Marino', 'Diving Life Foundation',   'Participa activamente en expediciones de monitoreo y restauración de ecosistemas marinos', 20, 0, 'expedición', '🤿', 100, 'COP', 4);
  }

  // Seed demo users for leaderboard (idempotent — uses INSERT OR IGNORE)
  const demoPwd = bcrypt.hashSync('OceanDemo2025!', 8);
  // Demo users use explicit high IDs (9001+) so they never collide with real user IDs
  const insertUser = db.prepare(
    'INSERT OR IGNORE INTO users (id, name, email, password, points, level, total_co2, compensated_co2, trips_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  [
    [9001, 'Diego Ramos',     'diego@demo.oceanprint.co',     demoPwd, 1050, 'Ballena Azul',     2400, 2100, 18],
    [9002, 'Marina García',   'marina@demo.oceanprint.co',    demoPwd,  850, 'Mantarraya',       1850, 1200, 14],
    [9003, 'Andrés Torres',   'andres@demo.oceanprint.co',    demoPwd,  620, 'Mantarraya',        980,  450,  9],
    [9004, 'Valentina Cruz',  'valentina@demo.oceanprint.co', demoPwd,  320, 'Tortuga Marina',    650,  180,  5],
    [9005, 'Camila Vega',     'camila@demo.oceanprint.co',    demoPwd,  180, 'Caballito de Mar',  420,   90,  3],
  ].forEach(u => insertUser.run(...u));

  // Seed demo compensations — must run AFTER demo users exist (idempotent)
  const demoCompCount = db.prepare('SELECT COUNT(*) as count FROM compensations WHERE user_id >= 9001').get();
  if (demoCompCount.count === 0) {
    const insertComp = db.prepare(
      'INSERT INTO compensations (user_id, type, organization, co2_compensated, cost, points_earned, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    // Diego Ramos — Plantar Corales (×2) + Plantar Manglares (×1) → ~2080 kg
    insertComp.run(9001, 'corales',      'Fundación Corales de Paz', 1000, 30000000, 50000, '2026-01-15 09:00:00');
    insertComp.run(9001, 'corales',      'Fundación Corales de Paz',  600, 18000000, 30000, '2026-02-10 11:00:00');
    insertComp.run(9001, 'manglares',    'Fundación Mar Viva',        480,  1000000,  1600, '2026-03-05 10:00:00');
    // Marina García — Limpieza de Playa (×2) → 1200 kg
    insertComp.run(9002, 'limpieza',     'Ocean Conservancy',         800,  5000000,  6000, '2026-01-20 14:00:00');
    insertComp.run(9002, 'limpieza',     'Ocean Conservancy',         400,  2500000,  3000, '2026-02-28 16:00:00');
    // Andrés Torres — Voluntariado Marino (×2) → 460 kg
    insertComp.run(9003, 'voluntariado', 'Diving Life Foundation',    300,        0,  1500, '2026-02-05 08:00:00');
    insertComp.run(9003, 'voluntariado', 'Diving Life Foundation',    160,        0,   800, '2026-03-12 15:00:00');
  }

  // Seed demo expeditions (idempotent)
  const expeditionCount = db.prepare('SELECT COUNT(*) as count FROM expeditions').get();
  if (expeditionCount.count === 0) {
    const insertExp = db.prepare(
      'INSERT INTO expeditions (name, destination, start_date, end_date, invite_code, prize_description) VALUES (?, ?, ?, ?, ?, ?)'
    );

    const malpelo = insertExp.run(
      'Malpelo - Marzo 2026',
      'Isla Malpelo',
      '2026-03-01',
      '2026-03-31',
      'MALPELO-MAR26',
      'Fotos submarinas gratis del viaje con el fotógrafo oficial de Diving Life'
    );

    const galapagos = insertExp.run(
      'Galápagos - Abril 2026',
      'Galápagos',
      '2026-04-01',
      '2026-04-30',
      'GALAP-ABR26',
      '15% de descuento en tu próximo viaje con Diving Life'
    );

    // Add demo users as members of Malpelo expedition
    const insertMember = db.prepare(
      'INSERT OR IGNORE INTO expedition_members (expedition_id, user_id) VALUES (?, ?)'
    );
    [9001, 9002, 9003, 9004, 9005].forEach(uid => {
      insertMember.run(malpelo.lastInsertRowid, uid);
    });

    // Seed demo trips for the Malpelo expedition so the leaderboard has real data
    const insertTrip = db.prepare(
      'INSERT INTO trips (user_id, origin, destination, transport_flight, transport_sea, transport_land, co2_flight, co2_sea, co2_land, co2_total, passengers, expedition_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const expId = malpelo.lastInsertRowid;
    [
      [9001, 'Bogotá',   'Isla Malpelo', 'economica', 'bote_buceo', 'van', 255, 75, 6, 336, 1, expId, '2026-03-05 10:00:00'],
      [9001, 'Bogotá',   'Isla Malpelo', 'economica', 'bote_buceo', 'van', 255, 75, 6, 336, 1, expId, '2026-03-15 10:00:00'],
      [9001, 'Bogotá',   'Isla Malpelo', 'economica', 'bote_buceo', 'van', 255, 75, 6, 336, 1, expId, '2026-03-22 10:00:00'],
      [9002, 'Medellín', 'Isla Malpelo', 'economica', 'bote_buceo', 'van', 290, 75, 7, 372, 1, expId, '2026-03-04 10:00:00'],
      [9002, 'Medellín', 'Isla Malpelo', 'economica', 'bote_buceo', 'van', 290, 75, 7, 372, 1, expId, '2026-03-18 10:00:00'],
      [9003, 'Cali',     'Isla Malpelo', 'economica', 'bote_buceo', 'van', 194, 75, 5, 274, 1, expId, '2026-03-07 10:00:00'],
      [9003, 'Cali',     'Isla Malpelo', 'economica', 'bote_buceo', 'van', 194, 75, 5, 274, 1, expId, '2026-03-20 10:00:00'],
      [9004, 'Bogotá',   'Isla Malpelo', 'economica', 'bote_buceo', 'van', 255, 75, 6, 336, 1, expId, '2026-03-10 10:00:00'],
      [9005, 'Bogotá',   'Isla Malpelo', 'economica', 'lancha',     'van', 255, 51, 6, 312, 1, expId, '2026-03-12 10:00:00'],
    ].forEach(t => insertTrip.run(...t));
  }
}

module.exports = { db, initDatabase };
