// flow.js - Versión completamente corregida
const { sendTextMessage } = require('./message-sender.js');

// ✅ DATOS REALES DE HABITACIONES
const HABITACIONES_DATA = [
  {
    "id": "master_suite_junior",
    "title": "🏨 Master Suite Junior - $520 MXN"
  },
  {
    "id": "master_suite", 
    "title": "🛌 Master Suite - $600 MXN"
  },
  {
    "id": "master_suite_jacuzzi",
    "title": "🛁 Master Suite con Jacuzzi - $900 MXN"
  },
  {
    "id": "master_suite_jacuzzi_sauna",
    "title": "♨️ Master Suite con Jacuzzi y Sauna - $1240 MXN"
  },
  {
    "id": "master_suite_alberca",
    "title": "🏊 Master Suite con Alberca - $1990 MXN"
  }
];

// ✅ GENERAR FECHAS REALES (próximos 15 días)
function generarFechasReales() {
  const fechas = [];
  const hoy = new Date();
  
  for (let i = 1; i <= 15; i++) {
    const fecha = new Date();
    fecha.setDate(hoy.getDate() + i);
    
    const id = fecha.toISOString().split('T')[0];
    const title = fecha.toLocaleDateString('es-MX', { 
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    
    fechas.push({ 
      "id": id,
      "title": title
    });
  }
  
  return fechas;
}

// ✅ HORAS DISPONIBLES
const HORAS_DATA = [
  { "id": "14:00", "title": "14:00 - Check-in estándar" },
  { "id": "15:00", "title": "15:00" },
  { "id": "16:00", "title": "16:00" },
  { "id": "17:00", "title": "17:00" },
  { "id": "18:00", "title": "18:00" },
  { "id": "19:00", "title": "19:00" },
  { "id": "20:00", "title": "20:00" },
  { "id": "21:00", "title": "21:00" },
  { "id": "22:00", "title": "22:00" },
  { "id": "23:00", "title": "23:00" },
  { "id": "00:00", "title": "00:00 - Check-in nocturno" }
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

// ✅ PRECIOS POR HABITACIÓN
const PRECIOS_HABITACIONES = {
  "master_suite_junior": 520,
  "master_suite": 600,
  "master_suite_jacuzzi": 900,
  "master_suite_jacuzzi_sauna": 1240,
  "master_suite_alberca": 1990
};

async function processFlowLogic(decryptedBody) {
  console.log('🔧 Procesando flow logic - Pantalla:', decryptedBody.screen);
  
  const { screen, action, data, form_response } = decryptedBody;
  
  try {
    switch (screen) {
      case 'RESERVA':
        return await handleReservaScreen(decryptedBody);
        
      case 'DETALLES':
        return await handleDetallesScreen(decryptedBody);
        
      case 'RESUMEN':
        return await handleResumenScreen(decryptedBody);
        
      default:
        console.log('❌ Pantalla no reconocida, redirigiendo a RESERVA');
        return await handleReservaScreen(decryptedBody);
    }
  } catch (error) {
    console.error('💥 Error en processFlowLogic:', error);
    return await handleReservaScreen(decryptedBody);
  }
}

// ✅ MANEJAR PANTALLA DE RESERVA
async function handleReservaScreen(data) {
  console.log('🔄 ENVIANDO DATOS REALES A FLOW');
  
  // Generar fechas para los próximos 5 días
  const fechas = generarFechasReales().slice(0, 5);
  
  // Estructura del flow esperada por WhatsApp
  const response = {
    "version": "3.0",
    "screen": "RESERVA",
    "data": {
      "screens": [
        {
          "id": "RESERVA",
          "title": "🏨 Reserva tu habitación",
          "components": [
            {
              "type": "dropdown",
              "id": "tipo_habitacion",
              "label": "Tipo de habitación",
              "required": true,
              "options": HABITACIONES_DATA.map(hab => ({
                id: hab.id,
                title: hab.title,
                description: ""
              }))
            },
            {
              "type": "dropdown",
              "id": "fecha",
              "label": "Fecha de reserva",
              "required": true,
              "options": fechas.map(f => ({
                id: f.id,
                title: f.title,
                description: ""
              }))
            },
            {
              "type": "dropdown",
              "id": "hora",
              "label": "Hora de check-in",
              "required": true,
              "options": HORAS_DATA.map(h => ({
                id: h.id,
                title: h.title,
                description: ""
              }))
            },
            {
              "type": "dropdown",
              "id": "numero_personas",
              "label": "Número de personas",
              "required": true,
              "options": PERSONAS_DATA.map(p => ({
                id: p.id,
                title: p.title,
                description: ""
              }))
            }
          ],
          "footer": "Selecciona las opciones de tu reserva"
        }
      ]
    },
    "actions": {
      "on_submit": {
        "action": "NEXT",
        "next_screen_id": "DETALLES"
      }
    }
  };

  console.log('✅ Datos del flow preparados:', JSON.stringify(response, null, 2));
  return response;
}

// ✅ MANEJAR PANTALLA DE DETALLES
async function handleDetallesScreen(data) {
  const { data: screenData, form_response } = data;
  
  console.log('📋 Procesando pantalla DETALLES');
  
  if (form_response) {
    const { nombre, email, telefono, comentarios } = form_response;
    
    console.log('📝 Datos personales recibidos:', { 
      nombre: nombre ? '✓' : '✗', 
      email: email ? '✓' : '✗', 
      telefono: telefono ? '✓' : '✗' 
    });
    
    // Validar campos requeridos
    if (!nombre || !email || !telefono) {
      console.log('❌ Faltan campos obligatorios en datos personales');
      return { 
        "screen": "DETALLES",
        "data": screenData 
      };
    }
    
    // Combinar datos de reserva y detalles
    const datosCompletos = {
      ...screenData,
      "nombre": nombre,
      "email": email,
      "telefono": telefono,
      "comentarios": comentarios || ''
    };
    
    console.log('✅ Datos completos, pasando a RESUMEN');
    
    return {
      "screen": "RESUMEN",
      "data": await generarDatosResumen(datosCompletos)
    };
  }
  
  return {
    "screen": "DETALLES",
    "data": screenData
  };
}

// ✅ MANEJAR PANTALLA DE RESUMEN
async function handleResumenScreen(data) {
  const { data: screenData, form_response } = data;
  
  console.log('📋 Procesando pantalla RESUMEN');
  
  // Si confirmó la reserva
  if (form_response && form_response.estado === 'confirmada') {
    try {
      console.log('✅ Confirmando reserva...');
      
      // ✅ ENVIAR NOTIFICACIÓN POR WHATSAPP AL HOTEL
      await enviarNotificacionReserva(screenData);
      
      // ✅ ENVIAR CONFIRMACIÓN AL CLIENTE
      await enviarConfirmacionCliente(screenData);
      
      console.log('✅ Reserva confirmada y notificaciones enviadas');
      
      return {
        "screen": "RESUMEN",
        "data": {
          ...screenData,
          "mensaje_exito": "✅ ¡Reserva confirmada! Te hemos enviado los detalles por WhatsApp."
        },
        "terminal": true
      };
      
    } catch (error) {
      console.error('❌ Error confirmando reserva:', error);
      return { 
        "screen": "RESUMEN",
        "data": {
          ...screenData,
          "mensaje_error": "⚠️ Error al confirmar la reserva. Por favor contacta al hotel directamente."
        }
      };
    }
  }
  
  return {
    "screen": "RESUMEN",
    "data": screenData
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
  
  const habitacionNombre = nombresHabitaciones[datos.tipo_habitacion] || "Habitación no especificada";
  
  const textoReserva = `${habitacionNombre}\n📅 Fecha: ${fechaFormateada}\n🕓 Hora: ${datos.hora}\n👥 Personas: ${datos.numero_personas} personas`;
  
  const textoDetalles = `👤 Nombre: ${datos.nombre}\n📧 Email: ${datos.email}\n📞 Teléfono: ${datos.telefono}${datos.comentarios ? `\n💬 Comentarios: ${datos.comentarios}` : ''}`;
  
  const precioTotal = `💰 Precio total: $${precio} MXN\n\n📍 Ubicación: Auto Hotel Luxor\nAv. Prol. Boulevard Bernardo Quintana, 1000B\nQuerétaro, México`;
  
  console.log('📊 Resumen generado para pantalla');
  
  return {
    "reserva": textoReserva,
    "detalles": textoDetalles,
    "precio_total": precioTotal,
    ...datos
  };
}

// ✅ ENVIAR NOTIFICACIÓN AL HOTEL
async function enviarNotificacionReserva(datos) {
  try {
    const precio = PRECIOS_HABITACIONES[datos.tipo_habitacion] || 0;
    const nombresHabitaciones = {
      "master_suite_junior": "Master Suite Junior",
      "master_suite": "Master Suite",
      "master_suite_jacuzzi": "Master Suite con Jacuzzi", 
      "master_suite_jacuzzi_sauna": "Master Suite con Jacuzzi y Sauna",
      "master_suite_alberca": "Master Suite con Alberca"
    };
    
    const habitacionNombre = nombresHabitaciones[datos.tipo_habitacion] || "Habitación no especificada";
    
    const mensajeHotel = `🏨 **NUEVA RESERVA - Auto Hotel Luxor** 🏨

📋 **Detalles de la Reserva:**
• Habitación: ${habitacionNombre}
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
    console.log('📤 Enviando notificación al hotel:', telefonoHotel);
    await sendTextMessage(telefonoHotel, mensajeHotel);
    
  } catch (error) {
    console.error('❌ Error enviando notificación al hotel:', error);
    throw error;
  }
}

// ✅ ENVIAR CONFIRMACIÓN AL CLIENTE  
async function enviarConfirmacionCliente(datos) {
  try {
    const precio = PRECIOS_HABITACIONES[datos.tipo_habitacion] || 0;
    const nombresHabitaciones = {
      "master_suite_junior": "🏨 Master Suite Junior",
      "master_suite": "🛌 Master Suite",
      "master_suite_jacuzzi": "🛁 Master Suite con Jacuzzi",
      "master_suite_jacuzzi_sauna": "♨️ Master Suite con Jacuzzi y Sauna", 
      "master_suite_alberca": "🏊 Master Suite con Alberca"
    };
    
    const habitacionNombre = nombresHabitaciones[datos.tipo_habitacion] || "Habitación no especificada";
    
    const mensajeCliente = `✅ **¡Reserva Confirmada! - Auto Hotel Luxor** 🏨

Gracias ${datos.nombre}, tu reserva ha sido confirmada:

📋 **Detalles de tu Reserva:**
• ${habitacionNombre} - $${precio} MXN
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

    console.log('📤 Enviando confirmación al cliente:', datos.telefono);
    await sendTextMessage(datos.telefono, mensajeCliente);
    
  } catch (error) {
    console.error('❌ Error enviando confirmación al cliente:', error);
    throw error;
  }
}

module.exports = { processFlowLogic };