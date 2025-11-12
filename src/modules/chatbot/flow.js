// flow.js - Versión con paquetes
const { sendTextMessage, sendImageMessage } = require('../../services/message-sender.js');
const { 
  PAQUETES_DATA,
  HORAS_DATA,
  PERSONAS_DATA,
  BOTELLAS_DATA,
  REFRESCOS_DATA,
  getHabitacionesPorPaquete,
  getPrecio,
  getNombreHabitacion,
  getNombrePaquete,
  getNombreBotella,
  getNombreRefresco
} = require('./flow-data.js');
const { database } = require('../database/database.js');

// ✅ COMBINAR REFRESCOS INDIVIDUALES EN ARRAY (CON NOMBRES FORMATEADOS)
function combinarRefrescos(datos) {
  const refrescos = [];
  for (let i = 1; i <= 5; i++) {
    const refrescoId = datos[`refresco${i}`];
    if (refrescoId && refrescoId.trim() !== '') {
      // Guardar el nombre formateado en lugar del ID
      refrescos.push(getNombreRefresco(refrescoId));
    }
  }
  return refrescos;
}

// ✅ FORMATEAR REFRESCOS PARA MOSTRAR
function formatearRefrescos(refrescos) {
  if (!refrescos || refrescos.length === 0) return '';
  return refrescos.join(', '); // Los refrescos ya vienen formateados
}

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
  
  // Obtener botellas según el paquete seleccionado
  let botellasDelPaquete = BOTELLAS_DATA[paqueteSeleccionado] || BOTELLAS_DATA['deseo'] || [];
  
  // Asegurar que siempre sea un array
  if (!Array.isArray(botellasDelPaquete)) {
    console.error('⚠️ ERROR: botellasDelPaquete no es un array, convirtiendo...');
    botellasDelPaquete = [];
  }
  
  // Determinar cuántos refrescos según el paquete
  const cantidadRefrescos = {
    'deseo': 0,        // No incluye refrescos
    'enamorados': 2,   // 2 refrescos
    'premium': 5       // 5 refrescos
  };
  
  const numRefrescos = cantidadRefrescos[paqueteSeleccionado] || 0;
  
  // Debug: Verificar tipo de datos
  console.log('🔍 DEBUG:', {
    paquete: paqueteSeleccionado,
    botellas: botellasDelPaquete.length,
    refrescos: numRefrescos
  });

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
      "is_numero_personas_enabled": true,
      "botella": botellasDelPaquete,
      "is_botella_enabled": true,
      "refresco": REFRESCOS_DATA,
      "is_refresco1_enabled": numRefrescos >= 1,
      "is_refresco2_enabled": numRefrescos >= 2,
      "is_refresco3_enabled": numRefrescos >= 3,
      "is_refresco4_enabled": numRefrescos >= 4,
      "is_refresco5_enabled": numRefrescos >= 5
    }
  };

  console.log('✅ Datos del flow preparados:');
  console.log('   - Paquetes:', PAQUETES_DATA.length, 'opciones');
  console.log('   - Habitaciones:', habitaciones.length, 'opciones (paquete:', paqueteSeleccionado + ')');
  console.log('   - Fechas:', fechas.length, 'opciones');
  console.log('   - Horas:', HORAS_DATA.length, 'opciones');
  console.log('   - Personas:', PERSONAS_DATA.length, 'opciones');
  console.log('   - Botellas:', botellasDelPaquete.length, 'opciones (paquete:', paqueteSeleccionado + ')');
  console.log('   - Refrescos:', REFRESCOS_DATA.length, 'opciones');
  
  // Log completo del objeto de respuesta para debug
  console.log('📤 Response completo:', JSON.stringify(response, null, 2));
  
  return response;
}

// ✅ MANEJAR PANTALLA DE DETALLES
async function handleDetallesScreen(body) {
  const { data: screenData, form_response } = body;

  console.log('📋 Procesando pantalla DETALLES');
  console.log('📦 Datos recibidos:', screenData);

  // Los datos pueden venir en form_response o en data (dependiendo del action)
  const datosFormulario = form_response || screenData || {};
  
  const { nombre, email, telefono, comentarios, paquete, tipo_habitacion, fecha, hora, botella, refresco } = datosFormulario;

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
        numero_personas: "2",
        botella: botella || '',
        refresco: refresco || ''
      }
    };
  }

  // Combinar datos de reserva y detalles
  const datosCompletos = {
    "paquete": paquete,
    "tipo_habitacion": tipo_habitacion,
    "fecha": fecha,
    "hora": hora,
    "numero_personas": "2",
    "nombre": nombre,
    "email": email,
    "telefono": telefono,
    "comentarios": comentarios || '',
    "botella": botella,
    "refresco": refresco
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

      // ✅ GUARDAR RESERVA EN BASE DE DATOS
      const reservaGuardada = await guardarReservaEnBD(payload);
      console.log('💾 Reserva guardada en BD:', reservaGuardada?._id);

      // ✅ GENERAR RESUMEN FORMATEADO
      const datosResumen = await generarDatosResumen(payload);

      // ✅ ENVIAR NOTIFICACIÓN POR WHATSAPP AL HOTEL
      await enviarNotificacionReserva(payload, reservaGuardada?._id);

      // ✅ ENVIAR CONFIRMACIÓN AL CLIENTE
      await enviarConfirmacionCliente(payload, reservaGuardada?._id);

      console.log('✅ Reserva confirmada, guardada en BD y notificaciones enviadas');

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
  const botellaNombre = getNombreBotella(datos.botella);
  
  // Combinar todos los refrescos seleccionados
  const refrescos = combinarRefrescos(datos);
  const refrescosTexto = formatearRefrescos(refrescos);
  
  // Construir texto de reserva
  let textoReserva = `${paqueteNombre}\n${habitacionNombre}\n📅 Fecha: ${fechaFormateada}\n🕓 Hora: ${datos.hora}\n👥 Personas: 2 personas\n🍾 Bebida: ${botellaNombre}`;
  
  if (refrescosTexto) {
    textoReserva += `\n🥤 Refrescos: ${refrescosTexto}`;
  }

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
async function enviarNotificacionReserva(datos, reservaId) {
  try {
    const precio = getPrecio(datos.paquete, datos.tipo_habitacion);
    const habitacionNombre = getNombreHabitacion(datos.tipo_habitacion).replace(/^[^\s]+\s/, ''); // Quitar emoji
    const paqueteNombre = getNombrePaquete(datos.paquete).replace(/^[^\s]+\s/, ''); // Quitar emoji
    
    // Combinar refrescos
    const refrescos = combinarRefrescos(datos);
    const refrescosTexto = formatearRefrescos(refrescos);

    let mensajeHotel = `🏨 **NUEVA RESERVA - Auto Hotel Luxor** 🏨

📋 **Detalles de la Reserva:**
• Paquete: ${paqueteNombre}
• Habitación: ${habitacionNombre}
• Fecha: ${datos.fecha}
• Hora: ${datos.hora}
• Personas: 2
• Botella: ${getNombreBotella(datos.botella)}`;
    
    if (refrescosTexto) {
      mensajeHotel += `\n• Refrescos: ${refrescosTexto}`;
    }
    
    mensajeHotel += `

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

    // 💾 Guardar notificación en BD
    try {
      await database.saveNotification({
        type: 'reservation_hotel',
        recipientPhone: telefonoHotel,
        message: mensajeHotel,
        reservationId: reservaId,
        status: 'sent',
        metadata: {
          customerName: datos.nombre,
          customerPhone: datos.telefono,
          packageType: datos.paquete,
          roomType: datos.tipo_habitacion,
          totalAmount: precio,
          bottle: getNombreBotella(datos.botella),
          sodas: refrescosTexto || 'Sin refrescos'
        }
      });
      console.log('💾 Notificación al hotel guardada en BD');
    } catch (dbError) {
      console.error('⚠️ Error guardando notificación en BD:', dbError.message);
    }

  } catch (error) {
    console.error('❌ Error enviando notificación al hotel:', error);
    throw error;
  }
}

// ✅ ENVIAR CONFIRMACIÓN AL CLIENTE CON INSTRUCCIONES DE PAGO
async function enviarConfirmacionCliente(datos, reservaId) {
  try {
    const precio = getPrecio(datos.paquete, datos.tipo_habitacion);
    const habitacionNombre = getNombreHabitacion(datos.tipo_habitacion);
    const paqueteNombre = getNombrePaquete(datos.paquete).replace(/^[^\s]+\s/, ''); // Quitar emoji
    
    // Combinar refrescos
    const refrescos = combinarRefrescos(datos);
    const refrescosTexto = formatearRefrescos(refrescos);

    // Mensaje 1: Confirmación de reserva
    let mensajeConfirmacion = `✅ *Pre-Reserva Registrada* - Auto Hotel Luxor 🏨

Gracias *${datos.nombre}*, tu reserva ha sido pre-registrada:

📋 *Detalles de tu Reserva:*
• Paquete: ${paqueteNombre}
• ${habitacionNombre}
• Fecha: ${datos.fecha}  
• Hora de check-in: ${datos.hora}
• Número de personas: 2
• Botella: ${getNombreBotella(datos.botella)}`;
    
    if (refrescosTexto) {
      mensajeConfirmacion += `\n• Refrescos: ${refrescosTexto}`;
    }
    
    mensajeConfirmacion += `

💰 *Total a pagar: $${precio.toLocaleString('es-MX')} MXN*

📍 *Ubicación:*
Auto Hotel Luxor
Av. Prol. Boulevard Bernardo Quintana, 1000B
Querétaro, México

📞 *Informes: (442) 210 32 92*`;

    console.log('📤 Enviando confirmación al cliente:', datos.telefono);
    await sendTextMessage(datos.telefono, mensajeConfirmacion);
    
    // Delay para que los mensajes lleguen en orden
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mensaje 2: Instrucciones de pago
    const mensajePago = `💳 *INSTRUCCIONES DE PAGO*

⚠️ *IMPORTANTE:* Para confirmar tu reserva, debes realizar el pago en las próximas *6 HORAS*.

🏦 *Datos para transferencia:*
Te envío una imagen con los datos bancarios 👇`;

    await sendTextMessage(datos.telefono, mensajePago);
    
    // Delay antes de enviar imagen
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mensaje 3: Enviar imagen con datos bancarios
    const DATOS_BANCARIOS_URL = process.env.PAYMENT_IMAGE_URL || 'https://i.imgur.com/XXXXXXX.jpg'; // REEMPLAZAR CON TU URL
    
    try {
      console.log('📸 Enviando imagen con datos bancarios');
      await sendImageMessage(datos.telefono, DATOS_BANCARIOS_URL, '💳 Datos bancarios para transferencia');
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (imgError) {
      console.error('⚠️ Error enviando imagen bancaria:', imgError.message);
      // Si falla la imagen, enviar datos por texto
      const datosBancariosTexto = `💳 *DATOS BANCARIOS:*

🏦 Banco: [TU BANCO]
👤 Titular: [NOMBRE TITULAR]
💳 CLABE: [TU CLABE]
📱 Tarjeta: [TU TARJETA]

_O paga con transferencia/depósito_`;
      await sendTextMessage(datos.telefono, datosBancariosTexto);
    }
    
    // Mensaje 4: Instrucciones finales
    const mensajeInstrucciones = `📤 *ENVÍA TU COMPROBANTE*

Después de realizar tu transferencia:
1️⃣ Toma una foto clara del comprobante
2️⃣ Envíalo como *imagen* a este chat
3️⃣ Espera la confirmación (te responderemos pronto)

⏰ *IMPORTANTE:*
• Tienes *6 HORAS* para realizar el pago
• Si no recibes el comprobante en ese tiempo, tu reserva será *CANCELADA automáticamente*
• Guarda tu código de reserva: *${reservaId || 'Ver mensaje anterior'}*

❓ Dudas: (442) 210 32 92

_Gracias por tu preferencia_ 🏨✨`;

    await sendTextMessage(datos.telefono, mensajeInstrucciones);

    // 💾 Guardar notificación en BD
    try {
      await database.saveNotification({
        type: 'reservation_confirmation',
        recipientPhone: datos.telefono,
        message: mensajeConfirmacion,
        reservationId: reservaId,
        status: 'sent',
        metadata: {
          customerName: datos.nombre,
          packageType: datos.paquete,
          roomType: datos.tipo_habitacion,
          totalAmount: precio,
          checkInDate: datos.fecha,
          checkInTime: datos.hora
        }
      });
      console.log('💾 Confirmación al cliente guardada en BD');
    } catch (dbError) {
      console.error('⚠️ Error guardando confirmación en BD:', dbError.message);
    }

  } catch (error) {
    console.error('❌ Error enviando confirmación al cliente:', error);
    throw error;
  }
}

// ✅ GUARDAR RESERVA EN BASE DE DATOS
async function guardarReservaEnBD(datos) {
  try {
    // Generar código de confirmación único
    const confirmationCode = `LXR${Date.now().toString().slice(-8)}`;
    
    // Obtener precio
    const precio = getPrecio(datos.paquete, datos.tipo_habitacion);
    
    // Formatear fecha para Date object
    const fechaReserva = new Date(datos.fecha + 'T' + datos.hora + ':00');
    
    // Calcular deadline de pago (6 horas desde ahora)
    const paymentDeadline = new Date();
    paymentDeadline.setHours(paymentDeadline.getHours() + 6);
    
    // Combinar refrescos
    const refrescos = combinarRefrescos(datos);
    console.log('🥤 Refrescos a guardar:', refrescos);
    
    // Preparar datos de reserva para BD
    const reservationData = {
      userPhone: datos.telefono,
      packageType: datos.paquete,
      roomType: datos.tipo_habitacion,
      date: fechaReserva,
      checkInTime: datos.hora,
      numberOfGuests: parseInt(datos.numero_personas) || 1,
      customerName: datos.nombre,
      customerEmail: datos.email,
      specialRequests: datos.comentarios || '',
      status: 'pending_payment',  // Estado inicial: esperando pago
      paymentDeadline: paymentDeadline,
      source: 'whatsapp',
      totalAmount: precio,
      confirmationCode: confirmationCode,
      bottle: getNombreBotella(datos.botella),
      sodas: refrescos  // Array de refrescos
    };

    console.log('💾 Guardando reserva en MongoDB:', {
      nombre: datos.nombre,
      telefono: datos.telefono,
      fecha: datos.fecha,
      precio: precio,
      botella: getNombreBotella(datos.botella),
      refrescos: refrescos.length
    });

    // Guardar en base de datos
    const reserva = await database.createReservation(reservationData);
    
    if (reserva) {
      console.log('✅ Reserva guardada exitosamente - ID:', reserva._id);
      console.log('✅ Código de confirmación:', confirmationCode);
      return reserva;
    } else {
      console.log('⚠️ No se pudo guardar la reserva (BD no conectada)');
      return null;
    }

  } catch (error) {
    console.error('❌ Error guardando reserva en BD:', error);
    // No lanzar error para que el proceso continúe
    return null;
  }
}

module.exports = { processFlowLogic };