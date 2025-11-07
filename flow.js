// flow.js - Versión corregida según documentación oficial
const { sendTextMessage } = require('./message-sender.js');

// ✅ DATOS PARA LOS DROPDOWNS
const HABITACIONES_DATA = [
  {"id": "master_suite_junior", "title": "🏨 Master Suite Junior - $520 MXN"},
  {"id": "master_suite", "title": "🛌 Master Suite - $600 MXN"},
  {"id": "master_suite_jacuzzi", "title": "🛁 Master Suite con Jacuzzi - $900 MXN"},
  {"id": "master_suite_jacuzzi_sauna", "title": "♨️ Master Suite con Jacuzzi y Sauna - $1240 MXN"},
  {"id": "master_suite_alberca", "title": "🏊 Master Suite con Alberca - $1990 MXN"}
];

const HORAS_DATA = [
  {"id": "14:00", "title": "14:00 - Check-in estándar"},
  {"id": "15:00", "title": "15:00"},
  {"id": "16:00", "title": "16:00"},
  {"id": "17:00", "title": "17:00"},
  {"id": "18:00", "title": "18:00"},
  {"id": "19:00", "title": "19:00"},
  {"id": "20:00", "title": "20:00"},
  {"id": "21:00", "title": "21:00"},
  {"id": "22:00", "title": "22:00"},
  {"id": "23:00", "title": "23:00"},
  {"id": "00:00", "title": "00:00 - Check-in nocturno"}
];

const PERSONAS_DATA = [
  {"id": "1", "title": "1 persona"},
  {"id": "2", "title": "2 personas"},
  {"id": "3", "title": "3 personas"},
  {"id": "4", "title": "4 personas"},
  {"id": "5", "title": "5 personas"},
  {"id": "6", "title": "6 personas"},
  {"id": "7", "title": "7 personas"},
  {"id": "8", "title": "8 personas"},
  {"id": "9", "title": "9 personas"},
  {"id": "10", "title": "10 personas"}
];

// ✅ GENERAR FECHAS (próximos 7 días)
function generarFechas() {
  const fechas = [];
  const hoy = new Date();
  
  for (let i = 1; i <= 7; i++) {
    const fecha = new Date();
    fecha.setDate(hoy.getDate() + i);
    const id = fecha.toISOString().split('T')[0];
    const title = fecha.toLocaleDateString('es-MX', { 
      weekday: 'short', 
      day: '2-digit', 
      month: 'short'
    });
    fechas.push({"id": id, "title": title});
  }
  return fechas;
}

async function processFlowLogic(decryptedBody) {
  console.log('🔧 processFlowLogic - Action:', decryptedBody.action, 'Screen:', decryptedBody.screen);
  
  const { action, screen, data, flow_token } = decryptedBody;

  try {
    switch (action) {
      case 'INIT':
        // Primera vez que entra al flow
        return await handleInitAction(decryptedBody);
        
      case 'data_exchange':
        // Intercambio de datos desde un formulario
        return await handleDataExchangeAction(decryptedBody);
        
      case 'ping':
        // Health check de Meta
        return { data: { acknowledged: true } };
        
      default:
        console.log('❌ Acción no reconocida:', action);
        return await handleInitAction(decryptedBody);
    }
  } catch (error) {
    console.error('💥 Error en processFlowLogic:', error);
    return {
      screen: "RESERVA",
      data: {
        error_message: "Error procesando la solicitud. Intenta nuevamente."
      }
    };
  }
}

// ✅ MANEJAR ACTION INIT (primera carga)
async function handleInitAction(data) {
  console.log('🎯 INIT Action - Cargando pantalla RESERVA');
  
  return {
    screen: "RESERVA",
    data: {
      tipo_habitacion: HABITACIONES_DATA,
      fecha: generarFechas(),
      is_fecha_enabled: true,
      hora: HORAS_DATA,
      is_hora_enabled: true,
      numero_personas: PERSONAS_DATA,
      is_numero_personas_enabled: true
    }
  };
}

// ✅ MANEJAR DATA_EXCHANGE (envío de formularios)
async function handleDataExchangeAction(data) {
  const { screen, data: formData, flow_token } = data;
  
  console.log('🔄 DATA_EXCHANGE - Screen:', screen, 'Data:', formData);

  switch (screen) {
    case 'RESERVA':
      return await handleReservaDataExchange(formData);
      
    case 'DETALLES':
      return await handleDetallesDataExchange(formData);
      
    case 'RESUMEN':
      return await handleResumenDataExchange(formData);
      
    default:
      console.log('❌ Pantalla no reconocida en data_exchange:', screen);
      return await handleInitAction(data);
  }
}

// ✅ MANEJAR FORMULARIO DE RESERVA
async function handleReservaDataExchange(formData) {
  const { tipo_habitacion, fecha, hora, numero_personas } = formData;
  
  console.log('📝 Datos de reserva recibidos:', { tipo_habitacion, fecha, hora, numero_personas });

  // Validar campos requeridos
  if (!tipo_habitacion || !fecha || !hora || !numero_personas) {
    console.log('❌ Faltan campos en reserva');
    return {
      screen: "RESERVA",
      data: {
        tipo_habitacion: HABITACIONES_DATA,
        fecha: generarFechas(),
        is_fecha_enabled: true,
        hora: HORAS_DATA,
        is_hora_enabled: true,
        numero_personas: PERSONAS_DATA,
        is_numero_personas_enabled: true,
        error_message: "Por favor completa todos los campos"
      }
    };
  }

  console.log('✅ Reserva válida, pasando a DETALLES');
  
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

// ✅ MANEJAR FORMULARIO DE DETALLES
async function handleDetallesDataExchange(formData) {
  const { nombre, email, telefono, comentarios, ...reservaData } = formData;
  
  console.log('📝 Datos personales recibidos:', { nombre, email, telefono });

  // Validar campos requeridos
  if (!nombre || !email || !telefono) {
    console.log('❌ Faltan campos en detalles personales');
    return {
      screen: "DETALLES",
      data: {
        ...reservaData,
        error_message: "Por favor completa nombre, email y teléfono"
      }
    };
  }

  // Combinar datos
  const datosCompletos = {
    ...reservaData,
    nombre,
    email,
    telefono,
    comentarios: comentarios || ''
  };

  console.log('✅ Datos completos, generando resumen');
  
  return {
    screen: "RESUMEN",
    data: await generarDatosResumen(datosCompletos)
  };
}

// ✅ MANEJAR CONFIRMACIÓN DE RESERVA
async function handleResumenDataExchange(formData) {
  const { estado, ...reservaData } = formData;
  
  console.log('✅ Confirmación de reserva - Estado:', estado);

  if (estado === 'confirmada') {
    try {
      // Enviar notificaciones
      await enviarNotificacionReserva(reservaData);
      await enviarConfirmacionCliente(reservaData);
      
      console.log('🎉 Reserva confirmada exitosamente');
      
      // ✅ FINALIZAR FLOW - según documentación
      return {
        screen: "SUCCESS",
        data: {
          extension_message_response: {
            params: {
              flow_token: `hotel_${Date.now()}`,
              reserva_id: `reserva_${Date.now()}`,
              mensaje: "Reserva confirmada exitosamente"
            }
          }
        }
      };
      
    } catch (error) {
      console.error('❌ Error confirmando reserva:', error);
      return {
        screen: "RESUMEN",
        data: {
          ...reservaData,
          error_message: "Error al confirmar la reserva. Por favor contacta al hotel."
        }
      };
    }
  }

  // Si no está confirmada, volver al resumen
  return {
    screen: "RESUMEN",
    data: reservaData
  };
}

// ✅ GENERAR DATOS PARA RESUMEN
async function generarDatosResumen(datos) {
  const precios = {
    "master_suite_junior": 520,
    "master_suite": 600,
    "master_suite_jacuzzi": 900,
    "master_suite_jacuzzi_sauna": 1240,
    "master_suite_alberca": 1990
  };

  const nombresHabitaciones = {
    "master_suite_junior": "🏨 Master Suite Junior",
    "master_suite": "🛌 Master Suite",
    "master_suite_jacuzzi": "🛁 Master Suite con Jacuzzi",
    "master_suite_jacuzzi_sauna": "♨️ Master Suite con Jacuzzi y Sauna",
    "master_suite_alberca": "🏊 Master Suite con Alberca"
  };

  const precio = precios[datos.tipo_habitacion] || 0;
  const fechaObj = new Date(datos.fecha);
  const fechaFormateada = fechaObj.toLocaleDateString('es-MX', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const habitacionNombre = nombresHabitaciones[datos.tipo_habitacion] || "Habitación";

  return {
    reserva: `${habitacionNombre}\\n📅 Fecha: ${fechaFormateada}\\n🕓 Hora: ${datos.hora}\\n👥 Personas: ${datos.numero_personas}`,
    detalles: `👤 Nombre: ${datos.nombre}\\n📧 Email: ${datos.email}\\n📞 Teléfono: ${datos.telefono}${datos.comentarios ? `\\n💬 Comentarios: ${datos.comentarios}` : ''}`,
    precio_total: `💰 Precio total: $${precio} MXN`
  };
}

// ✅ ENVIAR NOTIFICACIONES (mantener igual)
async function enviarNotificacionReserva(datos) {
  // ... mismo código que antes
}

async function enviarConfirmacionCliente(datos) {
  // ... mismo código que antes
}

module.exports = { processFlowLogic };