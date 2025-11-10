const express = require('express');
const cors = require('cors');
const path = require('path');
const { decryptRequest } = require('./src/utils/decrypt.js');
const { encryptResponse } = require('./src/utils/encrypt.js');
const { processFlowLogic } = require('./src/modules/chatbot/flow.js');
const hotelChatbot = require('./src/modules/chatbot/autoreply.js');
const sendFlowMessage = require('./src/services/send-flow-message.js');
const { sendTextMessage } = require('./src/services/message-sender.js');
const analytics = require('./src/modules/analytics/analytics.js');
const { database, models } = require('./src/modules/database/database.js');
const aiNLP = require('./src/modules/ai/ai-nlp.js');
const notificationSystem = require('./src/modules/notifications/notifications.js');
const uxEnhancer = require('./src/modules/ux/ux-enhancer.js');
const cloudinaryUploader = require('./src/services/cloudinary-uploader.js');

const app = express();

// ✅ CONFIGURACIÓN CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir peticiones sin origen (como apps móviles o Postman)
    if (!origin) return callback(null, true);
    
    // Lista de orígenes permitidos
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'https://whatsapp-test-gwdx.onrender.com'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://localhost')) {
      callback(null, true);
    } else {
      callback(null, true); // Para desarrollo, permitir todos los orígenes
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json());

// Servir archivos estáticos (dashboard)
app.use(express.static(path.join(__dirname, 'public')));

// ✨ RUTAS API PARA DASHBOARD
const apiRoutes = require('./src/routes/api');
app.use('/api', apiRoutes);

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
      console.log('🔐 Flow response detectado - Procesando datos de reserva');

      const { encrypted_flow_data, encrypted_aes_key, initial_vector } = req.body;

      if (!encrypted_flow_data || !encrypted_aes_key || !initial_vector) {
        return res.status(421).send('MISSING_REQUIRED_FIELDS');
      }

      const { decryptedBody, aesKeyBuffer, initialVectorBuffer } = decryptRequest(req.body);
      console.log('📦 Flow data desencriptado:', JSON.stringify(decryptedBody, null, 2));

      const screenResponse = await processFlowLogic(decryptedBody);
      const encryptedResponse = encryptResponse(screenResponse, aesKeyBuffer, initialVectorBuffer);

      return res.status(200).send(encryptedResponse);
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
          await sendTextMessage(userPhone,
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
              await sendTextMessage(userPhone,
                '⚠️ Lo siento, hubo un problema al cargar el formulario de reserva. Por favor intenta de nuevo en unos momentos o contacta a recepción al 442 210 3292.'
              );
            }
          }, 1000);

        } catch (error) {
          console.error(`❌ Error procesando reserva para ${userPhone}:`, error);
          await sendTextMessage(userPhone,
            '⚠️ Lo siento, hubo un error. Por favor intenta de nuevo.'
          );
        }
      } else {
        // PROCESAR CON CHATBOT NORMAL
        await hotelChatbot.handleMessage(userPhone, messageText);
      }

      return res.status(200).send('EVENT_RECEIVED');
    }

    // 2.5. SI ES UNA IMAGEN (POSIBLE COMPROBANTE DE PAGO)
    if (message && message.type === 'image') {
      const userPhone = message.from;
      const messageId = message.id;
      const imageId = message.image.id;

      // EVITAR DUPLICADOS
      if (messageCache.has(messageId)) {
        console.log(`  Imagen duplicada ${messageId} - Ignorando`);
        return res.status(200).send('EVENT_RECEIVED');
      }

      messageCache.set(messageId, Date.now());
      console.log(` Imagen recibida de ${userPhone} - ID: ${imageId}`);

      try {
        // DEBUG: Ver qué reservas tiene este usuario
        console.log('🔍 DEBUG: Buscando reservas para teléfono:', userPhone);
        const todasReservas = await models.Reservation.find({ 
          $or: [
            { userPhone: userPhone },
            { userPhone: userPhone.replace('521', '') },
            { userPhone: '521' + userPhone },
            { userPhone: userPhone.replace('52', '') }
          ]
        }).sort({ createdAt: -1 }).limit(5);
        
        console.log('📋 Reservas encontradas:', todasReservas.length);
        todasReservas.forEach(r => {
          console.log(`  - ID: ${r._id}, Teléfono: ${r.userPhone}, Status: ${r.status}, Deadline: ${r.paymentDeadline}`);
        });

        // Buscar si el usuario tiene una reserva pendiente de pago (con variaciones de teléfono)
        const reservaPendiente = await models.Reservation.findOne({
          $or: [
            { userPhone: userPhone },
            { userPhone: userPhone.replace('521', '') },
            { userPhone: '521' + userPhone },
            { userPhone: userPhone.replace('52', '') }
          ],
          status: 'pending_payment',
          paymentDeadline: { $gt: new Date() }
        }).sort({ createdAt: -1 });
        
        console.log(' Reserva pendiente encontrada:', reservaPendiente ? 'SÍ' : 'NO');
        if (!reservaPendiente && todasReservas.length > 0) {
          console.log('⚠️ Hay reservas pero ninguna cumple los criterios (status o deadline)');
        }

        if (reservaPendiente) {
          console.log(' Comprobante detectado para reserva:', reservaPendiente._id);

          // 📤 SUBIR COMPROBANTE A CLOUDINARY
          const uploadResult = await cloudinaryUploader.uploadPaymentReceipt(
            imageId,
            reservaPendiente.confirmationCode
          );

          if (uploadResult.success) {
            console.log('✅ Comprobante subido a Cloudinary:', uploadResult.url);
            
            // Actualizar reserva con URL de Cloudinary
            reservaPendiente.status = 'payment_received';
            reservaPendiente.paymentProof = uploadResult.url;
            reservaPendiente.paidAt = new Date();
            await reservaPendiente.save();

            console.log(' Reserva actualizada a payment_received');
          } else {
            console.error('❌ Error subiendo comprobante a Cloudinary:', uploadResult.error);
            
            // Fallback: guardar referencia de WhatsApp si Cloudinary falla
            const imageUrl = `whatsapp://media/${imageId}`;
            reservaPendiente.status = 'payment_received';
            reservaPendiente.paymentProof = imageUrl;
            reservaPendiente.paidAt = new Date();
            await reservaPendiente.save();
            
            console.log('⚠️ Reserva actualizada con referencia de WhatsApp (Cloudinary falló)');
          }

          // Notificar al cliente
          await sendTextMessage(userPhone, 
            ` *Comprobante Recibido*\n\n` +
            `Gracias, hemos recibido tu comprobante de pago.\n\n` +
            ` *En verificación:* Nuestro equipo está verificando tu pago.\n\n` +
            ` Te confirmaremos en los próximos minutos.\n\n` +
            ` Código de reserva: *${reservaPendiente.confirmationCode}*\n\n` +
            `_Si tienes dudas: (442) 210 32 92_`
          );

          // Notificar al hotel
          const mensajeHotel = ` *COMPROBANTE DE PAGO RECIBIDO*\n\n` +
            ` Código: ${reservaPendiente.confirmationCode}\n` +
            ` Cliente: ${reservaPendiente.customerName}\n` +
            ` Teléfono: ${userPhone}\n` +
            ` Monto: $${reservaPendiente.totalAmount.toLocaleString('es-MX')} MXN\n\n` +
            ` El cliente envió una imagen como comprobante.\n\n` +
            ` *ACCIÓN REQUERIDA:* Verificar pago y confirmar reserva.\n\n` +
            `_ID: ${reservaPendiente._id}_`;

          const telefonoHotel = process.env.HOTEL_NOTIFICATION_PHONE || '5214422103292';
          await sendTextMessage(telefonoHotel, mensajeHotel);

          console.log(' Notificaciones enviadas');
        } else {
          console.log(' No hay reserva pendiente de pago');
        }

      } catch (error) {
        console.error(' Error procesando comprobante:', error);
      }

      return res.status(200).send('EVENT_RECEIVED');
    }

    // 3. SI ES UN MENSAJE INTERACTIVO (BOTONES, LISTAS, ETC.)
    if (message && message.type === 'interactive') {
      const userPhone = message.from;
      const messageId = message.id;

      // EVITAR DUPLICADOS
      if (messageCache.has(messageId)) {
        console.log(`⏭️  Mensaje interactivo duplicado ${messageId} - Ignorando`);
        return res.status(200).send('EVENT_RECEIVED');
      }

      messageCache.set(messageId, Date.now());

      const interactive = message.interactive;
      console.log(`🔘 Mensaje interactivo de ${userPhone}:`, interactive.type);

      // Manejar clic en botones
      if (interactive.type === 'button_reply') {
        const buttonId = interactive.button_reply.id;
        console.log(`🔄 Botón presionado: ${buttonId}`);
        await hotelChatbot.handleMessage(userPhone, null, buttonId);
      }
      // Puedes agregar más tipos de mensajes interactivos aquí si es necesario
      // else if (interactive.type === 'list_reply') { ... }

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

// ✨ NUEVO: ENDPOINT DE ANALYTICS
app.get('/analytics', (req, res) => {
  try {
    const data = analytics.exportAnalytics();
    res.json({
      success: true,
      ...data
    });
  } catch (error) {
    console.error('Error obteniendo analytics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✨ NUEVO: ANALYTICS DE USUARIO ESPECÍFICO
app.get('/analytics/user/:phone', (req, res) => {
  try {
    const phone = req.params.phone;
    const stats = hotelChatbot.getUserStats(phone);
    
    if (!stats) {
      return res.status(404).json({ 
        success: false, 
        message: 'No hay datos para este usuario' 
      });
    }
    
    res.json({
      success: true,
      phone,
      stats
    });
  } catch (error) {
    console.error('Error obteniendo stats de usuario:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✨ NUEVO: RESUMEN RÁPIDO DE ANALYTICS (Para dashboard)
app.get('/analytics/summary', (req, res) => {
  try {
    const data = hotelChatbot.getAnalytics();
    res.json({
      success: true,
      summary: {
        totalMessages: data.totalMessages,
        activeUsers: data.activeUsers,
        totalUsers: data.totalUsers,
        errorRate: data.errorRate,
        topIntent: data.topIntents[0]?.[0] || 'N/A',
        topIntentCount: data.topIntents[0]?.[1] || 0
      }
    });
  } catch (error) {
    console.error('Error obteniendo resumen:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✨ NUEVO: DASHBOARD WEB
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// ✨ NUEVO: ESTADO DE MÓDULOS AVANZADOS
app.get('/status', (req, res) => {
  res.json({
    success: true,
    modules: {
      database: database.isConnected(),
      aiNLP: aiNLP.isEnabled(),
      notifications: notificationSystem.getStatus(),
      analytics: true
    },
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// ✨ NUEVO: AI NLP - Detectar intención con IA
app.post('/ai/detect-intent', async (req, res) => {
  try {
    const { message, context } = req.body;
    const result = await aiNLP.detectIntent(message, context);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✨ NUEVO: AI NLP - Corregir typos
app.post('/ai/correct-typos', async (req, res) => {
  try {
    const { message } = req.body;
    const corrected = await aiNLP.correctTypos(message);
    res.json({ success: true, original: message, corrected });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✨ NUEVO: Obtener perfil de usuario de BD
app.get('/users/:phone', async (req, res) => {
  try {
    const profile = await database.getUserProfile(req.params.phone);
    res.json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✨ NUEVO: Obtener conversaciones de usuario
app.get('/conversations/:phone', async (req, res) => {
  try {
    const conversation = await database.getActiveConversation(req.params.phone);
    res.json({ success: true, conversation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✨ NUEVO: Obtener reservaciones
app.get('/reservations/:phone', async (req, res) => {
  try {
    const reservations = await database.getReservations(req.params.phone);
    res.json({ success: true, reservations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✨ NUEVO: Notificaciones no leídas
app.get('/notifications', async (req, res) => {
  try {
    const notifications = await database.getUnreadNotifications();
    res.json({ success: true, notifications });
  } catch (error) {
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

// Inicializar base de datos y luego servidor
async function startServer() {
  try {
    // Conectar a MongoDB (opcional)
    await database.connect();
    
    // Verificar alertas cada 5 minutos
    setInterval(async () => {
      const analytics = hotelChatbot.getAnalytics();
      await notificationSystem.checkAndAlert(analytics);
    }, 5 * 60 * 1000);

    app.listen(PORT, '0.0.0.0', () => {
      console.log('🏨 ===============================================');
      console.log('🏨 AUTO HOTEL LUXOR CHATBOT v3.0 ADVANCED');
      console.log('🏨 ===============================================');
      console.log('✅ Servidor iniciado en puerto:', PORT);
      console.log('');
      console.log('🌐 DASHBOARD:');
      console.log(`  • http://localhost:${PORT}/dashboard`);
      console.log('');
      console.log('📍 ENDPOINTS PRINCIPALES:');
      console.log('  • POST /webhook - Webhook de WhatsApp');
      console.log('  • GET  /webhook - Verificación de webhook');
      console.log('  • GET  /health - Health check');
      console.log('  • GET  /status - Estado de módulos');
      console.log('  • POST /test-flow/:phone - Test manual de flow');
      console.log('');
      console.log('📊 ENDPOINTS DE ANALYTICS:');
      console.log('  • GET  /analytics - Métricas completas');
      console.log('  • GET  /analytics/summary - Resumen rápido');
      console.log('  • GET  /analytics/user/:phone - Stats de usuario');
      console.log('');
      console.log('🤖 ENDPOINTS DE AI:');
      console.log('  • POST /ai/detect-intent - Detección con IA');
      console.log('  • POST /ai/correct-typos - Corrección de typos');
      console.log('');
      console.log('👥 ENDPOINTS DE USUARIOS:');
      console.log('  • GET  /users/:phone - Perfil de usuario');
      console.log('  • GET  /conversations/:phone - Conversaciones');
      console.log('  • GET  /reservations/:phone - Reservaciones');
      console.log('  • GET  /notifications - Notificaciones');
      console.log('');
      console.log('✨ CARACTERÍSTICAS v3.0:');
      console.log('  ✓ Sistema de contexto conversacional');
      console.log('  ✓ Detección de intenciones con scoring');
      console.log('  ✓ Rate limiting avanzado anti-spam');
      console.log('  ✓ Analytics y métricas en tiempo real');
      console.log('  ✓ Manejo de errores con reintentos');
      console.log('  ✓ Respuestas inteligentes para baja confianza');
      console.log('');
      console.log('🚀 NUEVAS CARACTERÍSTICAS AVANZADAS:');
      console.log(`  ${database.isConnected() ? '✅' : '⚠️'}  Base de datos MongoDB`);
      console.log(`  ${aiNLP.isEnabled() ? '✅' : '⚠️'}  AI NLP con OpenAI`);
      console.log(`  ${notificationSystem.getStatus().emailEnabled ? '✅' : '⚠️'}  Sistema de notificaciones email`);
      console.log(`  ${notificationSystem.getStatus().slackEnabled ? '✅' : '⚠️'}  Notificaciones Slack`);
      console.log('  ✅ Dashboard web interactivo');
      console.log('  ✅ UX mejorado con typing indicators');
      console.log('  ✅ Respuestas dinámicas por hora/día');
      console.log('  ✅ Sistema de seguimiento y remarketing');
      console.log('  ✅ Segmentación automática de usuarios');
      console.log('  ✅ Lead scoring automático');
      console.log('🏨 ===============================================');
      console.log('');
      console.log(`🎯 Dashboard disponible en: http://localhost:${PORT}/dashboard`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;