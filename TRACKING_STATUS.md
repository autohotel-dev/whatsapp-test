# 📊 Estado del Tracking en MongoDB

## ✅ Lo que YA se está guardando:

### 1. **Mensajes** (`messages` collection)
- ✅ Mensajes entrantes del usuario
- ✅ Mensajes salientes del bot
- ✅ Intención detectada
- ✅ Confianza de la intención
- ✅ Tipo de mensaje (text, image, interactive)
- ✅ Timestamp automático

**Ubicación:** `src/modules/chatbot/autoreply.js` líneas 78-88 y 546-554

### 2. **Usuarios** (`users` collection)
- ✅ Teléfono del usuario
- ✅ Nombre (si se captura)
- ✅ Última interacción
- ✅ Total de conversaciones
- ✅ Total de mensajes
- ✅ Total de reservas (se actualiza automáticamente)
- ✅ Lead score
- ✅ Intereses detectados
- ✅ Segmentación (new, engaged, frequent, vip, inactive)

**Ubicación:** `src/modules/chatbot/autoreply.js` línea 87

### 3. **Reservas** (`reservations` collection) ✅ RECIÉN AGREGADO
- ✅ Teléfono del usuario
- ✅ Tipo de paquete (deseo, enamorados, premium)
- ✅ Tipo de habitación
- ✅ Fecha y hora de check-in
- ✅ Número de huéspedes
- ✅ Nombre del cliente
- ✅ Email del cliente
- ✅ Comentarios especiales
- ✅ Estado (confirmed, cancelled, completed)
- ✅ Precio total
- ✅ Código de confirmación
- ✅ Timestamps (createdAt, updatedAt)

**Ubicación:** `src/modules/chatbot/flow.js` función `guardarReservaEnBD()`

---

## ⚠️ Lo que FALTA guardar:

### 4. **Conversaciones** (`conversations` collection)
- ❌ Inicio de conversación
- ❌ Fin de conversación
- ❌ Duración total
- ❌ Número de mensajes en la conversación
- ❌ Intenciones detectadas en la conversación
- ❌ Satisfacción del usuario

**Solución:** Agregar tracking al inicio y fin de cada conversación

### 5. **Notificaciones** (`notifications` collection)
- ❌ Notificaciones enviadas al hotel
- ❌ Confirmaciones enviadas al cliente
- ❌ Estado de entrega
- ❌ Timestamp

**Solución:** Guardar cada notificación enviada

### 6. **Analytics Diarios** (`dailyanalytics` collection)
- ❌ Total de mensajes por día
- ❌ Total de conversaciones por día
- ❌ Total de reservas por día
- ❌ Intenciones más comunes
- ❌ Horarios pico

**Solución:** Actualizar analytics al final de cada interacción

### 7. **Errores y Logs** (opcional)
- ❌ Errores del sistema
- ❌ Intentos fallidos
- ❌ Problemas de conexión

---

## 🎯 Prioridades para implementar:

1. **ALTA:** Guardar notificaciones ✅ (vamos a implementar)
2. **MEDIA:** Guardar conversaciones completas
3. **MEDIA:** Analytics diarios automáticos
4. **BAJA:** Sistema de logs de errores

---

## 📝 Próximos pasos:

1. Agregar tracking de notificaciones en `flow.js`
2. Agregar tracking de conversaciones en `autoreply.js`
3. Agregar actualización de analytics diarios
4. Crear script de limpieza de datos antiguos (opcional)
