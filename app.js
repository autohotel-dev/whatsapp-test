const express = require('express');
const app = express();

// Middleware
app.use(express.json());

// Configuración
const port = process.env.PORT || 3000;
const verifyToken = process.env.VERIFY_TOKEN || 'meta_flow_token';

// ✅ MIDDLEWARE DE LOG PARA TODAS LAS RUTAS
app.use((req, res, next) => {
  console.log('=== SOLICITUD RECIBIDA ===');
  console.log('Método:', req.method);
  console.log('Ruta:', req.originalUrl);
  console.log('Query:', req.query);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body));
  }
  console.log('==========================');
  next();
});

// ✅ RUTA PRINCIPAL - GET (Para verificación)
app.get('/', (req, res) => {
  console.log('🔵 GET en / - Verificación de webhook');
  
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('Modo:', mode);
  console.log('Token recibido:', token);
  console.log('Token esperado:', verifyToken);

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('✅ VERIFICACIÓN EXITOSA');
    return res.status(200).send(challenge);
  }

  // Si no es verificación, responder con info
  res.json({
    status: 'active',
    message: 'Webhook endpoint funcionando',
    timestamp: new Date().toISOString()
  });
});

// ✅ RUTA PRINCIPAL - POST (Para eventos)
app.post('/', (req, res) => {
  console.log('🟢 POST en / - Evento de webhook');
  
  // Siempre responder éxito a Meta
  res.json({
    success: true,
    message: 'Evento recibido correctamente',
    timestamp: new Date().toISOString()
  });
});

// ✅ RUTA ALTERNATIVA /webhook - GET
app.get('/webhook', (req, res) => {
  console.log('🔵 GET en /webhook - Verificación alternativa');
  
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('✅ VERIFICACIÓN EXITOSA en /webhook');
    return res.status(200).send(challenge);
  }

  res.json({
    status: 'active',
    message: 'Webhook alternativo funcionando',
    path: '/webhook'
  });
});

// ✅ RUTA ALTERNATIVA /webhook - POST
app.post('/webhook', (req, res) => {
  console.log('🟢 POST en /webhook - Evento alternativo');
  res.json({
    success: true,
    message: 'Evento recibido en webhook alternativo',
    timestamp: new Date().toISOString()
  });
});

// ✅ HEALTH CHECK
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    server: 'running',
    timestamp: new Date().toISOString()
  });
});

// ✅ MANEJADOR PARA RUTAS NO ENCONTRADAS
app.use((req, res) => {
  console.log('🟡 Ruta no definida:', req.method, req.originalUrl);
  res.status(200).json({
    message: 'Ruta no definida pero servidor funcionando',
    method: req.method,
    path: req.originalUrl,
    available_routes: ['GET /', 'POST /', 'GET /webhook', 'POST /webhook', 'GET /health']
  });
});

// ✅ INICIAR SERVIDOR
app.listen(port, () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${port}`);
  console.log(`✅ Health: http://localhost:${port}/health`);
  console.log(`✅ Webhook principal: http://localhost:${port}/`);
  console.log(`✅ Webhook alternativo: http://localhost:${port}/webhook`);
  console.log('🔍 Esperando solicitudes de Meta...');
});