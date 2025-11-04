const express = require('express');
const crypto = require('crypto');

const app = express();

// Middleware
app.use(express.json());

// Configuración
const port = process.env.PORT || 3000;
const verifyToken = process.env.VERIFY_TOKEN;

// ✅ CLAVE PRIVADA RSA (debes tenerla configurada en Meta Developer Portal)
const privateKey = process.env.PRIVATE_KEY || `
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDbO8dIx3jzACbj
BigSM3ugO3sUiow3JShtRoUXGvYNqFbcF37iqg1c9nr6J60PdbQ0vZlTRUHQFaeJ
D3GyBjJhr4hRaxKAS14F5lUangtZb2mboPzASdhIPKwpAVO+D7a/JJEh9u1AXsoq
5xuOUqPT/717+2ZBKSkXA31JYyA5Av87+kMmdeZAnS1/X/thCE2Ay0cPZkqs70U0
Bx4Hce1qCGUSfSQqM3wZoQAMX+bUepSoZ57s39AXg3cscUzx+5bbx04xNBA4fEIx
lGvVb7hf38Liue/5hZwuFXNBenbmi3WN4rMO39PcSHUUhssSTgrqsYmdRAUAW7Uc
MIzzaouhAgMBAAECggEAG7Td1i5TdE54G6frB4XXIWRzBSEPYGbDSbAoYMepAgfc
1lrnz8iTAMUrvJKoFfSXrjSp/HKbwysBbdp0UX3j/yF6dmO0Rl+ABfnalo8Tux1P
+PmrB7gta8+zKEmBJluBCn4aE3NL/58bKLnlayK5jrDa5yDaBvEnPr/TpSMwbtPc
vAD75qIbgHULp7BXE2dRiYdLp312RYgAmKiDXSwEph04cwMARTvEsX/GcI1QxeKF
iHuU1oZhcLh4Zued0GXIoL9b19t7aQstuVQhp5FypvrqvwoFFBLEH+dWCiQ0L7UY
7QyjS7KCxk/EbojPfoKfnCqWDyqHAXQxPYE/JkjikwKBgQDzUU5uuQUMszW1WOkW
e9ufmOD2qcPNf6PO63DncofaxBJYls2ssoOw2/z6bwO+A2XAiceN6eI/iemM59CO
dwYCeSMbVk30lt4TdsarNtWIIbJT0gkRR/gHDk8W2D9hkRjWepZmopoBTJpIWuvG
33dCEHaf/K/B2nV4SQxLrX5fSwKBgQDmqRuBW2+zt+LyC9ox8VMpi3kXJUOba9B1
Iozot6TMALJ7ERVZE8IYEjcWL9/CCiUWygpd0O1mi5hN2APErVJdxNqMa92FxTy8
LrMkA+bhlTa69mUcA2Ni4IWQHyqZVNoJiQrK69aZVu5VVFtr0zRPY21VOkD1XgXt
pX13u6bxQwKBgQCZJdn6MxaMkdgCVv4PGtJ3t+ARIXWOyQIv4V1lMF92QOdTP0gh
pRLipPSsJGf0l2raL16dYlL3rzSDbf2FTkFIGTsRn9bdVoBdO+t8JL1uO9dkjtUK
PYRN3KHHPUFXhd5eUTaNT1cj7jVFyYSR3mHQAVDJDmEJ4RkDJudIUuEx1QKBgGKK
UEPdKkVfA8dgJOE9NcgD28F1nAJj9vRzxDsPaYn1qkpFLBeYB019Sqdh4HfnGZ04
x2D5BtLOREzNQh7d5NhGZw+ibUrezmmekc2LFTG+K1mINf3XvLfbL3Q4vFwxEc0N
DN1QD6gGqV8u4LeZzTk1QtosPuAUQPgbwRRLyLA9AoGAMkLxd+GykCwKd45aty7o
P4RD/FjM/ZzW0OTdJBAx4qW1r7kwEYsN2YDCUYUvoiPQfal2y6KL7PXykbXTWQ/E
Nys61C+d0FRCIy6oKOgn9ndixVe2CSZO0TjY6HfXb1MAEZ4m32/4SdufylRI6j4M
6vfjOO8gef7n1GLg0DQ1hQM=
-----END PRIVATE KEY-----
`.trim();

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
    console.log('   - Clave AES desencriptada:', aesKey.substring(0, 30) + '...');
    
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
    
    console.log('   - AES Key length:', aesKey.length);
    console.log('   - IV:', iv.toString('hex'));
    console.log('   - Datos encriptados:', encryptedData.length, 'bytes');
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', aesKey, iv);
    
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
    console.log('🔐 Encriptando respuesta con clave AES de Meta...');
    
    const aesKey = Buffer.from(aesKeyBase64, 'base64');
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv('aes-256-cbc', aesKey, iv);
    
    const jsonString = JSON.stringify(data);
    console.log('   - Respuesta a encriptar:', jsonString);
    
    let encrypted = cipher.update(jsonString, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    const combined = Buffer.concat([iv, encrypted]);
    const base64Result = combined.toString('base64');
    
    console.log('   - Respuesta encriptada (Base64):', base64Result.substring(0, 80) + '...');
    
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
        processed: true,
        received_data: flowData,
        timestamp: new Date().toISOString()
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