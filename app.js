const express = require('express');
const app = express();

// Middleware
app.use(express.json());

// Configuración
const port = process.env.PORT || 3000;
const verifyToken = process.env.VERIFY_TOKEN;

// ✅ MIDDLEWARE DE LOG MEJORADO
app.use((req, res, next) => {
  console.log('=== SOLICITUD RECIBIDA ===');
  console.log('Método:', req.method);
  console.log('Ruta:', req.originalUrl);
  console.log('Query completo:', JSON.stringify(req.query));
  console.log('Headers:', JSON.stringify(req.headers));
  console.log('==========================');
  next();
});

// ✅ RUTA PRINCIPAL MEJORADA - GET
app.get('/', (req, res) => {
  console.log('🔵 GET en / - Solicitud de Meta');
  
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('Parámetros de verificación:');
  console.log('- hub.mode:', mode);
  console.log('- hub.verify_token:', token ? 'PRESENTE' : 'AUSENTE');
  console.log('- hub.challenge:', challenge);
  console.log('- Verify Token esperado:', verifyToken ? 'CONFIGURADO' : 'NO CONFIGURADO');

  // Verificación oficial de webhook
  if (mode === 'subscribe' && token === verifyToken) {
    console.log('✅ VERIFICACIÓN OFICIAL EXITOSA');
    return res.status(200).send(challenge);
  }

  // Si es una prueba de Meta sin parámetros
  if (!mode && !token) {
    console.log('🟡 PRUEBA DE META DETECTADA - Respondiendo con éxito');
    return res.status(200).json({
      status: 'success',
      message: 'Webhook endpoint is ready for Meta Flows',
      verified: true,
      timestamp: new Date().toISOString()
    });
  }

  // Si los parámetros están presentes pero incorrectos
  console.log('❌ VERIFICACIÓN FALLIDA');
  res.status(403).json({
    error: 'Verification failed',
    received: { mode, token },
    expected: { verifyToken }
  });
});

// ✅ RUTA PRINCIPAL - POST (Para eventos de Flow)
app.post('/', (req, res) => {
  console.log('🟢 POST en / - Evento de Meta Flow');
  
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📦 Body del evento:', JSON.stringify(req.body, null, 2));
  } else {
    console.log('📦 Body vacío');
  }

  // Respuesta específica para Meta Flows
  res.status(200).json({
    success: true,
    status: "success",
    messages: ["Webhook processed successfully"],
    data: {
      processed: true,
      timestamp: new Date().toISOString()
    }
  });
});

// ✅ RUTA ALTERNATIVA /webhook
app.get('/webhook', (req, res) => {
  console.log('🔵 GET en /webhook');
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('✅ VERIFICACIÓN EXITOSA en /webhook');
    return res.status(200).send(challenge);
  }

  res.status(200).json({
    status: 'active',
    message: 'Alternative webhook endpoint',
    path: '/webhook'
  });
});

app.post('/webhook', (req, res) => {
  console.log('🟢 POST en /webhook');
  res.status(200).json({
    success: true,
    message: 'Event received at alternative endpoint'
  });
});

// ✅ HEALTH CHECK
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    webhook_configured: true,
    verify_token_set: !!verifyToken,
    timestamp: new Date().toISOString()
  });
});

// ✅ INICIAR SERVIDOR
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${port}`);
  console.log(`✅ Webhook principal: https://tu-dominio.com/`);
  console.log(`✅ Verifica que VERIFY_TOKEN esté configurado: ${verifyToken ? '✅' : '❌'}`);
  console.log('📝 Para configurar en Meta:');
  console.log('   - URL: https://tu-dominio.com/');
  console.log('   - Verify Token: ' + verifyToken);
  console.log('   - Webhook Version: v1.0');
});