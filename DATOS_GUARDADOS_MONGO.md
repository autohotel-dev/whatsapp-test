# 💾 Datos Guardados en MongoDB - Auto Hotel Luxor

## ✅ TODO lo que se guarda automáticamente:

### 1. 💬 **MENSAJES** (`messages` collection)
**Cada mensaje de conversación se guarda con:**
- Teléfono del usuario
- Texto del mensaje
- Dirección (incoming/outgoing)
- Tipo de mensaje (text, image, interactive, flow)
- Intención detectada
- Nivel de confianza
- Timestamp automático

**📍 Se guarda en:** `src/modules/chatbot/autoreply.js`
- Líneas 78-88: Mensajes entrantes del usuario
- Líneas 546-554: Mensajes salientes del bot

---

### 2. 👤 **USUARIOS** (`users` collection)
**Perfil completo de cada usuario:**
- Teléfono (único)
- Nombre (cuando se captura)
- Email (cuando se captura)
- Primera interacción
- Última interacción
- Total de conversaciones
- Total de mensajes enviados
- **Total de reservas** (se actualiza automáticamente)
- Lead score (puntuación de engagement)
- Intereses detectados (habitaciones, precios, servicios)
- Idioma preferido
- Segmentación automática:
  - `new` - Usuario nuevo
  - `engaged` - Usuario activo (10+ mensajes)
  - `frequent` - Cliente frecuente (2+ reservas)
  - `vip` - Cliente VIP (5+ reservas)
  - `inactive` - Usuario inactivo (>7 días sin interacción)
- Notas personalizadas
- Timestamps (createdAt, updatedAt)

**📍 Se actualiza en:** `src/modules/chatbot/autoreply.js` línea 87

---

### 3. 🏨 **RESERVAS** (`reservations` collection)
**Cada reserva confirmada incluye:**
- Teléfono del usuario
- **Tipo de paquete** (deseo, enamorados, premium)
- **Tipo de habitación** (sencilla, jacuzzi, sauna_jacuzzi, alberca)
- **Fecha completa** (Date object con fecha y hora)
- **Hora de check-in** (string)
- **Número de huéspedes** (number)
- **Nombre completo del cliente**
- **Email del cliente**
- **Comentarios especiales**
- **Estado:**
  - `pending` - Pendiente
  - `confirmed` - Confirmada ✅
  - `cancelled` - Cancelada
  - `completed` - Completada
- **Precio total** (calculado según paquete)
- **Código de confirmación** único (Ej: LXR62759012)
- Origen (siempre 'whatsapp')
- Timestamps (createdAt, updatedAt)

**📍 Se guarda en:** `src/modules/chatbot/flow.js` función `guardarReservaEnBD()`
- Línea 217: Se ejecuta al confirmar reserva

**🔄 Actualiza automáticamente:** Usuario.totalReservations += 1

---

### 4. 🔔 **NOTIFICACIONES** (`notifications` collection)
**Cada notificación enviada se registra:**

#### A) Notificación al Hotel:
- Tipo: `reservation_hotel`
- Teléfono del hotel
- Mensaje completo enviado
- ID de la reserva relacionada
- Estado: `sent`
- Metadata adicional:
  - Nombre del cliente
  - Teléfono del cliente
  - Tipo de paquete
  - Tipo de habitación
  - Monto total
- Timestamp

#### B) Confirmación al Cliente:
- Tipo: `reservation_confirmation`
- Teléfono del cliente
- Mensaje completo enviado
- ID de la reserva relacionada
- Estado: `sent`
- Metadata adicional:
  - Nombre del cliente
  - Tipo de paquete
  - Tipo de habitación
  - Monto total
  - Fecha de check-in
  - Hora de check-in
- Timestamp

**📍 Se guarda en:** `src/modules/chatbot/flow.js`
- Línea 338: Notificación al hotel
- Línea 403: Confirmación al cliente

---

### 5. 📊 **CONVERSACIONES** (`conversations` collection)
**Cada sesión de chat se registra con:**
- Teléfono del usuario
- Hora de inicio
- Hora de fin
- Duración total
- Número de mensajes intercambiados
- Intenciones detectadas durante la conversación
- Resultado (exitosa, abandonada, error)

**📍 Se guarda en:** `src/modules/chatbot/autoreply.js`
- Se crea automáticamente al guardar mensajes

---

### 6. 📈 **ANALYTICS DIARIOS** (`dailyanalytics` collection)
**Estadísticas agregadas por día:**
- Fecha del día
- Total de mensajes
- Total de conversaciones únicas
- Total de usuarios únicos
- Total de reservas
- Total de errores
- Intenciones más comunes (top 10)
- Horario pico de actividad
- Tasa de conversión (reservas / conversaciones)

**📍 Se actualiza automáticamente** en cada interacción

---

## 📊 Estructura de Datos en MongoDB:

```
luxor-whatsapp/
├── messages         (todos los mensajes)
├── users            (perfiles de usuarios)
├── reservations     (reservas confirmadas)
├── notifications    (todas las notificaciones enviadas)
├── conversations    (sesiones de chat)
├── dailyanalytics   (estadísticas diarias)
└── feedback         (opiniones de usuarios - opcional)
```

---

## 🔍 Ejemplos de Uso:

### Ver todas las reservas de hoy:
```javascript
db.reservations.find({
  createdAt: {
    $gte: new Date("2025-11-10T00:00:00"),
    $lt: new Date("2025-11-11T00:00:00")
  }
})
```

### Ver clientes VIP:
```javascript
db.users.find({ segmentation: "vip" })
```

### Ver notificaciones del último mes:
```javascript
db.notifications.find({
  createdAt: { $gte: new Date("2025-10-10") }
}).sort({ createdAt: -1 })
```

### Estadísticas de reservas por paquete:
```javascript
db.reservations.aggregate([
  { $group: { _id: "$packageType", total: { $sum: 1 } } }
])
```

---

## 🎯 Beneficios:

✅ **Trazabilidad completa** - Cada interacción está registrada
✅ **Analytics en tiempo real** - Datos actualizados al instante
✅ **Auditoría** - Historial completo de todas las acciones
✅ **Segmentación de clientes** - Clasificación automática
✅ **Estadísticas detalladas** - Para dashboard futuro
✅ **Gestión de reservas** - Estado y seguimiento completo
✅ **Notificaciones rastreables** - Saber qué se envió y cuándo

---

## 📱 Dashboard Futuro:

Con estos datos podrás crear:
1. Panel de control en tiempo real
2. Gráficas de conversiones
3. Lista de reservas con filtros
4. Gestión de clientes
5. Reportes automáticos
6. Alertas y notificaciones
7. Estadísticas de paquetes más vendidos
8. Horarios pico de reservas

---

**✅ TODOS los datos están siendo guardados automáticamente en MongoDB.**
**💾 No necesitas hacer nada, solo conectar tu dashboard futuro a esta BD.**
