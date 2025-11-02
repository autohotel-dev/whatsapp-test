// Import Express.js
const express = require('express');
const https = require('https');
const fs = require('fs');
const CryptoJS = require('crypto-js');

// Create an Express app
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Set port and verify_token
const port = process.env.PORT || 3000;
const verifyToken = process.env.VERIFY_TOKEN;

// Route for GET requests (Webhook verification)
app.get('/', (req, res) => {
  console.log('Received webhook verification request');
  const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;
  
  console.log('Mode:', mode);
  console.log('Token received:', token);
  console.log('Expected token:', verifyToken);

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('WEBHOOK VERIFIED');
    return res.status(200).send(challenge);
  } else {
    console.log('Verification failed. Check the verify token.');
    return res.status(403).json({
      error: 'Verification failed. Check the verify token.'
    });
  }
});

// Route for POST requests (Webhook events)
app.post('/', (req, res) => {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log(`\n\n🌐 Webhook received ${timestamp}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  
  try {
    // Get the encryption key from headers or body
    const encryptionKey = req.headers['x-hub-encryption-key'] || req.body.encryption_key;
    
    if (!encryptionKey) {
      console.warn('No se encontró la clave de cifrado en la solicitud');
      return res.status(400).send('Se requiere clave de cifrado');
    }
    
    // Create response object
    const responseObj = { 
      status: 'received',
      timestamp: new Date().toISOString()
    };
    
    // Convert response object to string
    const responseString = JSON.stringify(responseObj);
    
    // Encrypt the response with AES using the provided key
    const encrypted = CryptoJS.AES.encrypt(responseString, encryptionKey).toString();
    
    // Convert to Base64
    const responseBase64 = Buffer.from(encrypted).toString('base64');
    
    console.log('Encrypted response (Base64):', responseBase64);
    
    // Send encrypted and base64 encoded response
    res.status(200).send(responseBase64);
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Error processing webhook');
  }
});

// Configuración del servidor para Render
const startServer = () => {
  // En Render, usamos el puerto proporcionado por la variable de entorno
  const port = process.env.PORT || 3000;
  
  // En producción (Render), usamos el puerto HTTP estándar
  if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
    app.listen(port, '0.0.0.0', () => {
      console.log(`Servidor HTTP escuchando en el puerto ${port} (modo producción)`);
    });
  } 
  // En desarrollo local, usamos HTTPS con certificados autofirmados
  else {
    try {
      const privateKey = process.env.PRIVATE_KEY;
      const certificate = process.env.CERTIFICATE;

      if (!privateKey || !certificate) {
        throw new Error('Las variables de entorno PRIVATE_KEY y CERTIFICATE son requeridas para desarrollo local');
      }

      const credentials = { 
        key: privateKey, 
        cert: certificate,
        rejectUnauthorized: false // Solo para desarrollo
      };

      const httpsServer = https.createServer(credentials, app);
      httpsServer.listen(port, () => {
        console.log(`Servidor HTTPS escuchando en el puerto ${port} (modo desarrollo)`);
      });
    } catch (error) {
      console.error('Error al configurar el servidor HTTPS:', error.message);
      console.error('Asegúrate de que las variables de entorno estén correctamente configuradas');
      process.exit(1);
    }
  }
};

// Iniciar el servidor
startServer();