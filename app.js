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

// ✅ DESENCRIPTAR CLAVE AES CON RSA
function decryptAesKey(encryptedAesKeyBase64) {
  try {
    console.log('🔑 Desencriptando clave AES...');

    const encryptedAesKey = Buffer.from(encryptedAesKeyBase64, 'base64');

    const decrypted = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
      },
      encryptedAesKey
    );

    console.log('✅ Clave AES desencriptada correctamente');
    return decrypted; // Devolver el Buffer directamente

  } catch (error) {
    console.error('❌ Error desencriptando clave AES:', error.message);
    throw error;
  }
}

// ✅ DESENCRIPTAR FLOW DATA CON MANEJO DE PADDING
function decryptFlowData(encryptedFlowData, aesKeyBuffer, ivBase64) {
  try {
    const iv = Buffer.from(ivBase64, 'base64');
    const encryptedData = Buffer.from(encryptedFlowData, 'base64');

    console.log('🔐 Desencriptando flow data...');
    console.log('   - AES Key length:', aesKeyBuffer.length, 'bytes');
    console.log('   - IV:', iv.toString('hex'));
    console.log('   - Datos encriptados:', encryptedData.length, 'bytes');

    // Usar AES-128-CBC
    const decipher = crypto.createDecipheriv('aes-128-cbc', aesKeyBuffer, iv);

    // Desencriptar sin auto-padding
    let decrypted = decipher.update(encryptedData);

    try {
      decrypted = Buffer.concat([decrypted, decipher.final()]);
    } catch (finalError) {
      console.log('⚠️  Error en decipher.final(), usando solo update:', finalError.message);
      // Continuar con los datos que tenemos
    }

    const decryptedString = decrypted.toString('utf8');
    console.log('✅ Flow data desencriptado:', decryptedString);

    return JSON.parse(decryptedString);

  } catch (error) {
    console.error('❌ Error desencriptando flow data:', error.message);

    // Intentar interpretar como texto simple si el JSON falla
    try {
      const decryptedString = Buffer.from(encryptedFlowData, 'base64').toString('utf8');
      console.log('🔍 Datos como texto simple:', decryptedString);
      return { raw_data: decryptedString };
    } catch (e) {
      throw new Error('No se pudo desencriptar el flow data');
    }
  }
}

// ✅ ENCRIPTAR RESPUESTA
function encryptResponse(data, aesKeyBuffer) {
  try {
    const iv = crypto.randomBytes(16);

    console.log('🔐 Encriptando respuesta...');
    console.log('   - AES Key length:', aesKeyBuffer.length, 'bytes');

    const cipher = crypto.createCipheriv('aes-128-cbc', aesKeyBuffer, iv);

    const jsonString = JSON.stringify(data);
    console.log('   - Respuesta JSON:', jsonString);

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
  console.log('🟢 POST en /webhook - Procesando Flow');

  try {
    const { encrypted_flow_data, encrypted_aes_key, initial_vector } = req.body;

    if (!encrypted_flow_data || !encrypted_aes_key || !initial_vector) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('📦 Datos recibidos:');
    console.log('   - encrypted_flow_data:', encrypted_flow_data.substring(0, 30) + '...');
    console.log('   - encrypted_aes_key:', encrypted_aes_key.substring(0, 30) + '...');
    console.log('   - initial_vector:', initial_vector);

    // 1. Desencriptar clave AES (devuelve Buffer)
    const aesKeyBuffer = decryptAesKey(encrypted_aes_key);

    // 2. Desencriptar flow data
    const flowData = decryptFlowData(encrypted_flow_data, aesKeyBuffer, initial_vector);
    console.log('📦 Flow data procesado:', flowData);

    // 3. Crear respuesta para Meta
    const responseData = {
      success: true,
      status: "success",
      data: {
        flow_token: `flow_${Date.now()}`,
        screen: "WELCOME_SCREEN",
        data: {
          message: "Flow procesado exitosamente",
          received_data: flowData,
          timestamp: new Date().toISOString()
        }
      }
    };

    // 4. Encriptar respuesta
    const encryptedResponse = encryptResponse(responseData, aesKeyBuffer);

    console.log('📤 Enviando respuesta encriptada a Meta');
    res.status(200).send(encryptedResponse);

  } catch (error) {
    console.error('❌ Error general:', error.message);

    // Intentar enviar respuesta de error encriptada si tenemos la clave AES
    try {
      if (req.body.encrypted_aes_key) {
        const aesKeyBuffer = decryptAesKey(req.body.encrypted_aes_key);
        const errorResponse = {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        };
        const encryptedError = encryptResponse(errorResponse, aesKeyBuffer);
        res.status(200).send(encryptedError);
      } else {
        res.status(500).send('Internal Server Error');
      }
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
    rsa_configured: !!privateKey,
    timestamp: new Date().toISOString()
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${port}`);
  console.log(`✅ Listo para recibir Flows de Meta`);
});