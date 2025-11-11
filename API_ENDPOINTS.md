# 📡 API Endpoints - Auto Hotel Luxor Bot

Base URL: `https://tu-app.onrender.com`

---

## 🏨 **RESERVAS**

### 1. Obtener todas las reservas
```http
GET /api/reservations
```
**Respuesta:**
```json
{
  "success": true,
  "total": 25,
  "reservations": [
    {
      "_id": "674xxx",
      "userPhone": "2462636547",
      "packageType": "deseo",
      "roomType": "master_suite_alberca",
      "date": "2025-11-16T12:00:00Z",
      "checkInTime": "12:00",
      "numberOfGuests": 2,
      "customerName": "Ricardo Minor",
      "customerEmail": "email@example.com",
      "status": "pending_payment",
      "totalAmount": 2900,
      "confirmationCode": "LXR62759012",
      "paymentDeadline": "2025-11-10T18:00:00Z",
      "createdAt": "2025-11-10T08:00:00Z"
    }
  ]
}
```

### 2. Obtener reservas por estado
```http
GET /api/reservations?status=pending_payment
GET /api/reservations?status=payment_received
GET /api/reservations?status=confirmed
GET /api/reservations?status=cancelled
```

### 3. Obtener reservas por fecha
```http
GET /api/reservations?date=2025-11-16
GET /api/reservations?startDate=2025-11-10&endDate=2025-11-20
```

### 4. Obtener reservas de un usuario
```http
GET /api/reservations/user/2462636547
```

### 5. Obtener detalles de una reserva
```http
GET /api/reservations/:id
```

### 6. Actualizar estado de reserva
```http
PUT /api/reservations/:id/status
```
**Body:**
```json
{
  "status": "confirmed"
}
```

### 7. Estadísticas de reservas
```http
GET /api/reservations/stats
```
**Respuesta:**
```json
{
  "success": true,
  "stats": {
    "total": 125,
    "pending_payment": 5,
    "payment_received": 3,
    "confirmed": 100,
    "cancelled": 15,
    "completed": 2,
    "byPackage": {
      "deseo": 50,
      "enamorados": 45,
      "premium": 30
    },
    "byRoom": {
      "master_suite_sencilla": 40,
      "master_suite_jacuzzi": 45,
      "master_suite_sauna_jacuzzi": 25,
      "master_suite_alberca": 15
    },
    "totalRevenue": 287500,
    "averageAmount": 2300
  }
}
```

---

## 👥 **USUARIOS**

### 8. Obtener todos los usuarios
```http
GET /api/users
```

### 9. Obtener usuario por teléfono
```http
GET /api/users/:phone
```
**Respuesta:**
```json
{
  "success": true,
  "user": {
    "_id": "674xxx",
    "phone": "2462636547",
    "name": "Ricardo Minor",
    "email": "email@example.com",
    "firstInteraction": "2025-11-01T10:00:00Z",
    "lastInteraction": "2025-11-10T08:00:00Z",
    "totalConversations": 5,
    "totalMessages": 45,
    "totalReservations": 2,
    "leadScore": 85,
    "interests": ["habitaciones", "precios", "servicios"],
    "preferredLanguage": "es",
    "segmentation": "frequent"
  }
}
```

### 10. Búsqueda de usuarios
```http
GET /api/users/search?q=Ricardo
GET /api/users/search?phone=2462636547
GET /api/users/search?email=email@example.com
```

### 11. Estadísticas de usuarios
```http
GET /api/users/stats
```
**Respuesta:**
```json
{
  "success": true,
  "stats": {
    "total": 450,
    "new": 120,
    "engaged": 180,
    "frequent": 80,
    "vip": 50,
    "inactive": 20,
    "averageLeadScore": 65,
    "topInterests": [
      { "interest": "precios", "count": 350 },
      { "interest": "habitaciones", "count": 320 }
    ]
  }
}
```

---

## 💬 **MENSAJES Y CONVERSACIONES**

### 12. Obtener todos los mensajes
```http
GET /api/messages?limit=100&offset=0
```

### 13. Obtener mensajes de un usuario
```http
GET /api/messages/user/:phone
```
**Respuesta:**
```json
{
  "success": true,
  "total": 25,
  "messages": [
    {
      "_id": "674xxx",
      "userPhone": "2462636547",
      "text": "hola",
      "direction": "incoming",
      "intent": "greeting",
      "confidence": 0.85,
      "messageType": "text",
      "createdAt": "2025-11-10T08:00:00Z"
    }
  ]
}
```

### 14. Obtener conversaciones activas
```http
GET /api/conversations/active
```

### 15. Obtener conversación de un usuario
```http
GET /api/conversations/:phone
```

### 16. Estadísticas de mensajes
```http
GET /api/messages/stats
```
**Respuesta:**
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
      { "_id": "habitaciones", "count": 320 },
      { "_id": "servicios", "count": 250 },
      { "_id": "ubicacion", "count": 180 }
    ]
  }
}
```

### 17. Enviar mensaje a un usuario
```http
POST /api/messages/send
Content-Type: application/json
```
**Body:**
```json
{
  "phone": "5214426363547",
  "message": "Hola, tu reserva ha sido confirmada exitosamente."
}
```
**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Mensaje enviado exitosamente",
  "data": {
    "phone": "5214426363547",
    "message": "Hola, tu reserva ha sido confirmada exitosamente.",
    "sentAt": "2025-11-10T23:45:00.000Z"
  }
}
```
**Errores posibles:**
- `400` - Falta el número de teléfono o el mensaje
- `500` - Error al enviar el mensaje (problema con WhatsApp API)

---

## 🔔 **NOTIFICACIONES**

### 18. Obtener todas las notificaciones
```http
GET /api/notifications
```

### 19. Obtener notificaciones no leídas
```http
GET /api/notifications/unread
```

### 20. Marcar notificación como leída
```http
PUT /api/notifications/:id/read
```

### 21. Obtener notificaciones por tipo
```http
GET /api/notifications?type=reservation_hotel
GET /api/notifications?type=reservation_confirmation
```

---

## 📊 **ANALYTICS Y MÉTRICAS**

### 21. Dashboard general (Resumen completo)
```http
GET /api/dashboard/summary
```
**Respuesta:**
```json
{
  "success": true,
  "summary": {
    "today": {
      "messages": 120,
      "conversations": 45,
      "reservations": 8,
      "newUsers": 12,
      "revenue": 23400
    },
    "week": {
      "messages": 850,
      "conversations": 320,
      "reservations": 56,
      "newUsers": 85,
      "revenue": 164800
    },
    "month": {
      "messages": 3200,
      "conversations": 1200,
      "reservations": 220,
      "newUsers": 340,
      "revenue": 644000
    },
    "topPackage": "enamorados",
    "topRoom": "master_suite_jacuzzi",
    "averageResponseTime": "2.5s",
    "conversionRate": 18.3
  }
}
```

### 22. Analytics detallados
```http
GET /api/analytics
```

### 23. Analytics por fecha
```http
GET /api/analytics/daily?date=2025-11-10
GET /api/analytics/range?start=2025-11-01&end=2025-11-10
```

### 24. Métricas en tiempo real
```http
GET /api/analytics/realtime
```
**Respuesta:**
```json
{
  "success": true,
  "realtime": {
    "activeUsers": 5,
    "pendingReservations": 3,
    "messagesLastHour": 45,
    "systemStatus": "healthy",
    "dbConnected": true,
    "uptime": 86400
  }
}
```

### 25. Conversión y embudo
```http
GET /api/analytics/funnel
```
**Respuesta:**
```json
{
  "success": true,
  "funnel": {
    "totalVisitors": 450,
    "startedReservation": 280,
    "completedForm": 180,
    "pendingPayment": 120,
    "confirmed": 95,
    "conversionRate": 21.1
  }
}
```

---

## 📈 **REPORTES**

### 26. Reporte de ingresos
```http
GET /api/reports/revenue?period=daily|weekly|monthly
```

### 27. Reporte de ocupación
```http
GET /api/reports/occupancy?date=2025-11-16
```

### 28. Reporte de clientes frecuentes
```http
GET /api/reports/frequent-customers
```

### 29. Reporte de paquetes más vendidos
```http
GET /api/reports/popular-packages
```

### 30. Exportar reporte (CSV/Excel)
```http
GET /api/reports/export?type=reservations&format=csv&start=2025-11-01&end=2025-11-30
```

---

## ⚙️ **SISTEMA Y CONFIGURACIÓN**

### 31. Estado del sistema
```http
GET /api/status
```
**Respuesta:**
```json
{
  "success": true,
  "status": "healthy",
  "modules": {
    "database": true,
    "aiNLP": false,
    "notifications": true,
    "analytics": true
  },
  "uptime": 86400,
  "memory": {
    "heapUsed": 45.2,
    "heapTotal": 89.5
  }
}
```

### 32. Health check
```http
GET /health
```

### 33. Logs del sistema
```http
GET /api/logs?limit=100&level=error|warning|info
```

---

## 🔍 **BÚSQUEDA Y FILTROS**

### 34. Búsqueda global
```http
GET /api/search?q=Ricardo&type=users|reservations|messages
```

### 35. Filtros avanzados de reservas
```http
GET /api/reservations/filter
```
**Query params:**
- `status` - pending_payment, confirmed, etc.
- `package` - deseo, enamorados, premium
- `room` - tipo de habitación
- `startDate` - fecha inicial
- `endDate` - fecha final
- `minAmount` - monto mínimo
- `maxAmount` - monto máximo
- `sortBy` - date, amount, status
- `order` - asc, desc
- `limit` - número de resultados
- `offset` - paginación

**Ejemplo:**
```http
GET /api/reservations/filter?status=confirmed&package=premium&sortBy=date&order=desc&limit=20
```

---

## 🔐 **AUTENTICACIÓN (Futuro)**

### 36. Login
```http
POST /api/auth/login
```

### 37. Logout
```http
POST /api/auth/logout
```

### 38. Verificar token
```http
GET /api/auth/verify
```

---

## 📱 **WHATSAPP TESTING**

### 39. Enviar mensaje de prueba
```http
POST /api/test/message
```
**Body:**
```json
{
  "phone": "2462636547",
  "message": "Hola de prueba"
}
```

### 40. Enviar flow de prueba
```http
POST /api/test/flow/:phone
```

---

## 🎯 **ENDPOINTS PRIORITARIOS PARA DASHBOARD**

### Top 10 más importantes:

1. `GET /api/dashboard/summary` - Resumen general
2. `GET /api/reservations` - Todas las reservas
3. `GET /api/reservations/stats` - Estadísticas de reservas
4. `GET /api/users/stats` - Estadísticas de usuarios
5. `GET /api/analytics/realtime` - Métricas en tiempo real
6. `GET /api/reservations?status=pending_payment` - Reservas pendientes
7. `GET /api/notifications/unread` - Notificaciones sin leer
8. `GET /api/reports/revenue` - Reporte de ingresos
9. `PUT /api/reservations/:id/status` - Confirmar reservas
10. `GET /api/users/:phone` - Ver perfil de cliente

---

## 📝 **Formato de Respuestas**

Todas las respuestas siguen este formato:

**Éxito:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Descripción del error",
  "code": "ERROR_CODE"
}
```

---

## 🚀 **Próximos Pasos**

1. ✅ Implementar endpoints faltantes en `app.js`
2. ✅ Agregar validación de datos
3. ✅ Implementar paginación
4. ✅ Agregar filtros y búsqueda
5. ⏳ Agregar autenticación (opcional)
6. ⏳ Agregar rate limiting
7. ⏳ Documentación Swagger/OpenAPI

---

**Base URL de Producción:** `https://tu-app.onrender.com`
**Base URL Local:** `http://localhost:3000`
