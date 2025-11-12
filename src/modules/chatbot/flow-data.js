// flow-data.js - Datos de paquetes y habitaciones

// ✅ PAQUETES DISPONIBLES
const PAQUETES_DATA = [
  { 
    "id": "deseo", 
    "title": "💝 Paquete Deseo - Habitación decorada + 1 botella"
  },
  { 
    "id": "enamorados", 
    "title": "❤️ Paquete Enamorados - Decoración + 1 botella + 2 refrescos"
  },
  { 
    "id": "premium", 
    "title": "👑 Paquete Premium - Decoración + botella premium + 5 refrescos"
  }
];

// ✅ HABITACIONES DISPONIBLES (base)
const HABITACIONES_BASE = [
  { "id": "master_suite_sencilla", "nombre": "Master Suite Sencilla", "emoji": "🛏️" },
  { "id": "master_suite_jacuzzi", "nombre": "Master Suite Jacuzzi", "emoji": "🛁" },
  { "id": "master_suite_sauna_jacuzzi", "nombre": "Master Suite Sauna & Jacuzzi", "emoji": "♨️" },
  { "id": "master_suite_alberca", "nombre": "Master Suite Alberca", "emoji": "🏊" }
];

// ✅ PRECIOS POR PAQUETE Y HABITACIÓN
const PRECIOS_PAQUETES = {
  "deseo": {
    "master_suite_sencilla": 1350,
    "master_suite_jacuzzi": 1650,
    "master_suite_sauna_jacuzzi": 1940,
    "master_suite_alberca": 2900
  },
  "enamorados": {
    "master_suite_sencilla": 1850,
    "master_suite_jacuzzi": 2200,
    "master_suite_sauna_jacuzzi": 2500,
    "master_suite_alberca": 3500
  },
  "premium": {
    "master_suite_sencilla": 2650,
    "master_suite_jacuzzi": 3000,
    "master_suite_sauna_jacuzzi": 3300,
    "master_suite_alberca": 4300
  }
};

// ✅ HORARIOS DISPONIBLES
const HORAS_DATA = [
  { "id": "06:00", "title": "06:00 AM" },
  { "id": "07:00", "title": "07:00 AM" },
  { "id": "08:00", "title": "08:00 AM" },
  { "id": "09:00", "title": "09:00 AM" },
  { "id": "10:00", "title": "10:00 AM" },
  { "id": "11:00", "title": "11:00 AM" },
  { "id": "12:00", "title": "12:00 PM" },
  { "id": "13:00", "title": "01:00 PM" },
  { "id": "14:00", "title": "02:00 PM" },
  { "id": "15:00", "title": "03:00 PM" },
  { "id": "16:00", "title": "04:00 PM" },
  { "id": "17:00", "title": "05:00 PM" },
  { "id": "18:00", "title": "06:00 PM" }
];

// ✅ OPCIONES DE PERSONAS
const PERSONAS_DATA = [
  { "id": "1", "title": "1 persona" },
  { "id": "2", "title": "2 personas" },
  { "id": "3", "title": "3 personas" },
  { "id": "4", "title": "4 personas" },
  { "id": "5", "title": "5 personas" },
  { "id": "6", "title": "6 personas" },
  { "id": "7", "title": "7 personas" },
  { "id": "8", "title": "8 personas" },
  { "id": "9", "title": "9 personas" },
  { "id": "10", "title": "10 personas" }
];

// ✅ OPCIONES DE BOTELLAS
const BOTELLAS_DATA = {
  "deseo": [
    { "id": "vino_redonda", "title": "🍷 Vino Redonda" },
    { "id": "six_cerveza", "title": "🍺 Six Cerveza" },
    { "id": "bacardi_blanco", "title": "🥃 Bacardi Blanco" },
    { "id": "presidente_clasico", "title": "🥃 Presidente Clásico" },
    { "id": "cazadores", "title": "🥃 Cazadores" },
    { "id": "wyboroba", "title": "🥃 Wyboroba" },
    { "id": "azteca_oro", "title": "🥃 Azteca de Oro" }
  ],
  "enamorados": [
    { "id": "vino_espanol", "title": "🍷 Vino Español" },
    { "id": "tradicional", "title": "🥃 Tradicional" },
    { "id": "centenario_plata", "title": "🥃 Centenario de Plata" },
    { "id": "etiqueta_roja", "title": "🥃 Etiqueta Roja" },
    { "id": "absolut_vodka", "title": "🍸 Absolut Vodka" }
  ],
  "premium": [
    { "id": "don_julio", "title": "🥃 Don Julio" },
    { "id": "vsop", "title": "🥃 VSOP" },
    { "id": "freixenet", "title": "🍾 Freixenet" },
    { "id": "buchanans_12", "title": "🥃 Buchanans 12" }
  ]
};

// ✅ OPCIONES DE REFRESCOS
const REFRESCOS_DATA = [
  {"id": "coca_cola", "title": "🥤 Coca-Cola"},
  {"id": "coca_cola_light", "title": "🥤 Coca-Cola Light"},
  {"id": "coca_cola_zero", "title": "🥤 Coca-Cola Zero"},
  {"id": "fanta", "title": "🥤 Fanta"},
  {"id": "sprite", "title": "🥤 Sprite"},
  {"id": "fresca", "title": "🥤 Fresca"},
  {"id": "sidral", "title": "🥤 Sidral Mundet"},
  {"id": "agua_mideral", "title": "🥤 Peñafiel Agua Mideral"},
  {"id": "delaware", "title": "🥤 Delaware Punch"},
  {"id": "ginger_ale", "title": "🥤 Schweppes Ginger Ale"},
  {"id": "agua_tonica", "title": "🥤 Schweppes Agua Tónica"},
  {"id": "agua_tonica", "title": "🥤 Schweppes Agua Tónica"},
  {"id": "jugo_granada", "title": "🥤 Jugo de Granada"},
  {"id": "jugo_arandano", "title": "🥤 Jugo de Arándano"},
];

function getHabitacionesPorPaquete(paqueteId) {
  if (!PRECIOS_PAQUETES[paqueteId]) {
    paqueteId = "deseo"; // Default
  }
  
  return HABITACIONES_BASE.map(hab => ({
    id: hab.id,
    title: `${hab.emoji} ${hab.nombre} - $${PRECIOS_PAQUETES[paqueteId][hab.id].toLocaleString('es-MX')} MXN`
  }));
}

// ✅ FUNCIÓN PARA OBTENER PRECIO
function getPrecio(paqueteId, habitacionId) {
  return PRECIOS_PAQUETES[paqueteId]?.[habitacionId] || 0;
}

// ✅ FUNCIÓN PARA OBTENER NOMBRE DE HABITACIÓN
function getNombreHabitacion(habitacionId) {
  const hab = HABITACIONES_BASE.find(h => h.id === habitacionId);
  return hab ? `${hab.emoji} ${hab.nombre}` : habitacionId;
}

// ✅ FUNCIÓN PARA OBTENER NOMBRE DE PAQUETE
function getNombrePaquete(paqueteId) {
  const paq = PAQUETES_DATA.find(p => p.id === paqueteId);
  return paq ? paq.title : paqueteId;
}

// ✅ FUNCIÓN PARA OBTENER NOMBRE DE BOTELLA
function getNombreBotella(botellaId) {
  // Buscar en todos los paquetes
  for (const paquete in BOTELLAS_DATA) {
    const botella = BOTELLAS_DATA[paquete].find(b => b.id === botellaId);
    if (botella) return botella.title;
  }
  return botellaId;
}

// ✅ FUNCIÓN PARA OBTENER NOMBRE DE REFRESCO
function getNombreRefresco(refrescoId) {
  const refresco = REFRESCOS_DATA.find(r => r.id === refrescoId);
  return refresco ? refresco.title : refrescoId;
}

module.exports = {
  PAQUETES_DATA,
  HABITACIONES_BASE,
  PRECIOS_PAQUETES,
  HORAS_DATA,
  PERSONAS_DATA,
  BOTELLAS_DATA,
  REFRESCOS_DATA,
  getHabitacionesPorPaquete,
  getPrecio,
  getNombreHabitacion,
  getNombrePaquete,
  getNombreBotella,
  getNombreRefresco
};
