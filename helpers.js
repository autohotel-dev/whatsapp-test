const config = require('./config.js');

/**
 * Valida la verificación del webhook
 */
function validateWebhook(query) {
  const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = query;
  
  if (mode === 'subscribe' && token === config.verifyToken) {
    return { valid: true, challenge };
  }
  
  return { valid: false };
}

/**
 * Genera fechas disponibles para citas
 */
function generateAvailableDates() {
  const dates = [];
  const today = new Date();
  
  for (let i = 1; i <= config.appointment.maxDaysInFuture; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    // Excluir fines de semana
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      dates.push({
        id: date.toISOString().split('T')[0],
        title: date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        })
      });
    }
  }
  
  return dates.slice(0, 7); // Limitar a 7 días
}

/**
 * Genera horarios disponibles
 */
function generateAvailableTimes() {
  const times = [];
  const { start, end } = config.appointment.businessHours;
  const slotDuration = config.appointment.slotDuration;
  
  for (let hour = start; hour < end; hour++) {
    for (let minute = 0; minute < 60; minute += slotDuration) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const displayTime = formatTimeForDisplay(hour, minute);
      
      times.push({
        id: timeString,
        title: displayTime,
        enabled: true // Podrías agregar lógica para horarios ocupados
      });
    }
  }
  
  return times;
}

/**
 * Formatea la hora para display
 */
function formatTimeForDisplay(hour, minute) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
}

/**
 * Guarda la cita en base de datos (simulación)
 */
async function saveAppointment(appointmentData) {
  // Aquí integrarías con tu base de datos real
  const appointmentId = 'APT_' + Date.now();
  
  console.log('📝 Guardando cita:', {
    id: appointmentId,
    ...appointmentData,
    created_at: new Date().toISOString()
  });
  
  // Simular guardado asíncrono
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return appointmentId;
}

/**
 * Logger consistente
 */
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  
  if (data) {
    console.log(logMessage, data);
  } else {
    console.log(logMessage);
  }
}

module.exports = {
  validateWebhook,
  generateAvailableDates,
  generateAvailableTimes,
  saveAppointment,
  log
};