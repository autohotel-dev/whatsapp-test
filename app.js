const express = require('express');
const { decryptRequest } = require('./decrypt.js');
const { encryptResponse } = require('./encrypt.js');
const { processFlowLogic } = require('./flow.js');
const hotelChatbot = require('./autoreply.js');

const app = express();
app.use(express.json());

// ✅ WEBHOOK PARA META
app.post('/webhook', async (req, res) => {
  console.log('🟢 POST /webhook - Request recibido');
  console.log('📦 Body completo:', JSON.stringify(req.body, null, 2)); // ← AGREGAR ESTA LÍNEA

  try {
    // Verificar si es un Flow request
    if (req.body.encrypted_flow_data && req.body.encrypted_aes_key) {
      console.log('🔐 Flow request detectado - Procesando reserva');

      const { encrypted_flow_data, encrypted_aes_key, initial_vector } = req.body;

      if (!encrypted_flow_data || !encrypted_aes_key || !initial_vector) {
        return res.status(421).send('MISSING_REQUIRED_FIELDS');
      }

      // Procesar Flow de reserva
      const { decryptedBody, aesKeyBuffer, initialVectorBuffer } = decryptRequest(req.body);
      console.log('📦 Flow data desencriptado:', decryptedBody);

      const screenResponse = await processFlowLogic(decryptedBody);
      console.log('🎯 Response a enviar:', screenResponse);

      const encryptedResponse = encryptResponse(screenResponse, aesKeyBuffer, initialVectorBuffer);
      res.status(200).send(encryptedResponse);

    } else {
      // Es un mensaje regular - Procesar con el chatbot
      console.log('💬 Mensaje regular detectado');

      const entry = req.body.entry?.[0];
      const changes = entry?.changes?.[0];
      const message = changes?.value?.messages?.[0];

      if (message && message.type === 'text') {
        const userPhone = message.from;
        const messageText = message.text.body;

        // Procesar con el chatbot de hotel
        await hotelChatbot.handleMessage(userPhone, messageText);
      }

      res.status(200).send('EVENT_RECEIVED');
    }

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