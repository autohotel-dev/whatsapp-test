const config = require('./config.js');

// ... (las funciones anteriores se mantienen)

/**
 * Obtiene el nombre del departamento por ID
 */
function getDepartmentName(departmentId) {
  const departments = {
    "shopping": "Shopping & Groceries",
    "clothing": "Clothing & Apparel", 
    "home": "Home Goods & Decor",
    "electronics": "Electronics & Appliances",
    "beauty": "Beauty & Personal Care"
  };
  return departments[departmentId] || departmentId;
}

/**
 * Obtiene el nombre de la locación por ID
 */
function getLocationName(locationId) {
  const locations = {
    "1": "King's Cross, London",
    "2": "Oxford Street, London",
    "3": "Covent Garden, London", 
    "4": "Piccadilly Circus, London"
  };
  return locations[locationId] || locationId;
}

/**
 * Guarda la cita con todos los datos de tu plantilla
 */
async function saveAppointment(appointmentData) {
  const appointmentId = 'APT_' + Date.now();
  
  console.log('📝 Guardando cita completa:', {
    id: appointmentId,
    // Datos del appointment
    department: appointmentData.department,
    department_name: getDepartmentName(appointmentData.department),
    location: appointmentData.location, 
    location_name: getLocationName(appointmentData.location),
    date: appointmentData.date,
    time: appointmentData.time,
    
    // Datos del usuario
    customer_name: appointmentData.name,
    customer_email: appointmentData.email,
    customer_phone: appointmentData.phone,
    additional_notes: appointmentData.more_details,
    
    // Metadata
    created_at: new Date().toISOString(),
    status: "confirmed"
  });
  
  // Simular guardado asíncrono
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return appointmentId;
}

module.exports = {
  // ... funciones anteriores
  getDepartmentName,
  getLocationName,
  saveAppointment
};