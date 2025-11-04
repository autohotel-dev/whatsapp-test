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

// ... tus imports ...

// Middleware de diagnóstico para TODAS las rutas
app.use('*', (req, res, next) => {
  console.log('🔍 DIAGNÓSTICO - Solicitud recibida:');
  console.log('   Método:', req.method);
  console.log('   Ruta:', req.originalUrl);
  console.log('   Headers:', req.headers);
  console.log('   Body:', req.body);
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

// ✅ RUTA CATCH-ALL PARA GET (Para verificación de webhook)
app.get('*', (req, res) => {
  console.log('🔄 GET recibido en ruta catch-all:', req.originalUrl);
  const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;
  
  console.log('Parámetros de verificación:');
  console.log(' - mode:', mode);
  console.log(' - token:', token);
  console.log(' - challenge:', challenge);
  console.log(' - verifyToken esperado:', verifyToken);

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('✅ WEBHOOK VERIFICADO en ruta:', req.originalUrl);
    return res.status(200).send(challenge);
  } else {
    console.log('❌ Verificación fallida en ruta:', req.originalUrl);
    return res.status(200).json({ 
      message: 'Webhook verification endpoint',
      received: { mode, token },
      expected: { verifyToken }
    });
  }
});

// ✅ RUTA CATCH-ALL PARA POST (Para eventos de webhook)
app.post('*', (req, res) => {
  console.log('🔄 POST recibido en ruta catch-all:', req.originalUrl);
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

// Configuración del servidor
const startServer = () => {
  const port = process.env.PORT || 3000;
  
  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Servidor ejecutándose en puerto ${port}`);
    console.log(`✅ URL base: https://tu-dominio.com/`);
    console.log(`✅ El servidor capturará TODAS las rutas`);
    console.log(`🔍 Revisa los logs para ver qué ruta específica está llamando Meta`);
  });
};

startServer();
