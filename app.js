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

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Route for GET requests (Webhook verification) - WhatsApp espera /webhook
app.get('/webhook', (req, res) => {
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

// Route for POST requests (Webhook events) - WhatsApp espera /webhook
app.post('/webhook', (req, res) => {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log(`\n\n🌐 Webhook received ${timestamp}`);
  
  // Verificar que es un webhook de WhatsApp Business
  if (req.body.object !== 'whatsapp_business_account') {
    console.log('Not a WhatsApp Business webhook');
    return res.sendStatus(404);
  }

  try {
    // Procesar las entradas del webhook
    req.body.entry?.forEach(entry => {
      entry.changes?.forEach(change => {
        console.log('Change field:', change.field);
        console.log('Change value:', JSON.stringify(change.value, null, 2));
        
        if (change.field === 'messages') {
          processWhatsAppMessage(change.value);
        } else if (change.field === 'message_template_status_update') {
          processTemplateStatusUpdate(change.value);
        }
      });
    });

    // WhatsApp espera una respuesta 200 OK simple
    res.status(200).send('EVENT_RECEIVED');
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    // Siempre retornar 200 para mantener el webhook activo
    res.status(200).send('EVENT_RECEIVED');
  }
});

// Función para procesar mensajes de WhatsApp
function processWhatsAppMessage(webhookData) {
  try {
    console.log('Processing WhatsApp message...');
    
    const messages = webhookData.messages || [];
    const contacts = webhookData.contacts || [];
    const statuses = webhookData.statuses || [];

    // Procesar mensajes entrantes
    messages.forEach(message => {
      console.log('New message received:');
      console.log('- From:', message.from);
      console.log('- Message ID:', message.id);
      console.log('- Timestamp:', message.timestamp);
      console.log('- Type:', message.type);
      
      // Procesar según el tipo de mensaje
      switch (message.type) {
        case 'text':
          console.log('- Text:', message.text?.body);
          handleTextMessage(message);
          break;
        case 'image':
          console.log('- Image ID:', message.image?.id);
          handleImageMessage(message);
          break;
        case 'document':
          console.log('- Document:', message.document?.filename);
          handleDocumentMessage(message);
          break;
        case 'audio':
          console.log('- Audio ID:', message.audio?.id);
          handleAudioMessage(message);
          break;
        case 'interactive':
          console.log('- Interactive Type:', message.interactive?.type);
          handleInteractiveMessage(message);
          break;
        default:
          console.log('- Unhandled message type:', message.type);
      }
    });

    // Procesar estados de mensajes
    statuses.forEach(status => {
      console.log('Message status update:');
      console.log('- Message ID:', status.id);
      console.log('- Status:', status.status);
      console.log('- Timestamp:', status.timestamp);
      console.log('- Recipient ID:', status.recipient_id);
    });

  } catch (error) {
    console.error('Error in processWhatsAppMessage:', error);
  }
}

// Funciones manejadoras de diferentes tipos de mensaje
function handleTextMessage(message) {
  // Aquí implementas la lógica para mensajes de texto
  console.log('Handling text message from:', message.from);
  
  // Ejemplo: Responder automáticamente
  // sendTextMessage(message.from, 'Gracias por tu mensaje!');
}

function handleImageMessage(message) {
  console.log('Handling image message from:', message.from);
  // Lógica para manejar imágenes
}

function handleDocumentMessage(message) {
  console.log('Handling document message from:', message.from);
  // Lógica para manejar documentos
}

function handleAudioMessage(message) {
  console.log('Handling audio message from:', message.from);
  // Lógica para manejar audio
}

function handleInteractiveMessage(message) {
  console.log('Handling interactive message from:', message.from);
  // Lógica para botones, listas, etc.
}

function processTemplateStatusUpdate(updateData) {
  console.log('Processing template status update:', updateData);
  // Lógica para actualizaciones de estado de plantillas
}

// Configuración del servidor (tu código está bien aquí)
const startServer = () => {
  const port = process.env.PORT || 3000;
  
  if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
    app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 Servidor WhatsApp Webhook escuchando en puerto ${port}`);
      console.log(`✅ Webhook URL: https://your-domain.com/webhook`);
      console.log(`✅ Verify Token: ${verifyToken ? 'Configurado' : 'NO CONFIGURADO'}`);
    });
  } else {
    try {
      const privateKey = process.env.PRIVATE_KEY;
      const certificate = process.env.CERTIFICATE;

      if (!privateKey || !certificate) {
        throw new Error('PRIVATE_KEY y CERTIFICATE requeridos para desarrollo');
      }

      const credentials = { 
        key: privateKey, 
        cert: certificate,
        rejectUnauthorized: false
      };

      const httpsServer = https.createServer(credentials, app);
      httpsServer.listen(port, () => {
        console.log(`🔒 Servidor HTTPS desarrollo en puerto ${port}`);
        console.log(`✅ Webhook URL: https://localhost:${port}/webhook`);
      });
    } catch (error) {
      console.error('Error HTTPS:', error.message);
      process.exit(1);
    }
  }
};

// Iniciar el servidor
startServer();