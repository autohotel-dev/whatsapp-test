const express = require('express');
const crypto = require('crypto');

const app = express();

// Middleware
app.use(express.json());

// Configuración
const port = process.env.PORT || 3000;
const verifyToken = process.env.VERIFY_TOKEN;

// ✅ CLAVE PRIVADA RSA (debes tenerla configurada en Meta Developer Portal)
const privateKey = process.env.PRIVATE_KEY.trim();

// ✅ MIDDLEWARE DE LOG
app.use((req, res, next) => {
  console.log('🔍 SOLICITUD RECIBIDA:');
  console.log('   Método:', req.method);
  console.log('   Ruta:', req.originalUrl);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('   Body recibido');
  }
  console.log('==========================');
  next();
});

// ✅ DESENCRIPTAR CLAVE AES CON RSA
function decryptAesKey(encryptedAesKeyBase64) {
  try {
    console.log('🔑 Desencriptando clave AES...');

    const encryptedAesKey = Buffer.from(encryptedAesKeyBase64, 'base64');

    // Desencriptar con clave privada RSA
    const decrypted = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
      },
      encryptedAesKey
    );

    const aesKey = decrypted.toString('base64');
    console.log('✅ Clave AES desencriptada correctamente');
    console.log('   - Longitud:', Buffer.from(aesKey, 'base64').length, 'bytes');

    return aesKey;

  } catch (error) {
    console.error('❌ Error desencriptando clave AES:', error);
    throw new Error('No se pudo desencriptar la clave AES');
  }
}

// ✅ DESENCRIPTAR FLOW DATA
function decryptFlowData(encryptedFlowData, aesKeyBase64, ivBase64) {
  try {
    console.log('🔐 Desencriptando flow data...');

    const aesKey = Buffer.from(aesKeyBase64, 'base64');
    const iv = Buffer.from(ivBase64, 'base64');
    const encryptedData = Buffer.from(encryptedFlowData, 'base64');

    console.log('🔐 Desencriptando flow data...');
    console.log('   - AES Key length:', aesKey.length, 'bytes');
    console.log('   - IV:', iv.toString('hex'));
    console.log('   - Datos encriptados:', encryptedData.length, 'bytes');

    // ✅ USAR AES-128 (16 bytes) en lugar de AES-256 (32 bytes)
    const decipher = crypto.createDecipheriv('aes-128-cbc', aesKey, iv);

    let decrypted = decipher.update(encryptedData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    const decryptedString = decrypted.toString('utf8');
    console.log('   - Flow data desencriptado:', decryptedString);

    return JSON.parse(decryptedString);

  } catch (error) {
    console.error('❌ Error desencriptando flow data:', error);
    throw new Error('No se pudo desencriptar el flow data');
  }
}

// ✅ ENCRIPTAR RESPUESTA CON CLAVE AES DE META
function encryptResponse(data, aesKeyBase64) {
  try {
    const aesKey = Buffer.from(aesKeyBase64, 'base64');
    const iv = crypto.randomBytes(16);

    console.log('🔐 Encriptando respuesta...');
    console.log('   - AES Key length:', aesKey.length, 'bytes');

    // ✅ USAR AES-128 (16 bytes)
    const cipher = crypto.createCipheriv('aes-128-cbc', aesKey, iv);

    const jsonString = JSON.stringify(data);
    console.log('   - Respuesta a encriptar:', jsonString);

    let encrypted = cipher.update(jsonString, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    const combined = Buffer.concat([iv, encrypted]);
    const base64Result = combined.toString('base64');

    console.log('✅ Respuesta encriptada correctamente');
    console.log('   - Longitud Base64:', base64Result.length, 'caracteres');

    return base64Result;

  } catch (error) {
    console.error('❌ Error encriptando respuesta:', error);
    throw error;
  }
}

// ✅ RUTA /webhook - POST
app.post('/webhook', (req, res) => {
  console.log('🟢 POST en /webhook - Procesando Flow...');

  try {
    const { encrypted_flow_data, encrypted_aes_key, initial_vector } = req.body;

    if (!encrypted_flow_data || !encrypted_aes_key || !initial_vector) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1. Desencriptar la clave AES con RSA
    const aesKey = decryptAesKey(encrypted_aes_key);

    // 2. Desencriptar el flow data con la clave AES
    const flowData = decryptFlowData(encrypted_flow_data, aesKey, initial_vector);
    console.log('✅ Flow data recibido:', flowData);

    // 3. Procesar el flow data (aquí va tu lógica de negocio)
    const processedData = {
      success: true,
      status: "success",
      data: {
        flow_token: `flow_${Date.now()}`,
        screen: "WELCOME_SCREEN",
        data: {
          message: "Flow procesado exitosamente",
          timestamp: new Date().toISOString()
        }
      }
    };

    // 4. Encriptar la respuesta con la MISMA clave AES de Meta
    const encryptedResponse = encryptResponse(processedData, aesKey);

    // 5. Enviar respuesta encriptada
    console.log('📤 Enviando respuesta encriptada a Meta...');
    res.status(200).send(encryptedResponse);

  } catch (error) {
    console.error('❌ Error general:', error);

    // En caso de error, intentar enviar respuesta de error encriptada
    try {
      const aesKey = decryptAesKey(req.body.encrypted_aes_key);
      const errorResponse = {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
      const encryptedError = encryptResponse(errorResponse, aesKey);
      res.status(200).send(encryptedError);
    } catch (e) {
      res.status(500).send('Internal Server Error');
    }
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
    rsa_key_configured: !!privateKey,
    timestamp: new Date().toISOString()
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${port}`);
});