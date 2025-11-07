const express = require('express');
const { decryptRequest } = require('./decrypt.js');
const { encryptResponse } = require('./encrypt.js');
const { processFlowLogic } = require('./flow.js');
const hotelChatbot = require('./autoreply.js');
const sendFlowMessage = require('./send-flow-message.js');

const app = express();
app.use(express.json());

// ✅ MEMORIA PARA EVITAR DUPLICADOS
const messageCache = new Map();
const CACHE_TTL = 30000; // 30 segundos

// ✅ LIMPIAR CACHE CADA MINUTO
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of messageCache.entries()) {
    if (now - timestamp > CACHE_TTL) {
      messageCache.delete(key);
    }
  }
}, 60000);

// ✅ FUNCIÓN PARA DETECTAR INTENCIÓN DE RESERVA (CORREGIDA)
function isReservationIntent(message) {
  const reservationKeywords = [
    'reservar', 'reserva', 'reservación', 'reservacion',
    'hacer reserva', 'quiero reservar', 'reservar ahora',
    'agendar', 'booking', 'quiero una habitación',
    'necesito una habitación', 'disponibilidad', 'reservar habitación',
    'reservar cuarto', 'hacer reservación'
  ];

  return reservationKeywords.some(keyword =>
    message.includes(keyword)
  );
}

// ✅ WEBHOOK PARA META - CON FLOW INTEGRADO
app.post('/webhook', async (req, res) => {
  console.log('🟢 POST /webhook - Request recibido');

  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    // 1. SI ES UN FLOW REQUEST (RESPUESTA DEL FLOW)
    if (req.body.encrypted_flow_data && req.body.encrypted_aes_key) {
      console.log('🔐 ===== FLOW REQUEST DETECTADO =====');
      console.log('📦 Raw body recibido');
      console.log('   - encrypted_flow_data:', req.body.encrypted_flow_data ? `Present (${req.body.encrypted_flow_data.length} chars)` : 'Missing');
      console.log('   - encrypted_aes_key:', req.body.encrypted_aes_key ? `Present (${req.body.encrypted_aes_key.length} chars)` : 'Missing');
      console.log('   - initial_vector:', req.body.initial_vector ? `Present (${req.body.initial_vector.length} chars)` : 'Missing');

      try {
        const { decryptedBody, aesKeyBuffer, initialVectorBuffer } = decryptRequest(req.body);
        console.log('🎯 Body desencriptado:', JSON.stringify(decryptedBody, null, 2));

        const screenResponse = await processFlowLogic(decryptedBody);
        console.log('📤 Response a enviar:', JSON.stringify(screenResponse, null, 2));

        const encryptedResponse = encryptResponse(screenResponse, aesKeyBuffer, initialVectorBuffer);
        console.log('🔒 Response encriptado:', encryptedResponse);

        return res.status(200).send(encryptedResponse);

      } catch (error) {
        console.error('💥 Error procesando flow request:', error);
        return res.status(500).send('FLOW_PROCESSING_ERROR');
      }
    }

    // 2. SI ES UN MENSAJE DE TEXTO (INICIO DE CONVERSACIÓN)
    const message = value?.messages?.[0];
    if (message && message.type === 'text') {
      const userPhone = message.from;
      const messageId = message.id;
      const messageText = message.text.body;

      // ✅ EVITAR DUPLICADOS
      if (messageCache.has(messageId)) {
        console.log(`⏭️  Mensaje duplicado ${messageId} - Ignorando`);
        return res.status(200).send('EVENT_RECEIVED');
      }

      // ✅ AGREGAR A CACHE
      messageCache.set(messageId, Date.now());
      console.log(`💬 Nuevo mensaje de ${userPhone}: "${messageText}"`);

      // ✅ DETECTAR SI ES UNA RESERVA PARA ENVIAR FLOW
      const cleanMessage = messageText.toLowerCase().trim();

      if (isReservationIntent(cleanMessage)) { // ✅ CORREGIDO: usar la función directamente
        console.log(`🎯 Usuario ${userPhone} quiere reservar - Enviando flow`);

        try {
          // Enviar mensaje de confirmación primero
          await hotelChatbot.sendTextMessage(userPhone,
            `🎉 ¡Excelente! Te ayudo a reservar tu habitación.\n\nVamos a necesitar:\n1. 🏨 Tipo de habitación\n2. 📅 Fecha de reservación\n3. 👥 Número de personas\n4. 📝 Tus datos de contacto\n\n*Presiona el botón "Comenzar Reserva" para continuar*`
          );

          // Enviar el flow después de un breve delay
          setTimeout(async () => {
            try {
              await sendFlowMessage(userPhone);
              console.log(`✅ Flow enviado exitosamente a ${userPhone}`);
            } catch (flowError) {
              console.error(`❌ Error enviando flow a ${userPhone}:`, flowError.message);
              // Fallback: enviar mensaje de error
              await hotelChatbot.sendTextMessage(userPhone,
                '⚠️ Lo siento, hubo un problema al cargar el formulario de reserva. Por favor intenta de nuevo en unos momentos o contacta a recepción al 442 210 3292.'
              );
            }
          }, 1000);

        } catch (error) {
          console.error(`❌ Error procesando reserva para ${userPhone}:`, error);
          await hotelChatbot.sendTextMessage(userPhone,
            '⚠️ Lo siento, hubo un error. Por favor intenta de nuevo.'
          );
        }
      } else {
        // ✅ PROCESAR CON CHATBOT NORMAL
        await hotelChatbot.handleMessage(userPhone, messageText);
      }

      return res.status(200).send('EVENT_RECEIVED');
    }

    // 3. SI ES UN MENSAJE INTERACTIVO (BOTONES, LISTAS, ETC.)
    if (message && message.type === 'interactive') {
      const userPhone = message.from;
      const messageId = message.id;

      // ✅ EVITAR DUPLICADOS
      if (messageCache.has(messageId)) {
        console.log(`⏭️  Mensaje interactivo duplicado ${messageId} - Ignorando`);
        return res.status(200).send('EVENT_RECEIVED');
      }

      messageCache.set(messageId, Date.now());

      const interactiveType = message.interactive.type;
      console.log(`🔘 Mensaje interactivo de ${userPhone}: ${interactiveType}`);

      // Manejar otros tipos de mensajes interactivos si es necesario
      return res.status(200).send('EVENT_RECEIVED');
    }

    // 4. SI ES UNA ENTREGA O LECTURA
    if (value?.message_deliveries || value?.message_reads) {
      console.log('📨 Evento de entrega/lectura - Ignorando');
      return res.status(200).send('EVENT_RECEIVED');
    }

    // 5. SI ES OTRO TIPO DE EVENTO
    if (value?.statuses) {
      console.log('📊 Evento de estado:', value.statuses[0]?.status);
      return res.status(200).send('EVENT_RECEIVED');
    }

    // 6. EVENTO NO MANEJADO
    console.log('❓ Evento no manejado:', Object.keys(value || {}));
    res.status(200).send('EVENT_RECEIVED');

  } catch (error) {
    console.error('💥 Error en webhook:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).send('INTERNAL_SERVER_ERROR');
  }
});

// ✅ VERIFICACIÓN DEL WEBHOOK
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Usar variable de entorno o valor por defecto
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'hotel_luxor_2024_token';

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ VERIFICACIÓN EXITOSA');
    return res.status(200).send(challenge);
  }

  console.log('❌ Verificación fallida');
  console.log('Token recibido:', token);
  console.log('Token esperado:', VERIFY_TOKEN);
  res.status(403).send('VERIFICATION_FAILED');
});

// ✅ HEALTH CHECK MEJORADO
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Auto Hotel Luxor Chatbot',
    version: '2.0.0',
    features: ['Reservations Flow', 'Hotel Information', 'Interactive Chat'],
    timestamp: new Date().toISOString(),
    cache_size: messageCache.size,
    uptime: process.uptime()
  });
});

// ✅ RUTA PARA TESTEAR EL FLOW MANUALMENTE
app.post('/test-flow/:phone', async (req, res) => {
  try {
    const phone = req.params.phone;
    console.log(`🧪 Test manual de flow para: ${phone}`);

    await sendFlowMessage(phone);
    res.json({ success: true, message: 'Flow enviado para testing' });
  } catch (error) {
    console.error('Error en test flow:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ MANEJO DE ERRORES GLOBAL
app.use((error, req, res, next) => {
  console.error('💥 Error global no manejado:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Algo salió mal en el servidor'
  });
});

// ✅ INICIAR SERVIDOR
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('🏨 ==================================');
  console.log('🏨 AUTO HOTEL LUXOR CHATBOT');
  console.log('🏨 ==================================');
  console.log('✅ Servidor iniciado en puerto:', PORT);
  console.log('✅ Webhook: /webhook');
  console.log('✅ Health check: /health');
  console.log('✅ Flow activado con: "reservar habitación"');
  console.log('🏨 ==================================');
});

module.exports = app;