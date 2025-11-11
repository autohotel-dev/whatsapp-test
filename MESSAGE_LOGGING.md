# 💬 Sistema de Registro de Mensajes

## 📋 Descripción

El sistema ahora **guarda automáticamente** todos los mensajes que envía y recibe el bot en la base de datos MongoDB. Esto permite:

- ✅ Historial completo de conversaciones
- ✅ Analytics de mensajes
- ✅ Auditoría de comunicaciones
- ✅ Tracking de intenciones del usuario
- ✅ Mejora continua del bot

---

## 🔄 Flujo de Registro

### Mensajes Entrantes (Usuario → Bot)

```
1. Usuario envía mensaje por WhatsApp
   ↓
2. Webhook recibe el mensaje en app.js
   ↓
3. messageLogger.logIncoming() guarda en BD
   ↓
4. Bot procesa y responde
```

### Mensajes Salientes (Bot → Usuario)

```
1. Bot genera respuesta
   ↓
2. sendTextMessage() envía por WhatsApp API
   ↓
3. messageLogger.logOutgoing() guarda en BD
   ↓
4. Usuario recibe el mensaje
```

---

## 📁 Archivos Principales

### 1. `src/services/message-logger.js`
Servicio centralizado para registrar mensajes.

**Métodos principales:**
- `logIncoming()` - Mensajes que recibe el bot
- `logOutgoing()` - Mensajes que envía el bot
- `logBatch()` - Múltiples mensajes a la vez
- `getHistory()` - Obtener historial de un usuario

### 2. `app.js`
Webhook que registra mensajes entrantes.

```javascript
// Mensajes de texto
await messageLogger.logIncoming(userPhone, messageText, 'pending', 0, 'text');

// Imágenes (comprobantes)
await messageLogger.logIncoming(userPhone, '[Imagen - Comprobante de pago]', 'payment_proof', 1.0, 'image');
```

### 3. `src/services/message-sender.js`
Servicio que registra mensajes salientes automáticamente.

```javascript
// Después de enviar cualquier mensaje
await messageLogger.logOutgoing(phoneNumber, text, 'bot_response', 'text');
```

---

## 💾 Estructura en MongoDB

Los mensajes se guardan en la colección **`Conversation`**:

```javascript
{
  "_id": ObjectId("674xxx"),
  "userPhone": "5214426363547",
  "messages": [
    {
      "text": "Hola, quiero reservar",
      "direction": "incoming",      // incoming | outgoing
      "intent": "reservar",          // intención detectada
      "confidence": 0.85,            // nivel de confianza
      "timestamp": "2025-11-10T20:30:00.000Z",
      "messageType": "text"          // text | image | button | flow
    },
    {
      "text": "¡Excelente! Te ayudo a reservar...",
      "direction": "outgoing",
      "intent": "bot_response",
      "confidence": 1.0,
      "timestamp": "2025-11-10T20:30:05.000Z",
      "messageType": "text"
    },
    {
      "text": "[Flow de Reserva enviado]",
      "direction": "outgoing",
      "intent": "reservation_flow",
      "confidence": 1.0,
      "timestamp": "2025-11-10T20:30:10.000Z",
      "messageType": "flow"
    },
    {
      "text": "[Imagen - Comprobante de pago]",
      "direction": "incoming",
      "intent": "payment_proof",
      "confidence": 1.0,
      "timestamp": "2025-11-10T21:00:00.000Z",
      "messageType": "image"
    }
  ],
  "sessionStart": "2025-11-10T20:30:00.000Z",
  "isActive": true,
  "totalMessages": 4,
  "leadScore": 85,
  "conversionStatus": "reserved",
  "createdAt": "2025-11-10T20:30:00.000Z",
  "updatedAt": "2025-11-10T21:00:00.000Z"
}
```

---

## 🎯 Tipos de Mensajes Registrados

### 1. Mensajes de Texto
```javascript
{
  text: "Hola, quiero reservar",
  direction: "incoming",
  intent: "pending",  // Se actualiza después del procesamiento
  messageType: "text"
}
```

### 2. Imágenes
```javascript
{
  text: "[Imagen - Comprobante de pago]",
  direction: "incoming",
  intent: "payment_proof",
  messageType: "image"
}
```

### 3. Flows
```javascript
{
  text: "[Flow de Reserva enviado]",
  direction: "outgoing",
  intent: "reservation_flow",
  messageType: "flow"
}
```

### 4. Botones
```javascript
{
  text: "Selecciona una opción",
  direction: "outgoing",
  intent: "bot_response",
  messageType: "button"
}
```

---

## 📊 Consultas Útiles

### Obtener historial de un usuario

**JavaScript:**
```javascript
const messageLogger = require('./src/services/message-logger');

const history = await messageLogger.getHistory('5214426363547', 50);
console.log(history);
```

**API Endpoint:**
```
GET /api/messages/user/5214426363547?limit=50
```

**MongoDB:**
```javascript
db.conversations.findOne({ 
  userPhone: "5214426363547" 
})
```

### Contar mensajes por dirección

```javascript
db.conversations.aggregate([
  { $unwind: "$messages" },
  { 
    $group: { 
      _id: "$messages.direction", 
      count: { $sum: 1 } 
    } 
  }
])

// Resultado:
// { "_id": "incoming", "count": 2850 }
// { "_id": "outgoing", "count": 2570 }
```

### Top 10 intenciones

```javascript
db.conversations.aggregate([
  { $unwind: "$messages" },
  { 
    $group: { 
      _id: "$messages.intent", 
      count: { $sum: 1 } 
    } 
  },
  { $sort: { count: -1 } },
  { $limit: 10 }
])
```

### Mensajes de hoy

```javascript
const today = new Date();
today.setHours(0, 0, 0, 0);

db.conversations.find({
  "messages.timestamp": { $gte: today }
})
```

---

## 🔍 Logs del Sistema

Cuando se guardan mensajes, verás en la consola:

```bash
# Mensaje entrante
💾 Mensaje entrante guardado: 5214426363547 - "Hola, quiero reservar..."

# Mensaje saliente
💾 Mensaje saliente guardado: 5214426363547 - "¡Excelente! Te ayudo a res..."

# Si la BD no está conectada
⚠️ BD no conectada - mensaje no guardado
```

---

## 🚀 Ventajas del Sistema

### 1. **Historial Completo**
- Todas las conversaciones guardadas
- Fácil auditoría
- Recuperación de contexto

### 2. **Analytics Mejorados**
```javascript
// Tasa de respuesta
const totalIncoming = messages.filter(m => m.direction === 'incoming').length;
const totalOutgoing = messages.filter(m => m.direction === 'outgoing').length;
const responseRate = (totalOutgoing / totalIncoming) * 100;
```

### 3. **Detección de Intenciones**
```javascript
// Intenciones más comunes
const intents = messages.map(m => m.intent);
const topIntent = mostFrequent(intents);
```

### 4. **Mejora del Bot**
- Identifica conversaciones problemáticas
- Detecta patrones de usuarios
- Optimiza respuestas

### 5. **Compliance y Legal**
- Registro de todas las comunicaciones
- Timestamp de cada mensaje
- Trazabilidad completa

---

## 📈 Métricas Disponibles

### Endpoint: GET /api/messages/stats

```json
{
  "success": true,
  "stats": {
    "total": 5420,
    "byDirection": {
      "incoming": 2850,
      "outgoing": 2570
    },
    "topIntents": [
      { "_id": "reservar", "count": 450 },
      { "_id": "precios", "count": 380 },
      { "_id": "habitaciones", "count": 320 }
    ]
  }
}
```

### Dashboard Analytics

```javascript
// Tiempo promedio de respuesta
const avgResponseTime = calculateAvgTime(conversations);

// Conversaciones activas
const active = conversations.filter(c => c.isActive).length;

// Tasa de conversión
const conversions = conversations.filter(c => c.conversionStatus === 'reserved').length;
const conversionRate = (conversions / conversations.length) * 100;
```

---

## 🛠️ Mantenimiento

### Limpiar conversaciones antiguas

```javascript
// Eliminar conversaciones de hace más de 90 días
const cutoffDate = new Date();
cutoffDate.setDate(cutoffDate.getDate() - 90);

await Conversation.deleteMany({
  updatedAt: { $lt: cutoffDate },
  isActive: false
});
```

### Archivar conversaciones

```javascript
// Marcar como inactivas después de 24 horas sin mensajes
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);

await Conversation.updateMany(
  { 
    updatedAt: { $lt: yesterday },
    isActive: true 
  },
  { 
    $set: { isActive: false, sessionEnd: new Date() } 
  }
);
```

---

## 🔒 Privacidad y GDPR

### Eliminar datos de un usuario

```javascript
// Eliminar toda la conversación
await Conversation.deleteMany({ userPhone: '5214426363547' });

// O anonimizar
await Conversation.updateMany(
  { userPhone: '5214426363547' },
  { 
    $set: { 
      userPhone: 'ANONIMIZADO',
      'messages.$[].text': '[ELIMINADO]'
    } 
  }
);
```

---

## 🧪 Testing

### Prueba manual

```bash
# 1. Envía un mensaje por WhatsApp al bot
"Hola"

# 2. Verifica en MongoDB
db.conversations.findOne({ userPhone: "tu_numero" })

# 3. Deberías ver:
# - Mensaje entrante: "Hola" (incoming)
# - Mensaje saliente: Respuesta del bot (outgoing)
```

### Prueba con API

```bash
# Enviar mensaje desde dashboard
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "5214426363547",
    "message": "Prueba de logging"
  }'

# Verificar que se guardó
curl http://localhost:3000/api/messages/user/5214426363547?limit=10
```

---

## ✅ Checklist de Implementación

- [x] Servicio MessageLogger creado
- [x] Mensajes entrantes de texto guardados
- [x] Mensajes salientes de texto guardados
- [x] Imágenes entrantes guardadas
- [x] Imágenes salientes guardadas
- [x] Flows guardados
- [x] Integración con app.js
- [x] Integración con message-sender.js
- [x] Endpoint de stats actualizado
- [x] Documentación creada

---

## 📚 Recursos

- **Schema**: `src/modules/database/database.js` - conversationSchema
- **Logger**: `src/services/message-logger.js`
- **Webhook**: `app.js` - líneas de logIncoming()
- **Sender**: `src/services/message-sender.js` - líneas de logOutgoing()
- **API**: `/api/messages/user/:phone` y `/api/messages/stats`

---

**Implementado para Auto Hotel Luxor** 🏨

_Sistema de registro de mensajes activo y funcional_ 💬✨
