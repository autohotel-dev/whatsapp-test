const { generateAvailableDates, generateAvailableTimes, saveReservation } = require('./helpers.js');

async function processFlowLogic(decryptedBody) {
  const { screen, data, version, action, flow_token } = decryptedBody;
  
  console.log('🏨 Procesando flow de reserva:', { action, screen });

  if (action === "ping") {
    return { data: { status: "active" } };
  }

  if (data?.error) {
    return { data: { acknowledged: true } };
  }

  // INIT - Pantalla de selección de habitación
  if (action === "INIT") {
    return {
      screen: "ROOM_SELECTION",
      data: {
        room_types: [
          { 
            id: "suite", 
            title: "💎 Suite Ejecutiva", 
            description: "50m², vista al mar, jacuzzi",
            price: "$250/noche"
          },
          { 
            id: "deluxe", 
            title: "🌊 Habitación Deluxe", 
            description: "35m², balcón, vista al océano",
            price: "$180/noche"
          },
          { 
            id: "standard", 
            title: "🌴 Habitación Estándar", 
            description: "25m², cama king size",
            price: "$120/noche"
          },
          { 
            id: "family", 
            title: "👨‍👩‍👧‍👦 Familiar", 
            description: "40m², 2 camas queen, área de estar",
            price: "$200/noche"
          }
        ],
        date: generateAvailableDates(),
        guest_options: [
          { id: "1", title: "1 Adulto" },
          { id: "2", title: "2 Adultos" },
          { id: "3", title: "3 Adultos" },
          { id: "4", title: "4 Adultos" },
          { id: "family", title: "Familia (2 adultos + 2 niños)" }
        ]
      }
    };
  }

  // Procesar selección de habitación
  if (action === "data_exchange" && screen === "ROOM_SELECTION") {
    return {
      screen: "DATES_SELECTION",
      data: {
        selected_room: data.room_type,
        room_title: getRoomTitle(data.room_type),
        date: generateAvailableDates(),
        min_nights: 1,
        max_nights: 30
      }
    };
  }

  // Procesar selección de fechas
  if (action === "data_exchange" && screen === "DATES_SELECTION") {
    return {
      screen: "GUEST_DETAILS",
      data: {
        selected_room: data.selected_room,
        room_title: data.room_title,
        check_in: data.check_in_date,
        check_out: data.check_out_date,
        nights: calculateNights(data.check_in_date, data.check_out_date),
        total_price: calculateTotalPrice(data.selected_room, data.check_in_date, data.check_out_date)
      }
    };
  }

  // Procesar detalles de huésped
  if (action === "data_exchange" && screen === "GUEST_DETAILS") {
    const reservationSummary = createReservationSummary(data);
    
    return {
      screen: "CONFIRMATION",
      data: {
        reservation_summary: reservationSummary,
        ...data
      }
    };
  }

  // Confirmar reserva
  if (action === "data_exchange" && screen === "CONFIRMATION") {
    try {
      const reservationId = await saveReservation(data);
      
      return {
        screen: "SUCCESS",
        data: {
          extension_message_response: {
            params: {
              flow_token: flow_token,
              reservation_id: reservationId,
              status: "confirmed",
              message: "🎉 ¡Reserva Confirmada!",
              summary: `Habitación ${getRoomTitle(data.selected_room)} del ${data.check_in_date} al ${data.check_out_date} para ${data.guest_name}`,
              contact_email: data.guest_email,
              total_amount: data.total_price,
              timestamp: new Date().toISOString()
            }
          }
        }
      };
    } catch (error) {
      return {
        screen: "CONFIRMATION",
        data: {
          error_message: "❌ Error confirmando reserva. Por favor intenta de nuevo.",
          ...data
        }
      };
    }
  }

  return { screen: "ROOM_SELECTION", data: {} };
}

// Funciones helper para el flow de hotel
function getRoomTitle(roomId) {
  const rooms = {
    "suite": "Suite Ejecutiva",
    "deluxe": "Habitación Deluxe", 
    "standard": "Habitación Estándar",
    "family": "Habitación Familiar"
  };
  return rooms[roomId] || roomId;
}

function calculateNights(checkIn, checkOut) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
}

function calculateTotalPrice(roomType, checkIn, checkOut) {
  const prices = {
    "suite": 250,
    "deluxe": 180, 
    "standard": 120,
    "family": 200
  };
  
  const nights = calculateNights(checkIn, checkOut);
  const pricePerNight = prices[roomType] || 150;
  
  return `$${pricePerNight * nights} USD`;
}

function createReservationSummary(data) {
  return `🏨 **Resumen de Reserva:**

• Habitación: ${getRoomTitle(data.selected_room)}
• Check-in: ${data.check_in_date}
• Check-out: ${data.check_out_date} 
• Huéspedes: ${data.guest_count} personas
• Total: ${data.total_price}

**Datos del Huésped:**
Nombre: ${data.guest_name}
Email: ${data.guest_email}
Teléfono: ${data.guest_phone}`;
}

module.exports = { processFlowLogic };