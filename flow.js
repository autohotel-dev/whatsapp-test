// flow.js - Versión Simplificada
const { sendTextMessage } = require('./message-sender.js');

// ✅ PRECIOS POR HABITACIÓN (para cálculos)
const PRECIOS_HABITACIONES = {
  "master_suite_junior": 520,
  "master_suite": 600,
  "master_suite_jacuzzi": 900,
  "master_suite_jacuzzi_sauna": 1240,
  "master_suite_alberca": 1990
};

async function processFlowLogic(decryptedBody) {
  console.log('🔧 Procesando flow logic:', JSON.stringify(decryptedBody, null, 2));
  
  const { screen, action, form_response } = decryptedBody;
  
  try {
    switch (screen) {
      case 'RESERVA':
        return await handleReservaScreen(decryptedBody);
        
      case 'DETALLES':
        return await handleDetallesScreen(decryptedBody);
        
      case 'RESUMEN':
        return await handleResumenScreen(decryptedBody);
        
      default:
        console.log('❌ Pantalla no reconocida:', screen);
        return { screen: "RESERVA" }; // Volver a reserva
    }
  } catch (error) {
    console.error('💥 Error en processFlowLogic:', error);
    return { screen: "RESERVA" }; // Volver a reserva en caso de error
  }
}

// ✅ MANEJAR PANTALLA DE RESERVA
async function handleReservaScreen(data) {
  // El flow maneja los datos estáticos, solo necesitamos validar
  const { form_response } = data;
  
  if (form_response) {
    const { tipo_habitacion, fecha, hora, numero_personas } = form_response;
    
    // Validar que todos los campos estén completos
    if (!tipo_habitacion || !fecha || !hora || !numero_personas) {
      return { screen: "RESERVA" }; // Volver a reserva si faltan datos
    }
    
    return {
      screen: "DETALLES",
      data: {
        tipo_habitacion,
        fecha,
        hora,
        numero_personas
      }
    };
  }
  
  return { screen: "RESERVA" };
}

// ✅ MANEJAR PANTALLA DE DETALLES
async function handleDetallesScreen(data) {
  const { data: screenData, form_response } = data;
  
  if (form_response) {
    const { nombre, email, telefono, comentarios } = form_response;
    
    // Validar campos requeridos
    if (!nombre || !email || !telefono) {
      return { 
        screen: "DETALLES",
        data: screenData 
      };
    }
    
    // Combinar datos de reserva y detalles
    const datosCompletos = {
      ...screenData,
      nombre,
      email,
      telefono,
      comentarios: comentarios || ''
    };
    
    return {
      screen: "RESUMEN",
      data: await generarDatosResumen(datosCompletos)
    };
  }
  
  return {
    screen: "DETALLES",
    data: screenData
  };
}

// ✅ MANEJAR PANTALLA DE RESUMEN
async function handleResumenScreen(data) {
  const { data: screenData, form_response } = data;
  
  // Si confirmó la reserva
  if (form_response && form_response.estado === 'confirmada') {
    try {
      // ✅ ENVIAR NOTIFICACIÓN POR WHATSAPP AL HOTEL
      await enviarNotificacionReserva(screenData);
      
      // ✅ ENVIAR CONFIRMACIÓN AL CLIENTE
      await enviarConfirmacionCliente(screenData);
      
      return {
        screen: "RESUMEN",
        data: {
          ...screenData,
          mensaje_exito: "✅ ¡Reserva confirmada! Te hemos enviado los detalles por WhatsApp."
        },
        terminal: true
      };
      
    } catch (error) {
      console.error('Error confirmando reserva:', error);
      return { 
        screen: "RESUMEN",
        data: screenData 
      };
    }
  }
  
  return {
    screen: "RESUMEN",
    data: screenData
  };
}

// ✅ GENERAR DATOS PARA EL RESUMEN
async function generarDatosResumen(datos) {
  const precio = PRECIOS_HABITACIONES[datos.tipo_habitacion] || 0;
  const fechaObj = new Date(datos.fecha);
  const fechaFormateada = fechaObj.toLocaleDateString('es-MX', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  
  const nombresHabitaciones = {
    "master_suite_junior": "🏨 Master Suite Junior",
    "master_suite": "🛌 Master Suite", 
    "master_suite_jacuzzi": "🛁 Master Suite con Jacuzzi",
    "master_suite_jacuzzi_sauna": "♨️ Master Suite con Jacuzzi y Sauna",
    "master_suite_alberca": "🏊 Master Suite con Alberca"
  };
  
  const textoReserva = `${nombresHabitaciones[datos.tipo_habitacion]}\\n📅 Fecha: ${fechaFormateada}\\n🕓 Hora: ${datos.hora}\\n👥 Personas: ${datos.numero_personas} personas`;
  
  const textoDetalles = `👤 Nombre: ${datos.nombre}\\n📧 Email: ${datos.email}\\n📞 Teléfono: ${datos.telefono}${datos.comentarios ? `\\n💬 Comentarios: ${datos.comentarios}` : ''}`;
  
  return {
    reserva: textoReserva,
    detalles: textoDetalles,
    precio_total: `💰 Precio total: $${precio} MXN\\n\\n📍 Ubicación: Auto Hotel Luxor\\nAv. Prol. Boulevard Bernardo Quintana, 1000B\\nQuerétaro, México`,
    ...datos
  };
}

// ✅ ENVIAR NOTIFICACIÓN AL HOTEL
async function enviarNotificacionReserva(datos) {
  const precio = PRECIOS_HABITACIONES[datos.tipo_habitacion] || 0;
  const nombresHabitaciones = {
    "master_suite_junior": "Master Suite Junior",
    "master_suite": "Master Suite",
    "master_suite_jacuzzi": "Master Suite con Jacuzzi", 
    "master_suite_jacuzzi_sauna": "Master Suite con Jacuzzi y Sauna",
    "master_suite_alberca": "Master Suite con Alberca"
  };
  
  const mensajeHotel = `🏨 **NUEVA RESERVA - Auto Hotel Luxor** 🏨

📋 **Detalles de la Reserva:**
• Habitación: ${nombresHabitaciones[datos.tipo_habitacion]}
• Fecha: ${datos.fecha}
• Hora: ${datos.hora}
• Personas: ${datos.numero_personas}

👤 **Datos del Cliente:**
• Nombre: ${datos.nombre}
• Email: ${datos.email}
• Teléfono: ${datos.telefono}
${datos.comentarios ? `• Comentarios: ${datos.comentarios}` : ''}

💰 **Total: $${precio} MXN**

⏰ _Reserva recibida: ${new Date().toLocaleString('es-MX')}_`;

  // Enviar al número del hotel
  const telefonoHotel = process.env.HOTEL_NOTIFICATION_PHONE || '5214422103292';
  await sendTextMessage(telefonoHotel, mensajeHotel);
}

// ✅ ENVIAR CONFIRMACIÓN AL CLIENTE  
async function enviarConfirmacionCliente(datos) {
  const precio = PRECIOS_HABITACIONES[datos.tipo_habitacion] || 0;
  const nombresHabitaciones = {
    "master_suite_junior": "🏨 Master Suite Junior",
    "master_suite": "🛌 Master Suite",
    "master_suite_jacuzzi": "🛁 Master Suite con Jacuzzi",
    "master_suite_jacuzzi_sauna": "♨️ Master Suite con Jacuzzi y Sauna", 
    "master_suite_alberca": "🏊 Master Suite con Alberca"
  };
  
  const mensajeCliente = `✅ **¡Reserva Confirmada! - Auto Hotel Luxor** 🏨

Gracias ${datos.nombre}, tu reserva ha sido confirmada:

📋 **Detalles de tu Reserva:**
• ${nombresHabitaciones[datos.tipo_habitacion]} - $${precio} MXN
• Fecha: ${datos.fecha}  
• Hora de check-in: ${datos.hora}
• Número de personas: ${datos.numero_personas}

💰 **Total a pagar: $${precio} MXN**

📍 **Ubicación:**
Auto Hotel Luxor
Av. Prol. Boulevard Bernardo Quintana, 1000B
Querétaro, México

📞 **Contacto: 442 210 3292**

_¡Te esperamos! Recuerda traer identificación oficial._`;

  await sendTextMessage(datos.telefono, mensajeCliente);
}

module.exports = { processFlowLogic };