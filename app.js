const express = require('express');
const { decryptRequest } = require('./decrypt.js');
const { encryptResponse } = require('./encrypt.js');
const { processFlowLogic } = require('./flow.js');
const { validateWebhook } = require('./helpers.js');
const config = require('./config.js');

const app = express();
app.use(express.json());

// ✅ MIDDLEWARE DE LOG
app.use((req, res, next) => {
  console.log('🔍 SOLICITUD RECIBIDA:', req.method, req.originalUrl);
  next();
});

// ✅ RUTA PRINCIPAL PARA FLOWS
app.post('/webhook', async (req, res) => {
  console.log('🟢 POST /webhook - Flow request recibido');
  
  try {
    const { encrypted_flow_data, encrypted_aes_key, initial_vector } = req.body;
    
    // Validar campos requeridos
    if (!encrypted_flow_data || !encrypted_aes_key || !initial_vector) {
      console.log('❌ Faltan campos requeridos');
      return res.status(421).send('MISSING_REQUIRED_FIELDS');
    }

    console.log('📦 Parámetros recibidos');
    console.log('   - encrypted_flow_data:', encrypted_flow_data.substring(0, 50) + '...');
    console.log('   - encrypted_aes_key:', encrypted_aes_key.substring(0, 50) + '...');
    console.log('   - initial_vector:', initial_vector);

    // 1. Desencriptar request
    const { decryptedBody, aesKeyBuffer, initialVectorBuffer } = decryptRequest(req.body);
    
    console.log('📦 Flow data desencriptado:', decryptedBody);

    // 2. Procesar lógica del flow
    const screenResponse = await processFlowLogic(decryptedBody);
    console.log('🎯 Response a enviar:', screenResponse);

    // 3. Encriptar y enviar response
    const encryptedResponse = encryptResponse(screenResponse, aesKeyBuffer, initialVectorBuffer);
    
    console.log('📤 ENVIANDO RESPUESTA ENCRIPTADA');
    res.status(200).send(encryptedResponse);
    
  } catch (error) {
    console.error('💥 Error crítico:', error.message);
    
    if (error.message.includes('decrypt')) {
      return res.status(421).send('DECRYPTION_FAILED');
    }
    
    res.status(500).send('INTERNAL_SERVER_ERROR');
  }
});

// ✅ VERIFICACIÓN DEL WEBHOOK
app.get('/webhook', (req, res) => {
  console.log('🔵 GET /webhook - Verificación');
  
  const validation = validateWebhook(req.query);
  if (validation.valid) {
    console.log('✅ VERIFICACIÓN EXITOSA');
    return res.status(200).send(validation.challenge);
  }

  console.log('❌ Verificación fallida');
  res.status(403).send('VERIFICATION_FAILED');
});

// ✅ HEALTH CHECK
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Meta Flows Webhook',
    version: config.version,
    timestamp: new Date().toISOString()
  });
});

// ✅ INICIAR SERVIDOR
app.listen(config.port, '0.0.0.0', () => {
  console.log('🚀 ==================================');
  console.log('🚀 META FLOWS WEBHOOK - MODULAR');
  console.log('🚀 ==================================');
  console.log(`✅ Servidor ejecutándose en puerto ${config.port}`);
  console.log(`✅ Webhook: /webhook`);
  console.log(`✅ Health: /health`);
  console.log('🚀 ==================================');
});

module.exports = app;