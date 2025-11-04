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

// ✅ MIDDLEWARE DE DIAGNÓSTICO CORREGIDO
app.use((req, res, next) => {
  console.log('🔍 DIAGNÓSTICO - Solicitud recibida:');
  console.log('   Método:', req.method);
  console.log('   Ruta:', req.originalUrl);
  console.log('   Headers:', JSON.stringify(req.headers, null, 2));
  if (Object.keys(req.body).length > 0) {
    console.log('   Body:', JSON.stringify(req.body, null, 2));
  } else {
    console.log('   Body: (vacío)');
  }
  next();
});

// Health check mejorado
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    routes: ['/', '/webhook', '/health']
  });
});

// ✅ RUTA RAÍZ PARA GET (Para verificación de webhook)
app.get('/', (req, res) => {
  console.log('🔄 GET recibido en raíz:/');
  const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;
  
  console.log('Parámetros de verificación:');
  console.log(' - mode:', mode);
  console.log(' - token:', token);
  console.log(' - challenge:', challenge);
  console.log(' - verifyToken esperado:', verifyToken);

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('✅ WEBHOOK VERIFICADO en raíz');
    return res.status(200).send(challenge);
  } else {
    console.log('❌ Verificación fallida en raíz');
    return res.status(200).json({ 
      message: 'Webhook verification endpoint',
      received: { mode, token },
      expected: { verifyToken }
    });
  }
});

// ✅ RUTA RAÍZ PARA POST (Para eventos de webhook)
app.post('/', (req, res) => {
  console.log('🔄 POST recibido en raíz:/');
  console.log('Body recibido:', JSON.stringify(req.body, null, 2));
  
  // Siempre responder con éxito a Meta
  const response = {
    success: true,
    message: 'Webhook received successfully',
    timestamp: new Date().toISOString(),
    path: req.originalUrl
  };
  
  console.log('✅ Respondiendo a Meta:', response);
  res.status(200).json(response);
});

// ✅ RUTA CATCH-ALL PARA CUALQUIER OTRA RUTA GET
app.get('*', (req, res) => {
  console.log('🔄 GET recibido en ruta no definida:', req.originalUrl);
  const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;
  
  if (mode === 'subscribe' && token === verifyToken) {
    console.log('✅ WEBHOOK VERIFICADO en ruta alternativa:', req.originalUrl);
    return res.status(200).send(challenge);
  }
  
  res.status(200).json({
    message: 'Esta ruta no está definida, pero el servidor está funcionando',
    current_path: req.originalUrl,
    available_routes: ['GET /', 'POST /', 'GET /health']
  });
});

// ✅ RUTA CATCH-ALL PARA CUALQUIER OTRA RUTA POST
app.post('*', (req, res) => {
  console.log('🔄 POST recibido en ruta no definida:', req.originalUrl);
  console.log('Body recibido:', JSON.stringify(req.body, null, 2));
  
  res.status(200).json({
    success: true,
    message: 'Webhook received in alternative route',
    timestamp: new Date().toISOString(),
    path: req.originalUrl
  });
});

// Configuración del servidor
const startServer = () => {
  const port = process.env.PORT || 3000;
  
  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Servidor ejecutándose en puerto ${port}`);
    console.log(`✅ URL base: https://tu-dominio.com/`);
    console.log(`✅ Webhook configurado en: /`);
    console.log(`✅ Health check en: /health`);
    console.log(`🔍 El servidor capturará TODAS las rutas`);
  });
};

startServer();