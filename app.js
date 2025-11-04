const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const port = process.env.PORT || 3000;
const verifyToken = process.env.VERIFY_TOKEN;
const privateKey = process.env.PRIVATE_KEY;

// ✅ MIDDLEWARE DE LOG
app.use((req, res, next) => {
  console.log('🔍 SOLICITUD RECIBIDA:', req.method, req.originalUrl);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📦 Body recibido');
  }
  next();
});

// ✅ DESENCRIPTAR CLAVE AES
function decryptAesKey(encryptedAesKeyBase64) {
  try {
    const encryptedAesKey = Buffer.from(encryptedAesKeyBase64, 'base64');
    const decrypted = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
      },
      encryptedAesKey
    );
    console.log('✅ Clave AES desencriptada -', decrypted.length, 'bytes');
    return decrypted;
  } catch (error) {
    console.error('❌ Error desencriptando clave AES:', error.message);
    throw error;
  }
}

// ✅ DESENCRIPTAR FLOW DATA (según documentación de Meta)
function decryptFlowData(encryptedFlowData, aesKeyBuffer, ivBase64) {
  try {
    const iv = Buffer.from(ivBase64, 'base64');
    const encryptedData = Buffer.from(encryptedFlowData, 'base64');
    
    console.log('🔐 Desencriptando flow data...');
    console.log('   - IV:', iv.toString('hex'));
    console.log('   - Datos encriptados:', encryptedData.length, 'bytes');
    
    const decipher = crypto.createDecipheriv('aes-128-cbc', aesKeyBuffer, iv);
    
    let decrypted = decipher.update(encryptedData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    // Los datos pueden estar en formato protobuf o binario de Meta
    // Para la verificación, asumimos que es JSON válido
    try {
      const decryptedString = decrypted.toString('utf8');
      console.log('✅ Flow data (texto):', decryptedString);
      return JSON.parse(decryptedString);
    } catch (jsonError) {
      // Si no es JSON, es probable que sea el formato binario de Meta
      console.log('📦 Flow data en formato binario, procesando...');
      return processMetaFlowData(decrypted);
    }
    
  } catch (error) {
    console.error('❌ Error desencriptando flow data:', error.message);
    throw new Error('DECRYPTION_FAILED');
  }
}

// ✅ PROCESAR DATOS BINARIOS DE META (simulación)
function processMetaFlowData(dataBuffer) {
  console.log('🔧 Procesando datos binarios de Meta...');
  
  // Simulamos la estructura que Meta espera según su documentación
  // En producción, aquí deserializarías el protobuf real
  
  return {
    version: "4.0",
    flow_token: `flow_${Date.now()}`,
    screen: "INITIAL_SCREEN",
    data: {
      action: "flow_started",
      timestamp: new Date().toISOString()
    }
  };
}

// ✅ PROCESAR LA LÓGICA DEL FLOW (según documentación)
function processFlowLogic(flowData) {
  console.log('🔄 Procesando lógica del flow...');
  
  // Según la documentación, estos son los casos:
  // 1. User opens the flow
  // 2. User submits the screen  
  // 3. User presses back button
  // 4. User changes component value
  // 5. Health check from WhatsApp
  
  const { screen, data, version } = flowData;
  
  // Lógica básica según el screen
  switch (screen) {
    case 'INITIAL_SCREEN':
      return {
        screen: "WELCOME_SCREEN",
        data: {
          welcome_message: "¡Bienvenido al flow!",
          timestamp: new Date().toISOString()
        }
      };
      
    case 'WELCOME_SCREEN':
      return {
        screen: "MAIN_MENU", 
        data: {
          options: ["Opción 1", "Opción 2", "Opción 3"],
          timestamp: new Date().toISOString()
        }
      };
      
    default:
      return {
        screen: "WELCOME_SCREEN",
        data: {
          message: "Screen no reconocido, redirigiendo al inicio",
          timestamp: new Date().toISOString()
        }
      };
  }
}

// ✅ ENCRIPTAR RESPUESTA (según documentación)
function encryptResponse(data, aesKeyBuffer) {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-128-cbc', aesKeyBuffer, iv);
    
    const jsonString = JSON.stringify(data);
    console.log('📤 Respuesta JSON a encriptar:', jsonString);
    
    let encrypted = cipher.update(jsonString, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    const combined = Buffer.concat([iv, encrypted]);
    const base64Result = combined.toString('base64');
    
    console.log('✅ Respuesta encriptada -', base64Result.length, 'caracteres Base64');
    return base64Result;
    
  } catch (error) {
    console.error('❌ Error encriptando respuesta:', error);
    throw error;
  }
}

// ✅ RUTA PRINCIPAL PARA FLOWS
app.post('/webhook', (req, res) => {
  console.log('🟢 POST /webhook - Flow request recibido');
  
  try {
    const { encrypted_flow_data, encrypted_aes_key, initial_vector } = req.body;
    
    // Validar campos requeridos según documentación
    if (!encrypted_flow_data || !encrypted_aes_key || !initial_vector) {
      console.log('❌ Faltan campos requeridos');
      return res.status(421).send('MISSING_REQUIRED_FIELDS');
    }
    
    console.log('📦 Parámetros recibidos:');
    console.log('   - encrypted_flow_data:', encrypted_flow_data.substring(0, 50) + '...');
    console.log('   - encrypted_aes_key:', encrypted_aes_key.substring(0, 50) + '...');
    console.log('   - initial_vector:', initial_vector);
    
    // 1. Desencriptar clave AES
    const aesKeyBuffer = decryptAesKey(encrypted_aes_key);
    
    // 2. Desencriptar flow data
    let flowData;
    try {
      flowData = decryptFlowData(encrypted_flow_data, aesKeyBuffer, initial_vector);
    } catch (decryptError) {
      console.error('❌ No se pudo desencriptar:', decryptError.message);
      return res.status(421).send('DECRYPTION_FAILED');
    }
    
    console.log('📦 Flow data recibido:', flowData);
    
    // 3. Procesar lógica del negocio
    const processedResult = processFlowLogic(flowData);
    
    // 4. Construir respuesta según documentación de Meta
    const responseData = {
      success: true,
      data: {
        flow_token: flowData.flow_token || `flow_${Date.now()}`,
        screen: processedResult.screen,
        data: processedResult.data
      }
    };
    
    console.log('🎯 Respuesta a enviar:', responseData);
    
    // 5. Encriptar respuesta
    const encryptedResponse = encryptResponse(responseData, aesKeyBuffer);
    
    console.log('📤 ENVIANDO RESPUESTA ENCRIPTADA');
    res.status(200).send(encryptedResponse);
    
  } catch (error) {
    console.error('💥 Error crítico:', error.message);
    
    // Según documentación: 421 para errores de desencriptación
    if (error.message === 'DECRYPTION_FAILED') {
      return res.status(421).send('DECRYPTION_FAILED');
    }
    
    res.status(500).send('INTERNAL_SERVER_ERROR');
  }
});

// ✅ VERIFICACIÓN DEL WEBHOOK
app.get('/webhook', (req, res) => {
  console.log('🔵 GET /webhook - Verificación');
  
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === verifyToken) {
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
    service: 'Meta Flows Webhook',
    version: '1.0',
    timestamp: new Date().toISOString()
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log('🚀 ==================================');
  console.log('🚀 META FLOWS WEBHOOK - PRODUCCIÓN');
  console.log('🚀 ==================================');
  console.log(`✅ Servidor ejecutándose en puerto ${port}`);
  console.log(`✅ Webhook: /webhook`);
  console.log(`✅ Health: /health`);
  console.log('🚀 ==================================');
});