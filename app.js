const express = require('express');
const crypto = require('crypto');

const app = express();

// Middleware
app.use(express.json());

// Configuración
const port = process.env.PORT || 3000;
const verifyToken = process.env.VERIFY_TOKEN;

// ✅ MIDDLEWARE DE LOG
app.use((req, res, next) => {
  console.log('🔍 SOLICITUD RECIBIDA:');
  console.log('   Método:', req.method);
  console.log('   Ruta:', req.originalUrl);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('   Body:', JSON.stringify(req.body, null, 2));
  }
  console.log('==========================');
  next();
});

// ✅ FUNCIÓN PARA DESENCRIPTAR FLOW DATA
function decryptFlowData(encryptedFlowData, encryptedAesKey, initialVector) {
  try {
    console.log('🔐 Desencriptando flow data...');
    
    // La encryptedAesKey está encriptada con RSA, necesitamos una clave privada
    // Para la prueba, vamos a simular la desencriptación
    
    // Decodificar datos Base64
    const iv = Buffer.from(initialVector, 'base64');
    const encryptedData = Buffer.from(encryptedFlowData, 'base64');
    
    console.log('   - IV:', iv.toString('hex'));
    console.log('   - Datos encriptados:', encryptedData.length, 'bytes');
    
    // En un entorno real, aquí desencriptarías encryptedAesKey con tu clave privada RSA
    // Para la prueba, vamos a crear una respuesta simulada
    
    const simulatedResponse = {
      success: true,
      status: "success",
      data: {
        flow_processed: true,
        timestamp: new Date().toISOString(),
        message: "Flow data processed successfully"
      }
    };
    
    return simulatedResponse;
    
  } catch (error) {
    console.error('❌ Error desencriptando:', error);
    throw error;
  }
}

// ✅ FUNCIÓN PARA ENCRIPTAR RESPUESTA
function encryptResponse(data, encryptionKey) {
  try {
    console.log('🔐 Encriptando respuesta...');
    
    // La encryptionKey debería venir de Meta, pero para prueba usamos una simulación
    const key = crypto.createHash('sha256').update('test_key').digest();
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    
    const jsonString = JSON.stringify(data);
    let encrypted = cipher.update(jsonString, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    const combined = Buffer.concat([iv, encrypted]);
    const base64Result = combined.toString('base64');
    
    console.log('   - Respuesta encriptada (primeros 100 chars):', base64Result.substring(0, 100) + '...');
    
    return base64Result;
    
  } catch (error) {
    console.error('❌ Error encriptando respuesta:', error);
    throw error;
  }
}

// ✅ RUTA /webhook - POST (Para eventos de Flow)
app.post('/webhook', (req, res) => {
  console.log('🟢 POST en /webhook - Evento de Flow recibido');
  
  try {
    const { encrypted_flow_data, encrypted_aes_key, initial_vector } = req.body;
    
    if (!encrypted_flow_data || !encrypted_aes_key || !initial_vector) {
      console.log('❌ Faltan datos requeridos en el body');
      return res.status(400).json({
        error: 'Missing required fields: encrypted_flow_data, encrypted_aes_key, initial_vector'
      });
    }
    
    console.log('📦 Datos recibidos:');
    console.log('   - encrypted_flow_data:', encrypted_flow_data.substring(0, 50) + '...');
    console.log('   - encrypted_aes_key:', encrypted_aes_key.substring(0, 50) + '...');
    console.log('   - initial_vector:', initial_vector);
    
    // 1. Desencriptar el flow data
    const decryptedData = decryptFlowData(encrypted_flow_data, encrypted_aes_key, initial_vector);
    
    console.log('✅ Flow data desencriptado:', decryptedData);
    
    // 2. Crear respuesta para Meta
    const responseData = {
      success: true,
      status: "success",
      data: {
        flow_token: "flow_token_generated_" + Date.now(),
        processed: true,
        timestamp: new Date().toISOString()
      }
    };
    
    // 3. Encriptar la respuesta (Meta espera esto en Base64)
    const encryptedResponse = encryptResponse(responseData);
    
    // 4. Enviar respuesta encriptada en Base64
    console.log('📤 Enviando respuesta encriptada a Meta...');
    res.status(200).send(encryptedResponse);
    
  } catch (error) {
    console.error('❌ Error procesando webhook:', error);
    
    // En caso de error, igual enviar respuesta encriptada
    const errorResponse = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
    
    try {
      const encryptedError = encryptResponse(errorResponse);
      res.status(200).send(encryptedError);
    } catch (e) {
      // Si falla la encriptación, enviar respuesta simple
      res.status(200).send('error');
    }
  }
});

// ✅ RUTA /webhook - GET (Para verificación)
app.get('/webhook', (req, res) => {
  console.log('🔵 GET en /webhook - Verificación');
  
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('✅ VERIFICACIÓN EXITOSA');
    return res.status(200).send(challenge);
  }

  res.status(200).json({
    status: 'active',
    message: 'Webhook endpoint ready for Meta Flows'
  });
});

// ✅ HEALTH CHECK
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Meta Flows Webhook',
    timestamp: new Date().toISOString()
  });
});

// ✅ INICIAR SERVIDOR
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Servidor Meta Flows ejecutándose en puerto ${port}`);
  console.log(`✅ Webhook: https://tu-dominio.com/webhook`);
  console.log(`✅ Health: https://tu-dominio.com/health`);
});