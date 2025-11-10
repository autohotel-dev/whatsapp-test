# 💳 Configuración del Sistema de Pagos

## 📋 Pasos para Configurar

### 1️⃣ Subir tu Imagen de Datos Bancarios

**Opción A: Usar Imgur (Recomendado - Gratis)**
1. Ve a: https://imgur.com/upload
2. Sube tu imagen con datos bancarios
3. Click derecho en la imagen → "Copiar dirección de imagen"
4. Obtendrás una URL como: `https://i.imgur.com/ABC123.jpg`

**Opción B: Usar Cloudinary**
1. Crea cuenta en: https://cloudinary.com
2. Sube tu imagen
3. Copia la URL pública

**Opción C: Hosting propio**
- Si tienes un sitio web, sube la imagen ahí
- Usa la URL completa: `https://tudominio.com/datos-bancarios.jpg`

---

### 2️⃣ Configurar en Render

1. Ve a tu servicio en Render
2. **Environment** → **Add Environment Variable**
3. Agrega:
   ```
   Nombre: PAYMENT_IMAGE_URL
   Valor: https://i.imgur.com/TU_IMAGEN.jpg
   ```
4. **Save Changes**

---

### 3️⃣ Configurar Datos Bancarios (Fallback)

Si la imagen no carga, el sistema envía los datos por texto.

Edita el archivo `flow.js` líneas 419-426:

```javascript
const datosBancariosTexto = `💳 *DATOS BANCARIOS:*

🏦 Banco: BBVA Bancomer
👤 Titular: Auto Hotel Luxor S.A. de C.V.
💳 CLABE: 012345678901234567
📱 Tarjeta: 4152 3136 1234 5678

_O paga con transferencia/depósito_`;
```

**Reemplaza con tus datos reales.**

---

## ⏰ Tiempo Límite de Pago

Por defecto: **6 horas**

Para cambiar a 5 horas, edita `flow.js` línea 441:
```javascript
// Cambiar de 6 a 5
paymentDeadline.setHours(paymentDeadline.getHours() + 5);
```

---

## 📊 Estados de Reserva

El sistema maneja 5 estados:

1. **pending_payment** - Esperando pago (máximo 6 horas)
2. **payment_received** - Comprobante recibido, pendiente verificación manual
3. **confirmed** - Pago verificado, reserva confirmada
4. **cancelled** - Reserva cancelada (por tiempo o por cliente)
5. **completed** - Servicio completado

---

## 🔄 Flujo Completo de Pago

```
1. Cliente completa Flow de reserva
   ↓
2. Se crea reserva con status: pending_payment
   ↓
3. Cliente recibe:
   - Confirmación de pre-reserva
   - Instrucciones de pago
   - Imagen con datos bancarios
   - Instrucciones para enviar comprobante
   ↓
4. Cliente envía imagen del comprobante
   ↓
5. Sistema detecta imagen automáticamente
   ↓
6. Status cambia a: payment_received
   ↓
7. Se notifica al hotel para verificar
   ↓
8. Hotel verifica pago (manual o automático futuro)
   ↓
9. Status cambia a: confirmed
   ↓
10. Cliente recibe confirmación final
```

---

## ⚠️ Cancelación Automática

**Sistema en desarrollo** - Por ahora es manual.

**Futuro:** Tarea programada (cron job) que:
- Revisa reservas con `pending_payment`
- Si `paymentDeadline` < ahora
- Cambia status a `cancelled`
- Notifica al cliente

---

## 📱 Detección de Comprobante

El sistema detecta automáticamente cuando el cliente envía una **imagen** después de hacer una reserva.

Ver: `app.js` - Handler de mensajes con imágenes

---

## 🧪 Probar el Sistema

1. Haz una reserva completa
2. Deberías recibir:
   - ✅ Pre-reserva registrada
   - ✅ Instrucciones de pago
   - ✅ Imagen con datos bancarios
   - ✅ Instrucciones para enviar comprobante
3. Envía una imagen cualquiera
4. Verifica que se guarde en la BD

---

## 📝 Verificar en MongoDB

```javascript
// Ver reservas pendientes de pago
db.reservations.find({ status: "pending_payment" })

// Ver comprobantes recibidos
db.reservations.find({ 
  status: "payment_received",
  paymentProof: { $exists: true }
})
```

---

**✅ Con esto tu sistema de pagos estará completamente configurado.**
