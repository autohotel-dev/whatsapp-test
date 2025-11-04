import { generateAvailableDates } from "./helpers";
import { generateAvailableTimes } from "./helpers";
import { saveAppointment } from "./helpers";

export function processFlowLogic(decryptedBody) {
  const { screen, data, version, action, flow_token } = decryptedBody;
  
  console.log('🔄 Procesando flow:', { action, screen });

  // Health check
  if (action === "ping") {
    return { data: { status: "active" } };
  }

  // Manejar errores
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
          { id: "electronics", title: "📱 Electronics & Appliances" }
        ],
        location: [
          { id: "1", title: "📍 King's Cross, London" },
          { id: "2", title: "📍 Oxford Street, London" },
          { id: "3", title: "📍 Covent Garden, London" }
        ],
        date: generateAvailableDates(),
        time: generateAvailableTimes()
      }
    };
  }

  // Data exchange desde SUMMARY
  if (action === "data_exchange" && screen === "SUMMARY") {
    if (data.action === "confirm_appointment") {
      // Guardar appointment en tu base de datos
      const appointmentId = saveAppointment(data);
      
      return {
        screen: "SUCCESS",
        data: {
          extension_message_response: {
            params: {
              flow_token: flow_token,
              appointment_id: appointmentId,
              status: "confirmed",
              message: "Your appointment has been confirmed!",
              timestamp: new Date().toISOString()
            }
          }
        }
      };
    }
  }

  // Navegación normal
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
    return { screen: "APPOINTMENT", data: {} };
  }

  throw new Error(`Action no manejado: ${action}`);
}