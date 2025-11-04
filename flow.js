const { generateAvailableDates, generateAvailableTimes, saveAppointment } = require('./helpers.js');

/**
 * Procesa la lógica principal del flow de citas
 */
async function processFlowLogic(decryptedBody) {
  const { screen, data, version, action, flow_token } = decryptedBody;
  
  console.log('🔄 Procesando flow:', { action, screen });

  // Health check
  if (action === "ping") {
    return { data: { status: "active" } };
  }

  // Manejar errores del cliente
  if (data?.error) {
    console.warn("Error del cliente:", data);
    return { data: { acknowledged: true } };
  }

  // INIT - Primera pantalla
  if (action === "INIT") {
    return {
      screen: "APPOINTMENT",
      data: {
        department: [
          { id: "shopping", title: "🛒 Shopping & Groceries" },
          { id: "beauty", title: "💄 Beauty & Personal Care" },
          { id: "electronics", title: "📱 Electronics & Appliances" },
          { id: "clothing", title: "👕 Clothing & Apparel" },
          { id: "home", title: "🏠 Home Goods & Decor" }
        ],
        location: [
          { id: "kings-cross", title: "📍 King's Cross, London" },
          { id: "oxford-street", title: "📍 Oxford Street, London" },
          { id: "covent-garden", title: "📍 Covent Garden, London" },
          { id: "piccadilly", title: "📍 Piccadilly Circus, London" }
        ],
        date: generateAvailableDates(),
        time: generateAvailableTimes()
      }
    };
  }

  // Data exchange desde SUMMARY (confirmación final)
  if (action === "data_exchange" && screen === "SUMMARY") {
    if (data.action === "confirm_appointment") {
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
                customer_name: data.name,
                appointment_date: data.date,
                appointment_time: data.time,
                location: data.location,
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
            department: data.department,
            location: data.location,
            date: data.date,
            time: data.time,
            name: data.name,
            email: data.email,
            phone: data.phone,
            notes: data.notes
          }
        };
      }
    }
  }

  // Navegación entre pantallas
  if (action === "data_exchange") {
    switch (screen) {
      case "APPOINTMENT":
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
        return {
          screen: "SUMMARY", 
          data: {
            department: data.department,
            location: data.location,
            date: data.date,
            time: data.time,
            name: data.name,
            email: data.email,
            phone: data.phone, 
            notes: data.notes || "No additional notes"
          }
        };
    }
  }

  // Action BACK
  if (action === "BACK") {
    return { 
      screen: "APPOINTMENT", 
      data: {} 
    };
  }

  console.error('Action no manejado:', action, 'en screen:', screen);
  throw new Error(`UNHANDLED_ACTION: ${action} on screen ${screen}`);
}

module.exports = {
  processFlowLogic
};