const express = require('express');
const { decryptRequest } = require('./decrypt.js');
const { encryptResponse } = require('./encrypt.js');
const { processFlowLogic } = require('./flow.js');
const hotelChatbot = require('./autoreply.js');

const app = express();
app.use(express.json());

// ✅ MEMORIA PARA EVITAR DUPLICADOS (en producción usa Redis)
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

// ✅ WEBHOOK PARA META - CON FILTRO DE DUPLICADOS
app.post('/webhook', async (req, res) => {
  console.log('🟢 POST /webhook - Request recibido');

  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    // 1. SI ES UN FLOW REQUEST
    if (req.body.encrypted_flow_data && req.body.encrypted_aes_key) {
      console.log('🔐 Flow request detectado - Procesando reserva');

      const { encrypted_flow_data, encrypted_aes_key, initial_vector } = req.body;

      if (!encrypted_flow_data || !encrypted_aes_key || !initial_vector) {
        return res.status(421).send('MISSING_REQUIRED_FIELDS');
      }

      const { decryptedBody, aesKeyBuffer, initialVectorBuffer } = decryptRequest(req.body);
      console.log('📦 Flow data desencriptado:', decryptedBody);

      const screenResponse = await processFlowLogic(decryptedBody);
      const encryptedResponse = encryptResponse(screenResponse, aesKeyBuffer, initialVectorBuffer);

      return res.status(200).send(encryptedResponse);
    }

    // 2. SI ES UN MENSAJE DE TEXTO
    const message = value?.messages?.[0];
    if (message && message.type === 'text') {
      const userPhone = message.from;
      const messageId = message.id;
      const messageText = message.text.body;

      // ✅ EVITAR DUPLICADOS - Verificar si ya procesamos este message_id
      if (messageCache.has(messageId)) {
        console.log(`⏭️  Mensaje duplicado ${messageId} - Ignorando`);
        return res.status(200).send('EVENT_RECEIVED');
      }

      // ✅ AGREGAR A CACHE
      messageCache.set(messageId, Date.now());
      console.log(`💬 Nuevo mensaje de ${userPhone}: "${messageText}"`);

      // ✅ PROCESAR CON CHATBOT
      await hotelChatbot.handleMessage(userPhone, messageText);

      return res.status(200).send('EVENT_RECEIVED');
    }

    // 3. SI ES UNA ENTREGA O LECTURA (message_deliveries, message_reads)
    if (value?.message_deliveries || value?.message_reads) {
      console.log('📨 Evento de entrega/lectura - Ignorando');
      return res.status(200).send('EVENT_RECEIVED');
    }

    // 4. SI ES OTRO TIPO DE EVENTO
    if (value?.statuses) {
      console.log('📊 Evento de estado:', value.statuses[0]?.status);
      return res.status(200).send('EVENT_RECEIVED');
    }

    // 5. EVENTO NO MANEJADO
    console.log('❓ Evento no manejado:', Object.keys(value || {}));
    res.status(200).send('EVENT_RECEIVED');

  } catch (error) {
    console.error('💥 Error en webhook:', error.message);
    res.status(500).send('INTERNAL_SERVER_ERROR');
  }
});

// ✅ VERIFICACIÓN DEL WEBHOOK (mantener igual)
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    console.log('✅ VERIFICACIÓN EXITOSA');
    return res.status(200).send(challenge);
  }

  console.log('❌ Verificación fallida');
  res.status(403).send('VERIFICATION_FAILED');
});

// ✅ HEALTH CHECK
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Hotel Chatbot + Reservations',
    timestamp: new Date().toISOString()
  });
});

app.listen(process.env.PORT || 3000, '0.0.0.0', () => {
  console.log('🏨 ==================================');
  console.log('🏨 HOTEL CHATBOT - RESERVAS & INFO');
  console.log('🏨 ==================================');
  console.log('✅ Servidor listo para recibir mensajes');
  console.log('✅ Flow activado con: "reservar habitación"');
  console.log('🏨 ==================================');
});