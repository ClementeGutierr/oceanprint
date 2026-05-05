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
      is_volunteering INTEGER DEFAULT 0,
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

  // Destinations catalogue
  db.exec(`
    CREATE TABLE IF NOT EXISTS destinations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      country TEXT NOT NULL DEFAULT '',
      icon TEXT NOT NULL DEFAULT 'wave',
      dive_hours REAL DEFAULT 6,
      sort_order INTEGER DEFAULT 0
    )
  `);

  // Origins catalogue
  db.exec(`
    CREATE TABLE IF NOT EXISTS origins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      country TEXT NOT NULL DEFAULT '',
      sort_order INTEGER DEFAULT 0
    )
  `);

  // Stopover routes (legacy, kept for reference)
  db.exec(`
    CREATE TABLE IF NOT EXISTS route_stopovers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      stopover_city TEXT NOT NULL,
      dist_origin_stopover REAL NOT NULL,
      dist_stopover_dest REAL NOT NULL,
      UNIQUE(origin, destination, stopover_city)
    )
  `);

  // Airports table for autocomplete and Haversine distance calculations
  db.exec(`
    CREATE TABLE IF NOT EXISTS airports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      iata TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      country TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL
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
    "ALTER TABLE expeditions ADD COLUMN sea_transports TEXT",
    "ALTER TABLE expeditions ADD COLUMN land_transports TEXT",
    "ALTER TABLE expeditions ADD COLUMN fixed_passengers INTEGER",
    "ALTER TABLE destinations ADD COLUMN lat REAL",
    "ALTER TABLE destinations ADD COLUMN lng REAL",
    "ALTER TABLE destinations DROP COLUMN local_km",
    "ALTER TABLE compensation_options ADD COLUMN is_volunteering INTEGER DEFAULT 0",
    // Privacy fields — display_name shown publicly, hide_email defaults true
    "ALTER TABLE users ADD COLUMN display_name TEXT",
    "ALTER TABLE users ADD COLUMN hide_email INTEGER DEFAULT 1",
  ]) {
    try { db.exec(sql) } catch {}
  }

  // Dynamics tables (kahoot, acción verificada, bonus)
  db.exec(`
    CREATE TABLE IF NOT EXISTS dynamics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      expedition_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      points INTEGER NOT NULL DEFAULT 0,
      type TEXT NOT NULL DEFAULT 'bonus',
      date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (expedition_id) REFERENCES expeditions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_dynamics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      dynamic_id INTEGER NOT NULL,
      points_awarded INTEGER NOT NULL DEFAULT 0,
      participated INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (dynamic_id) REFERENCES dynamics(id) ON DELETE CASCADE,
      UNIQUE(user_id, dynamic_id)
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
    ['Protector Reef-Safe', 'Usa solo protector solar libre de oxibenzona y octinoxato en tus buceos', 'coral',    50, 'conservacion', 1],
    ['Cero Plástico', 'Completa un viaje sin usar plásticos de un solo uso',                             'wave',     75, 'sostenibilidad', 2],
    ['Avistamiento Registrado', 'Registra y reporta un avistamiento de fauna marina en iNaturalist',     'fish',     60, 'ciencia', 3],
    ['Embajador Digital', 'Comparte tu compensación en WhatsApp o descarga la tarjeta para Instagram',   'dolphin', 100, 'social', null],
    ['Ritual del Océano', 'Completa el quiz sobre fauna marina con 100% de aciertos',                    'whale',    80, 'educacion', 4],
    ['Compensador Activo', 'Compensa al menos 1 tonelada de CO2 en una sola acción',                     'plankton',120, 'compensacion', null],
    ['Guardián de Manglares', 'Participa en la plantación de manglares con Fundación Mar Viva',          'island',  150, 'voluntariado', 5],
    ['Buceador Consciente', 'Calcula la huella de carbono de 5 viajes de buceo',                         'turtle',   90, 'calculadora', null],
    ['Limpieza Oceánica', 'Participa en una limpieza de playa con Ocean Conservancy',                    'crab',    110, 'voluntariado', 6],
    ['Maestro del Coral', 'Completa todos los quizzes sobre coral y arrecifes',                          'seahorse',200, 'educacion', 7],
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

  // Seed airports (idempotent)
  const airportCount = db.prepare('SELECT COUNT(*) as count FROM airports').get();
  if (airportCount.count === 0) {
    const insA = db.prepare('INSERT OR IGNORE INTO airports (iata, name, city, country, lat, lng) VALUES (?, ?, ?, ?, ?, ?)');
    // Colombia
    insA.run('BOG','El Dorado','Bogotá','Colombia',4.7016,-74.1469);
    insA.run('MDE','José María Córdova','Medellín','Colombia',6.1645,-75.4235);
    insA.run('CLO','Alfonso Bonilla Aragón','Cali','Colombia',3.5432,-76.3816);
    insA.run('CTG','Rafael Núñez','Cartagena','Colombia',10.4424,-75.5130);
    insA.run('BAQ','Ernesto Cortissoz','Barranquilla','Colombia',10.8896,-74.7808);
    insA.run('PVA','El Embrujo','Providencia','Colombia',13.3569,-81.3583);
    insA.run('ADZ','Gustavo Rojas Pinilla','San Andrés','Colombia',12.5836,-81.7112);
    insA.run('BUN','Gerardo Tobar','Buenaventura','Colombia',3.8196,-76.9898);
    // Ecuador
    insA.run('UIO','Mariscal Sucre','Quito','Ecuador',-0.1292,-78.3575);
    insA.run('GYE','José J. de Olmedo','Guayaquil','Ecuador',-2.1574,-79.8836);
    insA.run('GPS','Seymour','Galápagos','Ecuador',-0.4536,-90.2659);
    // Perú
    insA.run('LIM','Jorge Chávez','Lima','Perú',-12.0219,-77.1143);
    insA.run('CUZ','Alejandro Velasco','Cusco','Perú',-13.5357,-71.9388);
    insA.run('AQP','Rodríguez Ballón','Arequipa','Perú',-16.3411,-71.5831);
    // Chile
    insA.run('SCL','Arturo Merino Benítez','Santiago','Chile',-33.3930,-70.7858);
    insA.run('ANF','Cerro Moreno','Antofagasta','Chile',-23.4444,-70.4451);
    // Argentina
    insA.run('EZE','Ministro Pistarini','Buenos Aires','Argentina',-34.8222,-58.5358);
    insA.run('AEP','Jorge Newbery','Buenos Aires (Aeroparque)','Argentina',-34.5592,-58.4156);
    // Brasil
    insA.run('GRU','Guarulhos','São Paulo','Brazil',-23.4356,-46.4731);
    insA.run('GIG','Galeão','Río de Janeiro','Brazil',-22.8099,-43.2505);
    insA.run('BSB','Brasília','Brasília','Brazil',-15.8711,-47.9186);
    insA.run('FOR','Pinto Martins','Fortaleza','Brazil',-3.7763,-38.5326);
    // Venezuela
    insA.run('CCS','Simón Bolívar','Caracas','Venezuela',10.6012,-66.9913);
    // Panamá
    insA.run('PTY','Tocumen','Panamá','Panamá',9.0714,-79.3835);
    // Costa Rica
    insA.run('SJO','Juan Santamaría','San José','Costa Rica',9.9936,-84.2089);
    // México
    insA.run('MEX','Benito Juárez','Ciudad de México','México',19.4363,-99.0721);
    insA.run('GDL','Miguel Hidalgo','Guadalajara','México',20.5218,-103.3111);
    insA.run('CUN','Cancún','Cancún','México',21.0365,-86.8771);
    insA.run('MTY','Mariano Escobedo','Monterrey','México',25.7785,-100.1066);
    insA.run('ZLO','Playa de Oro','Manzanillo','México',19.1448,-104.5588);
    insA.run('SJD','Los Cabos','Los Cabos','México',23.1518,-109.7211);
    insA.run('MZT','General Rafael Buelna','Mazatlán','México',23.1614,-106.2661);
    // Centroamérica
    insA.run('GUA','La Aurora','Guatemala City','Guatemala',14.5833,-90.5275);
    insA.run('SAL','Monseñor Romero','San Salvador','El Salvador',13.4409,-89.0557);
    insA.run('TGU','Toncontín','Tegucigalpa','Honduras',14.0608,-87.2172);
    insA.run('MGA','Augusto Sandino','Managua','Nicaragua',12.1415,-86.1682);
    insA.run('BZE','Philip Goldson','Belize City','Belize',17.5391,-88.3082);
    // Caribe
    insA.run('HAV','José Martí','La Habana','Cuba',22.9892,-82.4091);
    insA.run('SDQ','Las Américas','Santo Domingo','República Dominicana',18.4297,-69.6689);
    insA.run('SJU','Luis Muñoz Marín','San Juan','Puerto Rico',18.4394,-66.0018);
    insA.run('PUJ','Punta Cana','Punta Cana','República Dominicana',18.5674,-68.3634);
    insA.run('NAS','Lynden Pindling','Nassau','Bahamas',25.0388,-77.4663);
    insA.run('KIN','Norman Manley','Kingston','Jamaica',17.9357,-76.7875);
    // USA
    insA.run('MIA','Miami International','Miami','USA',25.7959,-80.2870);
    insA.run('JFK','John F Kennedy','New York','USA',40.6413,-73.7781);
    insA.run('EWR','Newark Liberty','Newark','USA',40.6895,-74.1745);
    insA.run('LAX','Los Angeles International','Los Angeles','USA',33.9425,-118.4081);
    insA.run('IAH','George Bush Intercontinental','Houston','USA',29.9902,-95.3368);
    insA.run('ATL','Hartsfield-Jackson','Atlanta','USA',33.6407,-84.4277);
    insA.run('DFW','Dallas Fort Worth','Dallas','USA',32.8998,-97.0403);
    insA.run('ORD','O\'Hare International','Chicago','USA',41.9742,-87.9073);
    insA.run('SFO','San Francisco International','San Francisco','USA',37.6213,-122.3790);
    insA.run('IAD','Washington Dulles','Washington DC','USA',38.9531,-77.4565);
    insA.run('BOS','Logan International','Boston','USA',42.3656,-71.0096);
    insA.run('LAS','Harry Reid International','Las Vegas','USA',36.0840,-115.1537);
    insA.run('DEN','Denver International','Denver','USA',39.8561,-104.6737);
    insA.run('SEA','Seattle-Tacoma','Seattle','USA',47.4502,-122.3088);
    insA.run('PHX','Phoenix Sky Harbor','Phoenix','USA',33.4373,-112.0078);
    insA.run('FLL','Fort Lauderdale','Fort Lauderdale','USA',26.0726,-80.1527);
    insA.run('MCO','Orlando International','Orlando','USA',28.4294,-81.3089);
    insA.run('MSY','Louis Armstrong','Nueva Orleans','USA',29.9934,-90.2580);
    insA.run('CLT','Charlotte Douglas','Charlotte','USA',35.2140,-80.9431);
    insA.run('DTW','Detroit Metropolitan','Detroit','USA',42.2124,-83.3534);
    // Canadá
    insA.run('YYZ','Pearson International','Toronto','Canadá',43.6772,-79.6306);
    insA.run('YVR','Vancouver International','Vancouver','Canadá',49.1947,-123.1839);
    insA.run('YUL','Trudeau International','Montreal','Canadá',45.4706,-73.7408);
    insA.run('YYC','Calgary International','Calgary','Canadá',51.1139,-114.0097);
    // Europa
    insA.run('LHR','Heathrow','Londres','Reino Unido',51.4700,-0.4543);
    insA.run('LGW','Gatwick','Londres (Gatwick)','Reino Unido',51.1537,-0.1821);
    insA.run('MAD','Adolfo Suárez Barajas','Madrid','España',40.4936,-3.5670);
    insA.run('BCN','El Prat','Barcelona','España',41.2971,2.0785);
    insA.run('CDG','Charles de Gaulle','París','Francia',49.0097,2.5479);
    insA.run('FRA','Frankfurt am Main','Frankfurt','Alemania',50.0379,8.5622);
    insA.run('AMS','Schiphol','Ámsterdam','Países Bajos',52.3105,4.7683);
    insA.run('FCO','Fiumicino','Roma','Italia',41.8003,12.2389);
    insA.run('LIS','Humberto Delgado','Lisboa','Portugal',38.7756,-9.1354);
    insA.run('ZRH','Zúrich','Zúrich','Suiza',47.4647,8.5492);
    insA.run('MUC','Franz Josef Strauss','Múnich','Alemania',48.3537,11.7861);
    insA.run('CPH','Kastrup','Copenhague','Dinamarca',55.6180,12.6560);
    insA.run('VIE','Schwechat','Viena','Austria',48.1103,16.5697);
    insA.run('BRU','Bruselas','Bruselas','Bélgica',50.9010,4.4844);
    insA.run('HEL','Helsinki-Vantaa','Helsinki','Finlandia',60.3172,24.9633);
    // Oriente Medio
    insA.run('DXB','Dubai International','Dubái','EAU',25.2532,55.3657);
    insA.run('DOH','Hamad International','Doha','Catar',25.2731,51.6082);
    insA.run('IST','Istanbul Airport','Estambul','Turquía',41.2753,28.7519);
    insA.run('AUH','Abu Dhabi International','Abu Dabi','EAU',24.4330,54.6511);
    insA.run('AMM','Queen Alia','Amán','Jordania',31.7226,35.9932);
    // África
    insA.run('JNB','OR Tambo','Johannesburgo','Sudáfrica',-26.1334,28.2424);
    insA.run('NBO','Jomo Kenyatta','Nairobi','Kenia',-1.3192,36.9275);
    insA.run('CPT','Cape Town','Ciudad del Cabo','Sudáfrica',-33.9715,18.6021);
    insA.run('CAI','Cairo International','El Cairo','Egipto',30.1219,31.4056);
    // Asia
    insA.run('SIN','Changi','Singapur','Singapur',1.3644,103.9915);
    insA.run('BKK','Suvarnabhumi','Bangkok','Tailandia',13.6900,100.7501);
    insA.run('NRT','Narita','Tokio','Japón',35.7720,140.3929);
    insA.run('HND','Haneda','Tokio (Haneda)','Japón',35.5493,139.7798);
    insA.run('ICN','Incheon','Seúl','Corea del Sur',37.4602,126.4407);
    insA.run('HKG','Hong Kong International','Hong Kong','China',22.3080,113.9185);
    insA.run('KUL','KLIA','Kuala Lumpur','Malasia',2.7456,101.7072);
    insA.run('CGK','Soekarno-Hatta','Yakarta','Indonesia',-6.1256,106.6559);
    insA.run('DPS','Ngurah Rai','Bali','Indonesia',-8.7481,115.1669);
    insA.run('UPG','Sultan Hasanuddin','Makassar','Indonesia',-5.0617,119.5540);
    insA.run('SOQ','Domine Eduard Osok','Sorong','Indonesia',-0.8936,131.2872);
    insA.run('MNL','Ninoy Aquino','Manila','Filipinas',14.5086,121.0197);
    insA.run('PEK','Capital','Pekín','China',40.0799,116.6031);
    insA.run('PVG','Pudong','Shanghái','China',31.1434,121.8052);
    insA.run('DEL','Indira Gandhi','Nueva Delhi','India',28.5665,77.1031);
    insA.run('BOM','Chhatrapati Shivaji','Bombay','India',19.0896,72.8656);
    // Australia
    insA.run('SYD','Kingsford Smith','Sídney','Australia',-33.9399,151.1753);
    insA.run('MEL','Tullamarine','Melbourne','Australia',-37.6690,144.8410);
    insA.run('BNE','Brisbane Airport','Brisbane','Australia',-27.3842,153.1175);
    // Destinos de buceo virtuales (sin aeropuerto propio)
    insA.run('MLO','Isla Malpelo (virtual)','Isla Malpelo','Colombia',3.9881,-81.5965);
    insA.run('REV','Islas Revillagigedo (virtual)','Islas Revillagigedo','México',18.7944,-110.9756);
    insA.run('COC','Isla del Coco (virtual)','Isla del Coco','Costa Rica',5.5403,-87.0580);
    insA.run('RAJ','Raja Ampat (virtual)','Raja Ampat','Indonesia',-0.5025,130.9819);
  }

  // Extended airports — always run so existing DBs receive new entries (INSERT OR IGNORE = idempotent)
  {
    const insB = db.prepare('INSERT OR IGNORE INTO airports (iata, name, city, country, lat, lng) VALUES (?, ?, ?, ?, ?, ?)');
    // ── Bolivia ──
    insB.run('LPB','El Alto','La Paz','Bolivia',-16.5133,-68.1922);
    insB.run('VVI','Viru Viru','Santa Cruz','Bolivia',-17.6448,-63.1354);
    insB.run('CBB','Jorge Wilstermann','Cochabamba','Bolivia',-17.4211,-66.1771);
    // ── Paraguay ──
    insB.run('ASU','Silvio Pettirossi','Asunción','Paraguay',-25.2400,-57.5196);
    // ── Uruguay ──
    insB.run('MVD','Carrasco','Montevideo','Uruguay',-34.8384,-56.0308);
    // ── Argentina ──
    insB.run('COR','Ingeniero Taravella','Córdoba','Argentina',-31.3236,-64.2082);
    insB.run('MDZ','El Plumerillo','Mendoza','Argentina',-32.8317,-68.7929);
    insB.run('BRC','Teniente Candelaria','Bariloche','Argentina',-41.1512,-71.1578);
    insB.run('IGR','Cataratas del Iguazú','Iguazú','Argentina',-25.7374,-54.4737);
    insB.run('ROS','Islas Malvinas','Rosario','Argentina',-32.9036,-60.7850);
    insB.run('NQN','Presidente Perón','Neuquén','Argentina',-38.9490,-68.1557);
    // ── Brasil ──
    insB.run('CWB','Afonso Pena','Curitiba','Brazil',-25.5285,-49.1758);
    insB.run('POA','Salgado Filho','Porto Alegre','Brazil',-29.9944,-51.1713);
    insB.run('REC','Guararapes','Recife','Brazil',-8.1264,-34.9231);
    insB.run('SSA','Deputado Luís Eduardo','Salvador','Brazil',-12.9086,-38.3225);
    insB.run('MAO','Eduardo Gomes','Manaus','Brazil',-3.0386,-60.0498);
    insB.run('BEL','Val de Cans','Belém','Brazil',-1.3792,-48.4763);
    insB.run('CNF','Tancredo Neves','Belo Horizonte','Brazil',-19.6244,-43.9719);
    insB.run('NAT','Governador Aluízio Alves','Natal','Brazil',-5.9111,-35.2478);
    insB.run('THE','Senador Petrônio Portella','Teresina','Brazil',-5.0599,-42.8235);
    // ── Perú ──
    insB.run('PIU','Capitán FAP Guillermo Concha','Piura','Perú',-5.2075,-80.6163);
    insB.run('IQT','Coronel FAP Francisco Secada','Iquitos','Perú',-3.7847,-73.3088);
    insB.run('TRU','Cap FAP Carlos Martínez','Trujillo','Perú',-8.0814,-79.1088);
    insB.run('CIX','Cap FAP José Quiñones','Chiclayo','Perú',-6.7875,-79.8281);
    // ── Chile ──
    insB.run('IQQ','Diego Aracena','Iquique','Chile',-20.5352,-70.1812);
    insB.run('ARI','Chacalluta','Arica','Chile',-18.3489,-70.3387);
    insB.run('PMC','El Tepual','Puerto Montt','Chile',-41.4389,-73.0940);
    insB.run('CCP','Carriel Sur','Concepción','Chile',-36.7727,-73.0631);
    insB.run('ZCO','La Araucanía','Temuco','Chile',-38.7668,-72.6371);
    // ── Colombia extra ──
    insB.run('CUC','Camilo Daza','Cúcuta','Colombia',7.9276,-72.5115);
    insB.run('PSO','Antonio Nariño','Pasto','Colombia',1.3963,-77.2915);
    insB.run('BGA','Palonegro','Bucaramanga','Colombia',7.1248,-73.1848);
    insB.run('SMR','Simón Bolívar','Santa Marta','Colombia',11.1195,-74.2306);
    insB.run('PEI','Matecaña','Pereira','Colombia',4.8133,-75.7398);
    insB.run('VVC','La Vanguardia','Villavicencio','Colombia',4.1679,-73.6138);
    insB.run('MTR','Los Garzones','Montería','Colombia',8.8237,-75.8258);
    // ── México extra ──
    insB.run('TIJ','General Abelardo L. Rodríguez','Tijuana','México',32.5411,-116.9700);
    insB.run('PVR','Licenciado Gustavo Díaz Ordaz','Puerto Vallarta','México',20.6801,-105.2544);
    insB.run('HUX','Bahías de Huatulco','Huatulco','México',15.7753,-96.2626);
    insB.run('VER','General Heriberto Jara','Veracruz','México',19.1459,-96.1872);
    insB.run('HMO','General Ignacio P. García','Hermosillo','México',29.0958,-111.0479);
    insB.run('MID','Manuel Crescencio Rejón','Mérida','México',20.9370,-89.6577);
    insB.run('OAX','Xoxocotlán','Oaxaca','México',16.9999,-96.7266);
    // ── Honduras ──
    insB.run('SAP','Ramón Villeda Morales','San Pedro Sula','Honduras',15.4526,-87.9236);
    insB.run('RTB','Juan Manuel Gálvez','Roatán','Honduras',16.3174,-86.5230);
    // ── Caribe extra ──
    insB.run('BGI','Grantley Adams','Bridgetown','Barbados',13.0746,-59.4925);
    insB.run('POS','Piarco','Puerto España','Trinidad y Tobago',10.5954,-61.3372);
    insB.run('SXM','Princess Juliana','Sint Maarten','Sint Maarten',18.0410,-63.1088);
    insB.run('CUR','Hato','Willemstad','Curaçao',12.1889,-68.9598);
    insB.run('AUA','Reina Beatrix','Oranjestad','Aruba',12.5014,-70.0152);
    insB.run('PBM','Johan Adolf Pengel','Paramaribo','Surinam',5.4529,-55.1878);
    insB.run('GEO','Cheddi Jagan','Georgetown','Guyana',6.4985,-58.2541);
    insB.run('PTP','Pointe-à-Pitre','Pointe-à-Pitre','Guadalupe',16.2653,-61.5278);
    insB.run('FDF','Aimé Césaire','Fort-de-France','Martinica',14.5910,-60.9953);
    // ── USA extra ──
    insB.run('MSP','Minneapolis-Saint Paul','Minneapolis','USA',44.8848,-93.2223);
    insB.run('PDX','Portland International','Portland','USA',45.5887,-122.5975);
    insB.run('SAN','San Diego International','San Diego','USA',32.7336,-117.1897);
    insB.run('TPA','Tampa International','Tampa','USA',27.9755,-82.5332);
    // ── Europa extra ──
    insB.run('DUB','Dublin','Dublín','Irlanda',53.4213,-6.2701);
    insB.run('EDI','Edinburgh','Edimburgo','Reino Unido',55.9508,-3.3726);
    insB.run('ATH','Eleftherios Venizelos','Atenas','Grecia',37.9364,23.9445);
    insB.run('ARN','Arlanda','Estocolmo','Suecia',59.6519,17.9186);
    insB.run('OSL','Gardermoen','Oslo','Noruega',60.1939,11.1004);
    insB.run('WAW','Chopin','Varsovia','Polonia',52.1657,20.9671);
    insB.run('PRG','Václav Havel','Praga','República Checa',50.1008,14.2600);
    insB.run('BUD','Liszt Ferenc','Budapest','Hungría',47.4298,19.2610);
    insB.run('GVA','Cointrin','Ginebra','Suiza',46.2380,6.1089);
    insB.run('OTP','Henri Coandă','Bucarest','Rumanía',44.5711,26.0850);
    insB.run('SVO','Sheremetyevo','Moscú','Rusia',55.9736,37.4125);
    insB.run('MXP','Malpensa','Milán','Italia',45.6306,8.7281);
    insB.run('NCE','Côte d\'Azur','Niza','Francia',43.6584,7.2159);
    insB.run('AGP','Costa del Sol','Málaga','España',36.6749,-4.4991);
    insB.run('TLV','Ben Gurion','Tel Aviv','Israel',32.0114,34.8867);
    insB.run('DBV','Dubrovnik','Dubrovnik','Croacia',42.5614,18.2682);
    // ── Oriente Medio extra ──
    insB.run('RUH','Rey Khalid','Riad','Arabia Saudí',24.9576,46.6988);
    insB.run('BAH','Bahráin International','Manama','Baréin',26.2708,50.6336);
    // ── África extra ──
    insB.run('CMN','Mohammed V','Casablanca','Marruecos',33.3675,-7.5898);
    insB.run('TUN','Carthage','Túnez','Túnez',36.8510,10.2272);
    insB.run('ADD','Bole','Addis Abeba','Etiopía',8.9779,38.7993);
    insB.run('ACC','Kotoka','Acra','Ghana',5.6052,-0.1668);
    insB.run('DAK','Léopold Sédar Senghor','Dakar','Senegal',14.7397,-17.4902);
    insB.run('LOS','Murtala Muhammed','Lagos','Nigeria',6.5774,3.3212);
    insB.run('DAR','Julius Nyerere','Dar es Salaam','Tanzania',-6.8781,39.2026);
    // ── Asia extra ──
    insB.run('HAN','Noi Bai','Hanói','Vietnam',21.2212,105.8072);
    insB.run('SGN','Tan Son Nhat','Ho Chi Minh','Vietnam',10.8188,106.6520);
    insB.run('RGN','Yangon','Yangón','Myanmar',16.9073,96.1332);
    insB.run('CMB','Bandaranaike','Colombo','Sri Lanka',7.1807,79.8841);
    insB.run('MLE','Velana','Malé','Maldivas',4.1918,73.5290);
    insB.run('CCU','Netaji Subhash Chandra Bose','Calcuta','India',22.6546,88.4467);
    insB.run('MAA','Chennai','Chennai','India',12.9941,80.1709);
    insB.run('HYD','Rajiv Gandhi','Hyderabad','India',17.2313,78.4298);
    insB.run('TPE','Taoyuan','Taipéi','Taiwán',25.0777,121.2322);
    insB.run('CTU','Tianfu','Chengdu','China',30.3127,103.9470);
    insB.run('XIY','Xianyang','Xi\'an','China',34.4471,108.7516);
    insB.run('CAN','Baiyun','Cantón','China',23.3924,113.2988);
    // ── Oceanía / Pacífico ──
    insB.run('AKL','Auckland','Auckland','Nueva Zelanda',-37.0082,174.7917);
    insB.run('CHC','Christchurch','Christchurch','Nueva Zelanda',-43.4894,172.5322);
    insB.run('PPT','Faa\'a','Papeete','Polinesia Francesa',-17.5534,-149.6064);
    insB.run('NOU','Tontouta','Noumea','Nueva Caledonia',-22.0146,166.2129);
    // ── Islas Pacífico relevantes para buceo ──
    insB.run('SEZ','Seychelles International','Victoria','Seychelles',-4.6743,55.5218);
    insB.run('MRU','Sir Seewoosagur Ramgoolam','Mauricio','Mauricio',-20.4302,57.6836);
    // ── Destinos de buceo adicionales ──
    insB.run('CNS','Cairns','Cairns','Australia',-16.8858,145.7553);
    insB.run('POM','Jacksons','Port Moresby','Papua Nueva Guinea',-5.8626,147.2153);
    insB.run('ZNZ','Abeid Amani Karume','Zanzíbar','Tanzania',-6.2199,39.2248);
    insB.run('HRG','Hurghada','Hurghada','Egipto',27.1783,33.7994);
    insB.run('SSH','Sharm el-Sheikh','Sharm El Sheikh','Egipto',27.9773,34.3947);
    insB.run('CZM','Cozumel','Cozumel','México',20.5224,-86.9256);
    insB.run('BON','Flamingo','Bonaire','Caribe Neerlandés',12.1310,-68.2685);
    insB.run('TWU','Tawau','Tawau (Sipadan)','Malasia',4.3202,118.1270);
    insB.run('NAN','Nadi','Nadi (Fiyi)','Fiyi',-17.7554,177.4436);
    insB.run('LBJ','Komodo','Labuan Bajo (Komodo)','Indonesia',-8.4867,119.8894);
  }

  // Seed destinations (idempotent)
  const destCount = db.prepare('SELECT COUNT(*) as count FROM destinations').get();
  if (destCount.count === 0) {
    const insD = db.prepare('INSERT OR IGNORE INTO destinations (name, country, icon, dive_hours, sort_order) VALUES (?, ?, ?, ?, ?)');
    insD.run('Galápagos',           'Ecuador',    'turtle',  6, 1);
    insD.run('Isla Malpelo',        'Colombia',   'shark',   8, 2);
    insD.run('Islas Revillagigedo', 'México',     'whale',   6, 3);
    insD.run('Isla del Coco',       'Costa Rica', 'octopus', 8, 4);
    insD.run('Raja Ampat',          'Indonesia',  'fish',    6, 5);
    insD.run('Providencia',         'Colombia',   'coral',   4, 6);
  }

  // Seed origins (idempotent)
  const origCount = db.prepare('SELECT COUNT(*) as count FROM origins').get();
  if (origCount.count === 0) {
    const insO = db.prepare('INSERT OR IGNORE INTO origins (name, country, sort_order) VALUES (?, ?, ?)');
    insO.run('Bogotá',           'Colombia', 1);
    insO.run('Medellín',         'Colombia', 2);
    insO.run('Cali',             'Colombia', 3);
    insO.run('Miami',            'EEUU',     4);
    insO.run('New York',         'EEUU',     5);
    insO.run('Ciudad de México', 'México',   6);
    insO.run('Lima',             'Perú',     7);
  }

  // Seed stopovers (idempotent)
  const stopCount = db.prepare('SELECT COUNT(*) as count FROM route_stopovers').get();
  if (stopCount.count === 0) {
    const insS = db.prepare('INSERT OR IGNORE INTO route_stopovers (origin, destination, stopover_city, dist_origin_stopover, dist_stopover_dest) VALUES (?, ?, ?, ?, ?)');
    insS.run('Bogotá',           'Galápagos',           'Guayaquil',       780,  1400);
    insS.run('Bogotá',           'Galápagos',           'Quito',           700,  1350);
    insS.run('Medellín',         'Galápagos',           'Bogotá',          380,  2100);
    insS.run('Medellín',         'Galápagos',           'Guayaquil',       900,  1400);
    insS.run('Cali',             'Galápagos',           'Guayaquil',       540,  1400);
    insS.run('Bogotá',           'Isla del Coco',       'San José',       1000,   590);
    insS.run('Bogotá',           'Islas Revillagigedo', 'Ciudad de México', 2800, 800);
    insS.run('New York',         'Raja Ampat',          'Tokyo',          10800, 6300);
    insS.run('Miami',            'Raja Ampat',          'Singapore',      16800, 2900);
    insS.run('Lima',             'Galápagos',           'Guayaquil',        900, 1400);
  }

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
      'INSERT INTO compensation_options (id, name, organization, description, co2_per_unit, cost_per_unit, unit, icon, points_per_unit, is_volunteering, currency, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    insertOpt.run('corales',     'Plantar Corales',     'Fundación Corales de Paz', 'Cada coral plantado captura 0.5 kg CO2/año durante 20+ años en los arrecifes del Caribe', 0.5,  15000, 'coral',      'coral',   25,  0, 'COP', 1);
    insertOpt.run('manglares',   'Plantar Manglares',   'Fundación Mar Viva',       'Los manglares secuestran hasta 4x más carbono que los bosques tropicales. Cada árbol captura 12 kg CO2/año', 12, 25000, 'árbol', 'island',  40,  0, 'COP', 2);
    insertOpt.run('limpieza',    'Limpieza de Playa',   'Ocean Conservancy',        'Patrocina la recolección de residuos plásticos que afectan la vida marina. Cada jornada remueve 50 kg de plástico', 8, 50000, 'jornada', 'wave', 60,  0, 'COP', 3);
    insertOpt.run('voluntariado','Voluntariado Marino', 'Diving Life Foundation',   'Participa activamente en expediciones de monitoreo y restauración de ecosistemas marinos', 20, 0, 'expedición', 'dolphin', 100, 1, 'COP', 4);
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
