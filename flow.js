const { generateAvailableDates, generateAvailableTimes, saveAppointment, getDepartmentName, getLocationName } = require('./helpers.js');

/**
 * Procesa la lógica del flow basado en tu plantilla
 */
async function processFlowLogic(decryptedBody) {
  const { screen, data, version, action, flow_token } = decryptedBody;
  
  console.log('🔄 Procesando flow:', { action, screen, trigger: data?.trigger });

  // Health check
  if (action === "ping") {
    return { data: { status: "active" } };
  }

  // Manejar errores del cliente
  if (data?.error) {
    console.warn("Error del cliente:", data);
    return { data: { acknowledged: true } };
  }

  // INIT - Primera pantalla (APPOINTMENT)
  if (action === "INIT") {
    return {
      screen: "APPOINTMENT",
      data: {
        department: [
          { id: "shopping", title: "🛒 Shopping & Groceries" },
          { id: "clothing", title: "👕 Clothing & Apparel" },
          { id: "home", title: "🏠 Home Goods & Decor" },
          { id: "electronics", title: "📱 Electronics & Appliances" },
          { id: "beauty", title: "💄 Beauty & Personal Care" }
        ],
        location: [
          { id: "1", title: "📍 King's Cross, London" },
          { id: "2", title: "📍 Oxford Street, London" },
          { id: "3", title: "📍 Covent Garden, London" },
          { id: "4", title: "📍 Piccadilly Circus, London" }
        ],
        is_location_enabled: true,
        date: generateAvailableDates(),
        is_date_enabled: true,
        time: generateAvailableTimes(),
        is_time_enabled: true
      }
    };
  }

  // Data exchange desde pantallas individuales (on-select-action)
  if (action === "data_exchange" && data?.trigger) {
    switch (data.trigger) {
      case "department_selected":
        console.log('📦 Departamento seleccionado:', data.department);
        // Puedes actualizar horarios basado en el departamento
        return {
          screen: "APPOINTMENT",
          data: {
            // Mantener los mismos datos, o actualizar basado en selección
            department: [
              { id: "shopping", title: "🛒 Shopping & Groceries" },
              { id: "clothing", title: "👕 Clothing & Apparel" },
              { id: "home", title: "🏠 Home Goods & Decor" },
              { id: "electronics", title: "📱 Electronics & Appliances" },
              { id: "beauty", title: "💄 Beauty & Personal Care" }
            ],
            location: [
              { id: "1", title: "📍 King's Cross, London" },
              { id: "2", title: "📍 Oxford Street, London" },
              { id: "3", title: "📍 Covent Garden, London" },
              { id: "4", title: "📍 Piccadilly Circus, London" }
            ],
            is_location_enabled: true,
            date: generateAvailableDates(),
            is_date_enabled: true,
            time: generateAvailableTimes(),
            is_time_enabled: true
          }
        };

      case "location_selected":
        console.log('📍 Locación seleccionada:', data.location);
        return {
          screen: "APPOINTMENT",
          data: {
            department: [
              { id: "shopping", title: "🛒 Shopping & Groceries" },
              { id: "clothing", title: "👕 Clothing & Apparel" },
              { id: "home", title: "🏠 Home Goods & Decor" },
              { id: "electronics", title: "📱 Electronics & Appliances" },
              { id: "beauty", title: "💄 Beauty & Personal Care" }
            ],
            location: [
              { id: "1", title: "📍 King's Cross, London" },
              { id: "2", title: "📍 Oxford Street, London" },
              { id: "3", title: "📍 Covent Garden, London" },
              { id: "4", title: "📍 Piccadilly Circus, London" }
            ],
            is_location_enabled: true,
            date: generateAvailableDates(),
            is_date_enabled: true,
            time: generateAvailableTimes(),
            is_time_enabled: true
          }
        };

      case "date_selected":
        console.log('📅 Fecha seleccionada:', data.date);
        return {
          screen: "APPOINTMENT",
          data: {
            department: [
              { id: "shopping", title: "🛒 Shopping & Groceries" },
              { id: "clothing", title: "👕 Clothing & Apparel" },
              { id: "home", title: "🏠 Home Goods & Decor" },
              { id: "electronics", title: "📱 Electronics & Appliances" },
              { id: "beauty", title: "💄 Beauty & Personal Care" }
            ],
            location: [
              { id: "1", title: "📍 King's Cross, London" },
              { id: "2", title: "📍 Oxford Street, London" },
              { id: "3", title: "📍 Covent Garden, London" },
              { id: "4", title: "📍 Piccadilly Circus, London" }
            ],
            is_location_enabled: true,
            date: generateAvailableDates(),
            is_date_enabled: true,
            time: generateAvailableTimes(),
            is_time_enabled: true
          }
        };
    }
  }

  // Navegación entre pantallas principales
  if (action === "data_exchange") {
    switch (screen) {
      case "APPOINTMENT":
        // Navegar a DETAILS con los datos del appointment
        return {
          screen: "DETAILS",
          data: {
            department: data.department,
            location: data.location,
            date: data.date,
            time: data.time
          }
        };

      case "DETAILS":
        // Preparar datos para SUMMARY
        const appointmentSummary = formatAppointmentSummary(data);
        const detailsSummary = formatDetailsSummary(data);
        
        return {
          screen: "SUMMARY",
          data: {
            appointment: appointmentSummary,
            details: detailsSummary,
            department: data.department,
            location: data.location,
            date: data.date,
            time: data.time,
            name: data.name,
            email: data.email,
            phone: data.phone,
            more_details: data.more_details || "No additional details provided"
          }
        };

      case "SUMMARY":
        // Confirmar la cita
        if (data.department && data.location && data.date && data.time && data.name) {
          try {
            const appointmentId = await saveAppointment(data);
            
            return {
              screen: "SUCCESS",
              data: {
                extension_message_response: {
                  params: {
                    flow_token: flow_token,
                    appointment_id: appointmentId,
                    status: "confirmed",
                    message: "✅ Your appointment has been confirmed!",
                    summary: `Appointment for ${data.name} at ${getLocationName(data.location)} on ${formatDisplayDate(data.date)} at ${data.time}`,
                    timestamp: new Date().toISOString()
                  }
                }
              }
            };
          } catch (error) {
            console.error('Error guardando cita:', error);
            return {
              screen: "SUMMARY",
              data: {
                error_message: "❌ Error confirming appointment. Please try again.",
                appointment: data.appointment,
                details: data.details,
                department: data.department,
                location: data.location,
                date: data.date,
                time: data.time,
                name: data.name,
                email: data.email,
                phone: data.phone,
                more_details: data.more_details
              }
            };
          }
        }
        break;
    }
  }

  // Action BACK
  if (action === "BACK") {
    // Lógica para manejar el botón de retroceso
    switch (screen) {
      case "DETAILS":
        return { screen: "APPOINTMENT", data: {} };
      case "SUMMARY":
        return { screen: "DETAILS", data: {} };
      case "TERMS":
        return { screen: "SUMMARY", data: {} };
      default:
        return { screen: "APPOINTMENT", data: {} };
    }
  }

  console.error('Action no manejado:', { action, screen, data });
  throw new Error(`UNHANDLED_ACTION: ${action} on screen ${screen}`);
}

/**
 * Formatea el resumen del appointment para SUMMARY screen
 */
function formatAppointmentSummary(data) {
  const department = getDepartmentName(data.department);
  const location = getLocationName(data.location);
  const date = formatDisplayDate(data.date);
  
  return `${department} Department at ${location}\n${date} at ${data.time}.`;
}

/**
 * Formatea los detalles del usuario para SUMMARY screen  
 */
function formatDetailsSummary(data) {
  return `Name: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone}${data.more_details ? `\n\n${data.more_details}` : ''}`;
}

/**
 * Formatea la fecha para display
 */
function formatDisplayDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
}

module.exports = {
  processFlowLogic
};