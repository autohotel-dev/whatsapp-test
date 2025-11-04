const express = require('express');
const crypto = require('crypto');
const https = require('https');
const fs = require('fs');

const app = express();

// Middleware
app.use(express.json());

// Configuración
const port = process.env.PORT || 3000;
const verifyToken = process.env.VERIFY_TOKEN;
const encryptionKey = process.env.ENCRYPTION_KEY || 'default_encryption_key_32_chars!!';

// ✅ MIDDLEWARE DE LOG
app.use((req, res, next) => {
  console.log('=== SOLICITUD RECIBIDA ===');
  console.log('Método:', req.method);
  console.log('Ruta:', req.originalUrl);
  console.log('Query:', JSON.stringify(req.query));
  console.log('==========================');
  next();
});

// ✅ FUNCIÓN PARA ENCRIPTAR Y CODIFICAR EN BASE64
function encryptAndEncode(data) {
  try {
    // Preparar clave de 32 bytes para AES-256
    const key = crypto.createHash('sha256').update(encryptionKey).digest();
    
    // Generar IV aleatorio
    const iv = crypto.randomBytes(16);
    
    // Crear cipher
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    
    // Convertir datos a string JSON
    const jsonString = JSON.stringify(data);
    
    // Encriptar
    let encrypted = cipher.update(jsonString, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Combinar IV + datos encriptados
    const combined = iv.toString('hex') + ':' + encrypted;
    
    // Codificar en Base64
    const base64Result = Buffer.from(combined).toString('base64');
    
    console.log('🔐 Encriptación completada');
    console.log('   - Original:', jsonString.length, 'caracteres');
    console.log('   - Encriptado:', base64Result.length, 'caracteres Base64');
    
    return base64Result;
  } catch (error) {
    console.error('❌ Error en encriptación:', error);
    throw error;
  }
}

// ✅ FUNCIÓN PARA ENVIAR RESPUESTA ENCRIPTADA
function sendEncryptedResponse(res, data) {
  try {
    const encryptedBase64 = encryptAndEncode(data);
    console.log('📤 Enviando respuesta encriptada Base64');
    res.status(200).send(encryptedBase64);
  } catch (error) {
    console.error('Error enviando respuesta encriptada:', error);
    // Fallback simple
    res.status(200).send('error');
  }
}

// ✅ RUTA PRINCIPAL - GET
app.get('/', (req, res) => {
  console.log('🔵 GET en / - Verificación de webhook');
  
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Verificación oficial de webhook
  if (mode === 'subscribe' && token === verifyToken) {
    console.log('✅ VERIFICACIÓN EXITOSA');
    return res.status(200).send(challenge);
  }

  // Si es una prueba sin parámetros
  if (!mode && !token) {
    console.log('🟡 PRUEBA DETECTADA - Respondiendo con encriptación');
    const responseData = {
      status: 'success',
      message: 'Webhook endpoint is ready',
      encrypted: true,
      timestamp: new Date().toISOString()
    };
    return sendEncryptedResponse(res, responseData);
  }

  // Verificación fallida
  console.log('❌ VERIFICACIÓN FALLIDA');
  const errorResponse = {
    error: 'Verification failed',
    received: { mode, token: token ? 'PRESENT' : 'MISSING' }
  };
  sendEncryptedResponse(res, errorResponse);
});

// ✅ RUTA PRINCIPAL - POST
app.post('/', (req, res) => {
  console.log('🟢 POST en / - Evento de Meta Flow');
  
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📦 Body recibido:', JSON.stringify(req.body, null, 2));
  }

  // Respuesta encriptada para Meta Flows
  const responseData = {
    success: true,
    status: "success", 
    message: "Webhook processed successfully",
    timestamp: new Date().toISOString()
  };

  console.log('📤 Enviando respuesta encriptada...');
  sendEncryptedResponse(res, responseData);
});

// ✅ HEALTH CHECK
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    webhook_configured: true,
    verify_token_set: !!verifyToken,
    encryption_enabled: true,
    timestamp: new Date().toISOString()
  });
});

// ✅ CONFIGURACIÓN DEL SERVIDOR
const startServer = () => {
  if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
    // En producción, usar HTTP normal
    app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 Servidor en producción - Puerto ${port}`);
      console.log(`✅ Webhook: https://tu-dominio.com/`);
    });
  } else {
    // En desarrollo, usar HTTPS con los certificados corregidos
    try {
      const privateKey = process.env.PRIVATE_KEY;
      const certificate = process.env.CERTIFICATE;

      if (!privateKey || !certificate) {
        throw new Error('PRIVATE_KEY y CERTIFICATE requeridos');
      }

      const credentials = {
        key: privateKey,
        cert: certificate,
        rejectUnauthorized: false
      };

      const httpsServer = https.createServer(credentials, app);
      httpsServer.listen(port, () => {
        console.log(`🔒 Servidor HTTPS desarrollo - Puerto ${port}`);
        console.log(`✅ Webhook: https://localhost:${port}/`);
      });
    } catch (error) {
      console.error('Error HTTPS:', error.message);
      console.log('🔄 Iniciando servidor HTTP como fallback...');
      app.listen(port, () => {
        console.log(`🚀 Servidor HTTP - Puerto ${port}`);
      });
    }
  }
};

// ✅ INICIAR SERVIDOR
startServer();