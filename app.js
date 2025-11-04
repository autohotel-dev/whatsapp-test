const express = require('express');
const app = express();

// Middleware
app.use(express.json());

// Configuración
const port = process.env.PORT || 3000;
const verifyToken = process.env.VERIFY_TOKEN;

// ✅ MIDDLEWARE DE LOG
app.use((req, res, next) => {
  console.log('=== SOLICITUD RECIBIDA ===');
  console.log('Método:', req.method);
  console.log('Ruta:', req.originalUrl);
  console.log('Query:', JSON.stringify(req.query));
  console.log('==========================');
  next();
});

// ✅ FUNCIÓN PARA ENVIAR RESPUESTAS EN BASE64
function sendBase64Response(res, data) {
  try {
    // Convertir el objeto a string JSON
    const jsonString = JSON.stringify(data);
    // Codificar a Base64
    const base64Response = Buffer.from(jsonString).toString('base64');
    console.log('📤 Enviando respuesta Base64:', base64Response);
    res.status(200).send(base64Response);
  } catch (error) {
    console.error('Error codificando respuesta Base64:', error);
    // Fallback: enviar respuesta normal
    res.status(200).json(data);
  }
}

// ✅ RUTA PRINCIPAL - GET
app.get('/', (req, res) => {
  console.log('🔵 GET en / - Verificación de webhook');
  
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('Parámetros:');
  console.log('- hub.mode:', mode);
  console.log('- hub.verify_token:', token ? 'PRESENTE' : 'AUSENTE');
  console.log('- hub.challenge:', challenge);

  // Verificación oficial de webhook
  if (mode === 'subscribe' && token === verifyToken) {
    console.log('✅ VERIFICACIÓN EXITOSA');
    return res.status(200).send(challenge);
  }

  // Si es una prueba sin parámetros
  if (!mode && !token) {
    console.log('🟡 PRUEBA DETECTADA - Respondiendo con Base64');
    const responseData = {
      status: 'success',
      message: 'Webhook endpoint is ready',
      verified: true,
      timestamp: new Date().toISOString()
    };
    return sendBase64Response(res, responseData);
  }

  // Verificación fallida
  console.log('❌ VERIFICACIÓN FALLIDA');
  const errorResponse = {
    error: 'Verification failed',
    received: { mode, token }
  };
  sendBase64Response(res, errorResponse);
});

// ✅ RUTA PRINCIPAL - POST (Para eventos de Flow)
app.post('/', (req, res) => {
  console.log('🟢 POST en / - Evento de Meta Flow');
  
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📦 Body recibido:', JSON.stringify(req.body, null, 2));
  }

  // Respuesta en Base64 para Meta Flows
  const responseData = {
    success: true,
    status: "success",
    messages: ["Webhook processed successfully"],
    data: {
      processed: true,
      timestamp: new Date().toISOString()
    }
  };

  console.log('📤 Respuesta JSON:', responseData);
  sendBase64Response(res, responseData);
});

// ✅ RUTA ALTERNATIVA /webhook - GET
app.get('/webhook', (req, res) => {
  console.log('🔵 GET en /webhook');
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('✅ VERIFICACIÓN EXITOSA en /webhook');
    return res.status(200).send(challenge);
  }

  const responseData = {
    status: 'active',
    message: 'Alternative webhook endpoint',
    path: '/webhook'
  };
  sendBase64Response(res, responseData);
});

// ✅ RUTA ALTERNATIVA /webhook - POST
app.post('/webhook', (req, res) => {
  console.log('🟢 POST en /webhook');
  
  const responseData = {
    success: true,
    status: "success",
    message: "Event received successfully",
    timestamp: new Date().toISOString()
  };

  console.log('📤 Respuesta para /webhook:', responseData);
  sendBase64Response(res, responseData);
});

// ✅ HEALTH CHECK (sin Base64 para fácil verificación)
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    webhook_configured: true,
    verify_token_set: !!verifyToken,
    base64_responses: true,
    timestamp: new Date().toISOString()
  });
});

// ✅ INICIAR SERVIDOR
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${port}`);
  console.log(`✅ Todas las respuestas se envían en Base64`);
  console.log(`✅ Health check: http://localhost:${port}/health`);
  console.log(`✅ Webhook: https://tu-dominio.com/`);
});