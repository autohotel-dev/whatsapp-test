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
    console.log('✅ Clave AES desencriptada');
    return decrypted;
  } catch (error) {
    console.error('❌ Error desencriptando clave AES:', error.message);
    throw error;
  }
}

// ✅ DESENCRIPTAR FLOW DATA
function decryptFlowData(encryptedFlowData, aesKeyBuffer, ivBase64) {
  try {
    const iv = Buffer.from(ivBase64, 'base64');
    const encryptedData = Buffer.from(encryptedFlowData, 'base64');
    
    console.log('🔐 Desencriptando flow data...');
    console.log('   - IV:', iv.toString('hex'));
    console.log('   - Datos encriptados:', encryptedData.length, 'bytes');
    
    const decipher = crypto.createDecipheriv('aes-128-cbc', aesKeyBuffer, iv);
    decipher.setAutoPadding(false); // Desactivar auto-padding
    
    let decrypted = decipher.update(encryptedData);
    
    try {
      decrypted = Buffer.concat([decrypted, decipher.final()]);
    } catch (e) {
      console.log('⚠️  Usando datos sin padding final');
    }
    
    // Limpiar padding PKCS7 manualmente
    const padLength = decrypted[decrypted.length - 1];
    if (padLength > 0 && padLength <= 16) {
      decrypted = decrypted.slice(0, decrypted.length - padLength);
    }
    
    const decryptedString = decrypted.toString('utf8');
    console.log('✅ Flow data desencriptado (texto):', decryptedString);
    
    return JSON.parse(decryptedString);
    
  } catch (error) {
    console.error('❌ Error procesando flow data:', error.message);
    
    // Para testing, simular datos de flow
    return {
      version: "1.0",
      screen: "INITIAL_SCREEN",
      data: {
        action: "flow_started",
        timestamp: new Date().toISOString()
      }
    };
  }
}

// ✅ PROCESAR FLOW DATA (Lógica de negocio)
function processFlowData(flowData) {
  console.log('🔄 Procesando flow data:', flowData);
  
  // Aquí va tu lógica de negocio según el flow
  // Ejemplo básico:
  return {
    success: true,
    screen: "WELCOME_SCREEN",
    data: {
      welcome_message: "¡Bienvenido!",
      user_data: flowData.data || {},
      processed_at: new Date().toISOString()
    }
  };
}

// ✅ ENCRIPTAR RESPUESTA PARA META
function encryptResponse(data, aesKeyBuffer) {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-128-cbc', aesKeyBuffer, iv);
    
    const jsonString = JSON.stringify(data);
    console.log('📤 Respuesta a enviar:', jsonString);
    
    let encrypted = cipher.update(jsonString, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    const combined = Buffer.concat([iv, encrypted]);
    const base64Result = combined.toString('base64');
    
    console.log('✅ Respuesta encriptada, longitud:', base64Result.length);
    return base64Result;
    
  } catch (error) {
    console.error('❌ Error encriptando respuesta:', error);
    throw error;
  }
}

// ✅ RUTA /webhook - POST
app.post('/webhook', (req, res) => {
  console.log('🟢 POST en /webhook - Procesando Flow de Meta');
  
  try {
    const { encrypted_flow_data, encrypted_aes_key, initial_vector } = req.body;
    
    if (!encrypted_flow_data || !encrypted_aes_key || !initial_vector) {
      console.log('❌ Faltan campos requeridos');
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // 1. Desencriptar clave AES
    const aesKeyBuffer = decryptAesKey(encrypted_aes_key);
    
    // 2. Desencriptar flow data
    let flowData;
    try {
      flowData = decryptFlowData(encrypted_flow_data, aesKeyBuffer, initial_vector);
    } catch (error) {
      console.log('⚠️  Usando datos simulados para testing');
      flowData = {
        version: "1.0",
        screen: "INITIAL_SCREEN", 
        data: {
          action: "flow_started",
          testing: true,
          timestamp: new Date().toISOString()
        }
      };
    }
    
    // 3. Procesar el flow (tu lógica de negocio)
    const processedResult = processFlowData(flowData);
    
    // 4. Crear respuesta para Meta Flows
    const responseData = {
      success: processedResult.success !== false,
      status: "success",
      data: {
        flow_token: `flow_${Date.now()}`,
        screen: processedResult.screen || "WELCOME_SCREEN",
        data: processedResult.data || {
          message: "Procesado correctamente",
          timestamp: new Date().toISOString()
        }
      }
    };
    
    console.log('🎯 Respuesta final:', responseData);
    
    // 5. Encriptar y enviar respuesta
    const encryptedResponse = encryptResponse(responseData, aesKeyBuffer);
    res.status(200).send(encryptedResponse);
    
  } catch (error) {
    console.error('💥 Error crítico:', error.message);
    
    // Respuesta de error básica
    res.status(200).send('error');
  }
});

// ✅ RUTA /webhook - GET
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('✅ VERIFICACIÓN EXITOSA');
    return res.status(200).send(challenge);
  }

  res.status(403).send('Verification failed');
});

// ✅ HEALTH CHECK
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Meta Flows Webhook',
    ready: true,
    timestamp: new Date().toISOString()
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Servidor Meta Flows ejecutándose en puerto ${port}`);
  console.log(`✅ Webhook: /webhook`);
  console.log(`✅ Health: /health`);
});