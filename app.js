// Import Express.js
const express = require('express');
const https = require('https');
const fs = require('fs');

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
  
  // Acknowledge receipt of the webhook
  res.status(200).json({ status: 'received' });
});

/// Verificar y cargar las claves
try {
  const privateKey = process.env.PRIVATE_KEY;
  const certificate = process.env.CERTIFICATE;

  if (!privateKey || !certificate) {
    throw new Error('Las variables de entorno PRIVATE_KEY y CERTIFICATE son requeridas');
  }

  const credentials = { 
    key: privateKey, 
    cert: certificate,
    rejectUnauthorized: false // Solo para desarrollo
  };

  const httpsServer = https.createServer(credentials, app);
  httpsServer.listen(port, () => {
    console.log(`Servidor HTTPS escuchando en el puerto ${port}`);
  });
} catch (error) {
  console.error('Error al configurar el servidor HTTPS:', error.message);
  console.error('Asegúrate de que las variables de entorno estén correctamente configuradas');
  process.exit(1);
}