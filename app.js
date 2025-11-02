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

// Route for GET requests
app.get('/', (req, res) => {
  const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('WEBHOOK VERIFIED');
    res.status(200).send(challenge);
  } else {
    res.status(403).end();
  }
});

// Route for POST requests
app.post('/', (req, res) => {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log(`\n\nWebhook received ${timestamp}\n`);
  console.log(JSON.stringify(req.body, null, 2));
  res.status(200).end();
});

// Leer los archivos del certificado
const privateKey = process.env.PRIVATE_KEY;
const certificate = process.env.CERTIFICATE;

// Verificar que existan las variables
if (!privateKey || !certificate) {
  console.error('ERROR: Las variables de entorno PRIVATE_KEY y CERTIFICATE son requeridas');
  process.exit(1);
}

const credentials = { key: privateKey, cert: certificate };

// Crear y arrancar el servidor HTTPS
const httpsServer = https.createServer(credentials, app);
httpsServer.listen(port, () => {
    console.log(`Servidor HTTPS escuchando en el puerto ${port}`);
});