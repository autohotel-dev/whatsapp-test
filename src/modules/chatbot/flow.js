// flow.js - Versión con paquetes
const { sendTextMessage } = require('../../services/message-sender.js');
const { 
  PAQUETES_DATA,
  HORAS_DATA,
  PERSONAS_DATA,
  getHabitacionesPorPaquete,
  getPrecio,
  getNombreHabitacion,
  getNombrePaquete
} = require('./flow-data.js');

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

async function processFlowLogic(decryptedBody) {
  console.log('🔧 Procesando flow logic - Pantalla:', decryptedBody.screen);

  const { screen, action, data, form_response } = decryptedBody;

  // ✅ MANEJAR VERIFICACIÓN DE ENDPOINT (Health Check de Meta)
  // action puede ser un string "ping" o un objeto {name: "ping"}
  if (action === 'ping' || action?.name === 'ping') {
    console.log('🏥 Health check/ping detectado - Enviando respuesta de verificación');
    return {
      version: "3.0",
      data: {
        status: "active"
      }
    };
  }
  
  // Si tiene pantalla pero no action o action es 'init', es apertura del flow
  if (screen && (!action || action === 'init' || action?.name === 'init')) {
    console.log('🎬 Apertura de flow detectada - Procesando pantalla:', screen);
  }

  // Si no hay pantalla y action es 'data_exchange', es un on-init de RESERVA
  if (!screen && (action === 'data_exchange' || action?.name === 'data_exchange')) {
    console.log('🎬 Data exchange inicial detectado - Cargando pantalla RESERVA');
    return await handleReservaScreen(decryptedBody);
  }

  // Si hay data con screen RESERVA en el payload, también procesarlo
  if (data?.screen === 'RESERVA' && (action === 'data_exchange' || action?.name === 'data_exchange')) {
    console.log('🔄 Data exchange por selección - Actualizando datos de RESERVA');
    return await handleReservaScreen(decryptedBody);
  }

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
  console.log('🔄 ENVIANDO DATOS DINÁMICOS DEL BACKEND');
  
  // Verificar si viene de una selección de paquete
  const paqueteSeleccionado = data.data?.paquete_selected || 'deseo';
  if (data.data?.paquete_selected) {
    console.log('📦 Paquete seleccionado:', paqueteSeleccionado);
  }

  // Generar fechas para los próximos 10 días (datos dinámicos y actualizados)
  const fechas = generarFechasReales().slice(0, 10).map(date => ({
    id: date.id,
    title: date.title
  }));

  // Obtener habitaciones según el paquete seleccionado
  const habitaciones = getHabitacionesPorPaquete(paqueteSeleccionado);

  // Estructura del flow con el formato exacto esperado por Meta
  const response = {
    "version": "3.0",
    "screen": "RESERVA",
    "data": {
      "paquete": PAQUETES_DATA,
      "tipo_habitacion": habitaciones,
      "is_tipo_habitacion_enabled": !!paqueteSeleccionado,
      "fecha": fechas,
      "is_fecha_enabled": true,
      "hora": HORAS_DATA,
      "is_hora_enabled": true,
      "numero_personas": PERSONAS_DATA,
      "is_numero_personas_enabled": true
    }
  };

  console.log('✅ Datos del flow preparados:');
  console.log('   - Paquetes:', PAQUETES_DATA.length, 'opciones');
  console.log('   - Habitaciones:', habitaciones.length, 'opciones (paquete:', paqueteSeleccionado + ')');
  console.log('   - Fechas:', fechas.length, 'opciones');
  console.log('   - Horas:', HORAS_DATA.length, 'opciones');
  console.log('   - Personas:', PERSONAS_DATA.length, 'opciones');
  
  return response;
}

// ✅ MANEJAR PANTALLA DE DETALLES
async function handleDetallesScreen(body) {
  const { data: screenData, form_response } = body;

  console.log('📋 Procesando pantalla DETALLES');
  console.log('📦 Datos recibidos:', screenData);

  // Los datos pueden venir en form_response o en data (dependiendo del action)
  const datosFormulario = form_response || screenData || {};
  
  const { nombre, email, telefono, comentarios, paquete, tipo_habitacion, fecha, hora, numero_personas } = datosFormulario;

  console.log('📝 Datos personales recibidos:', {
    nombre: nombre ? '✓' : '✗',
    email: email ? '✓' : '✗',
    telefono: telefono ? '✓' : '✗'
  });

  // Validar campos requeridos
  if (!nombre || !email || !telefono) {
    console.log('❌ Faltan campos obligatorios en datos personales');
    return {
      "version": "3.0",
      "screen": "DETALLES",
      "data": {
        tipo_habitacion: tipo_habitacion || '',
        fecha: fecha || '',
        hora: hora || '',
        numero_personas: numero_personas || ''
      }
    };
  }

  // Combinar datos de reserva y detalles
  const datosCompletos = {
    "paquete": paquete,
    "tipo_habitacion": tipo_habitacion,
    "fecha": fecha,
    "hora": hora,
    "numero_personas": numero_personas,
    "nombre": nombre,
    "email": email,
    "telefono": telefono,
    "comentarios": comentarios || ''
  };

  console.log('✅ Datos completos, pasando a RESUMEN');
  console.log('📊 Datos completos:', datosCompletos);

  // Generar el resumen formateado
  const datosResumen = await generarDatosResumen(datosCompletos);

  return {
    "version": "3.0",
    "screen": "RESUMEN",
    "data": {
      ...datosResumen,
      ...datosCompletos  // Mantener todos los datos originales también
    }
  };
}

// ✅ MANEJAR PANTALLA DE RESUMEN
async function handleResumenScreen(data) {
  console.log('📋 Procesando pantalla RESUMEN');
  console.log('📦 Data recibida:', JSON.stringify(data, null, 2));

  // Los datos pueden venir en data.data o en el payload directamente
  const payload = data.data || data.flow_token || data;
  
  // Si viene del botón "Confirmar Reserva", el estado estará en el payload
  if (payload.estado === 'confirmada') {
    try {
      console.log('✅ Confirmando reserva con datos:', payload);

      // ✅ GENERAR RESUMEN FORMATEADO
      const datosResumen = await generarDatosResumen(payload);

      // ✅ ENVIAR NOTIFICACIÓN POR WHATSAPP AL HOTEL
      await enviarNotificacionReserva(payload);

      // ✅ ENVIAR CONFIRMACIÓN AL CLIENTE
      await enviarConfirmacionCliente(payload);

      console.log('✅ Reserva confirmada y notificaciones enviadas');

      return {
        "version": "3.0",
        "screen": "SUCCESS",
        "data": {
          "extension_message_response": {
            "params": {
              "flow_token": "FLOW_TOKEN_PLACEHOLDER"
            }
          }
        }
      };

    } catch (error) {
      console.error('❌ Error confirmando reserva:', error);
      return {
        "version": "3.0",
        "screen": "RESUMEN",
        "data": {
          "error_message": "⚠️ Error al confirmar. Intenta nuevamente."
        }
      };
    }
  }

  // Si es la primera carga de la pantalla RESUMEN, enviar los datos formateados
  const datosResumen = await generarDatosResumen(payload);

  return {
    "version": "3.0",
    "screen": "RESUMEN",
    "data": {
      ...datosResumen,
      ...payload
    }
  };
}

// ✅ GENERAR DATOS PARA EL RESUMEN
async function generarDatosResumen(datos) {
  // Obtener precio según paquete y habitación
  const precio = getPrecio(datos.paquete, datos.tipo_habitacion);
  
  const fechaObj = new Date(datos.fecha);
  const fechaFormateada = fechaObj.toLocaleDateString('es-MX', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  // Obtener nombres formateados
  const habitacionNombre = getNombreHabitacion(datos.tipo_habitacion);
  const paqueteNombre = getNombrePaquete(datos.paquete);

  const textoReserva = `${paqueteNombre}\n${habitacionNombre}\n📅 Fecha: ${fechaFormateada}\n🕓 Hora: ${datos.hora}\n👥 Personas: ${datos.numero_personas} personas`;

  const textoDetalles = `👤 Nombre: ${datos.nombre}\n📧 Email: ${datos.email}\n📞 Teléfono: ${datos.telefono}${datos.comentarios ? `\n💬 Comentarios: ${datos.comentarios}` : ''}`;

  const precioTotal = `💰 Precio total: $${precio.toLocaleString('es-MX')} MXN\n\n📍 Ubicación: Auto Hotel Luxor\nAv. Prol. Boulevard Bernardo Quintana, 1000B\nQuerétaro, México\n\n📞 Informes: (442) 210 32 92`;

  console.log('📊 Resumen generado para pantalla');
  console.log('   - Paquete:', paqueteNombre);
  console.log('   - Habitación:', habitacionNombre);
  console.log('   - Precio:', precio);

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
    const precio = getPrecio(datos.paquete, datos.tipo_habitacion);
    const habitacionNombre = getNombreHabitacion(datos.tipo_habitacion).replace(/^[^\s]+\s/, ''); // Quitar emoji
    const paqueteNombre = getNombrePaquete(datos.paquete).replace(/^[^\s]+\s/, ''); // Quitar emoji

    const mensajeHotel = `🏨 **NUEVA RESERVA - Auto Hotel Luxor** 🏨

📋 **Detalles de la Reserva:**
• Paquete: ${paqueteNombre}
• Habitación: ${habitacionNombre}
• Fecha: ${datos.fecha}
• Hora: ${datos.hora}
• Personas: ${datos.numero_personas}

👤 **Datos del Cliente:**
• Nombre: ${datos.nombre}
• Email: ${datos.email}
• Teléfono: ${datos.telefono}
${datos.comentarios ? `• Comentarios: ${datos.comentarios}` : ''}

💰 **Total: $${precio.toLocaleString('es-MX')} MXN**

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
    const precio = getPrecio(datos.paquete, datos.tipo_habitacion);
    const habitacionNombre = getNombreHabitacion(datos.tipo_habitacion);
    const paqueteNombre = getNombrePaquete(datos.paquete).replace(/^[^\s]+\s/, ''); // Quitar emoji

    const mensajeCliente = `✅ *¡Reserva Confirmada!* - Auto Hotel Luxor 🏨

Gracias *${datos.nombre}*, tu reserva ha sido confirmada:

📋 *Detalles de tu Reserva:*
• Paquete: ${paqueteNombre}
• ${habitacionNombre}
• Fecha: ${datos.fecha}  
• Hora de check-in: ${datos.hora}
• Número de personas: ${datos.numero_personas}

💰 *Total a pagar: $${precio.toLocaleString('es-MX')} MXN*

📍 *Ubicación:*
Auto Hotel Luxor
Av. Prol. Boulevard Bernardo Quintana, 1000B
Querétaro, México

📞 *Informes y reservaciones:*
(442) 210 32 92

_¡Te esperamos! Recuerda traer identificación oficial._

_Horarios:_
• Domingo a Jueves: 06:00 AM - 12:00 hrs
• Viernes y Sábado: 8 horas`;

    console.log('📤 Enviando confirmación al cliente:', datos.telefono);
    await sendTextMessage(datos.telefono, mensajeCliente);

  } catch (error) {
    console.error('❌ Error enviando confirmación al cliente:', error);
    throw error;
  }
}

module.exports = { processFlowLogic };