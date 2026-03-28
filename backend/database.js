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
  `);

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
    ['Embajador Oceánico', 'Invita a 3 amigos a unirse a OceanPrint', '🌍', 100, 'comunidad', null],
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

  // Seed demo users for leaderboard (idempotent — uses INSERT OR IGNORE)
  const bcrypt = require('bcryptjs');
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
}

module.exports = { db, initDatabase };
