# ☁️ Configuración de Cloudinary para Comprobantes de Pago

## 📋 Descripción

Este sistema integra **Cloudinary** para almacenar los comprobantes de pago que los clientes envían por WhatsApp. Las imágenes se descargan automáticamente de WhatsApp y se suben a Cloudinary, guardando la URL en la base de datos MongoDB.

---

## 🚀 Configuración Inicial

### 1. Crear Cuenta en Cloudinary

1. Ve a [cloudinary.com](https://cloudinary.com/)
2. Crea una cuenta gratuita (incluye 25 GB de almacenamiento)
3. Verifica tu correo electrónico

### 2. Obtener Credenciales

Una vez dentro de tu dashboard de Cloudinary:

1. En la página principal verás tus **Account Details**
2. Copia los siguientes valores:
   - **Cloud Name** (ejemplo: `dxy1234abc`)
   - **API Key** (ejemplo: `123456789012345`)
   - **API Secret** (ejemplo: `abcdefghijklmnopqrstuvwxyz`)

### 3. Configurar Variables de Entorno

Agrega estas variables a tu archivo `.env`:

```bash
# ============================================
# CLOUDINARY CREDENTIALS
# ============================================
CLOUDINARY_CLOUD_NAME=tu_cloud_name_aqui
CLOUDINARY_API_KEY=tu_api_key_aqui
CLOUDINARY_API_SECRET=tu_api_secret_aqui

# ============================================
# WHATSAPP CREDENTIALS (NECESARIAS)
# ============================================
WHATSAPP_ACCESS_TOKEN=tu_access_token_permanente_aqui
WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id_aqui
```

> ⚠️ **IMPORTANTE**: Necesitas tanto las credenciales de Cloudinary como las de WhatsApp para que funcione correctamente.

---

## 📂 Estructura de Archivos en Cloudinary

Los comprobantes se organizan automáticamente:

```
Cloudinary/
└── payment-receipts/
    ├── LXR62759012_1699000000.jpg
    ├── LXR62759013_1699000001.jpg
    └── LXR62759014_1699000002.jpg
```

**Formato de nombres:**
```
{CODIGO_CONFIRMACION}_{TIMESTAMP}.jpg
```

Ejemplo: `LXR62759012_1699562400000.jpg`

---

## 🔄 Flujo de Funcionamiento

### Proceso Automático

1. **Cliente envía imagen** por WhatsApp
2. **Sistema detecta** que hay una reserva con `status: 'pending_payment'`
3. **Descarga la imagen** desde WhatsApp Cloud API usando el Media ID
4. **Sube la imagen a Cloudinary** con optimización automática
5. **Guarda la URL** en MongoDB:
   ```javascript
   {
     paymentProof: "https://res.cloudinary.com/tu-cloud/image/upload/v123.../payment-receipts/LXR62759012_1699000000.jpg",
     status: "payment_received",
     paidAt: "2025-11-10T23:30:00.000Z"
   }
   ```
6. **Notifica** al cliente y al hotel

### Código Relevante

```@/c:/Users/hackm/OneDrive/Documentos/Desarrollos Backend/whatsapp-test/app.js#220:247
// 📤 SUBIR COMPROBANTE A CLOUDINARY
const uploadResult = await cloudinaryUploader.uploadPaymentReceipt(
  imageId,
  reservaPendiente.confirmationCode
);

if (uploadResult.success) {
  console.log('✅ Comprobante subido a Cloudinary:', uploadResult.url);
  
  // Actualizar reserva con URL de Cloudinary
  reservaPendiente.status = 'payment_received';
  reservaPendiente.paymentProof = uploadResult.url;
  reservaPendiente.paidAt = new Date();
  await reservaPendiente.save();
} else {
  // Fallback: guardar referencia de WhatsApp si Cloudinary falla
  const imageUrl = `whatsapp://media/${imageId}`;
  reservaPendiente.status = 'payment_received';
  reservaPendiente.paymentProof = imageUrl;
  reservaPendiente.paidAt = new Date();
  await reservaPendiente.save();
}
```

---

## 📊 Información Almacenada

### En MongoDB

```javascript
{
  "_id": "674xxx",
  "confirmationCode": "LXR62759012",
  "userPhone": "5214426363547",
  "customerName": "Ricardo Minor",
  "status": "payment_received",
  "paymentProof": "https://res.cloudinary.com/tu-cloud/image/upload/v1699562400/payment-receipts/LXR62759012_1699000000.jpg",
  "totalAmount": 2900,
  "paidAt": "2025-11-10T23:30:00.000Z",
  "paymentDeadline": "2025-11-11T06:00:00.000Z",
  "createdAt": "2025-11-10T18:00:00.000Z"
}
```

### En Cloudinary

Los metadatos guardados incluyen:
- **URL segura (HTTPS)**
- **Public ID**: `payment-receipts/LXR62759012_1699000000`
- **Formato**: JPG (auto-optimizado)
- **Dimensiones**: Ancho y alto en píxeles
- **Tamaño**: Bytes del archivo
- **Tags**: `['comprobante', 'pago', 'whatsapp']`

---

## 🌐 Acceso a las Imágenes

### URLs de Cloudinary

Las imágenes son accesibles públicamente vía HTTPS:

```
https://res.cloudinary.com/{CLOUD_NAME}/image/upload/v{VERSION}/payment-receipts/{FILENAME}.jpg
```

**Ejemplo real:**
```
https://res.cloudinary.com/dxy1234abc/image/upload/v1699562400/payment-receipts/LXR62759012_1699000000.jpg
```

### Transformaciones Automáticas

Cloudinary optimiza automáticamente:
- ✅ Calidad de imagen: `auto:good`
- ✅ Formato: `auto` (WebP cuando sea compatible)
- ✅ Compresión inteligente
- ✅ CDN global para carga rápida

### Obtener URL desde el Código

```javascript
// Desde una reserva
const reserva = await Reservation.findById(id);
const urlComprobante = reserva.paymentProof;

// Mostrar en HTML
<img src="${urlComprobante}" alt="Comprobante de pago" />

// O en WhatsApp
await sendImageMessage(userPhone, urlComprobante, 'Tu comprobante de pago');
```

---

## 🛠️ API del Servicio

### CloudinaryUploader

El servicio expone los siguientes métodos:

#### 1. Subir Comprobante de Pago

```javascript
const cloudinaryUploader = require('./src/services/cloudinary-uploader');

const result = await cloudinaryUploader.uploadPaymentReceipt(
  mediaId,              // ID de la imagen en WhatsApp
  confirmationCode      // Código de la reserva
);

// Resultado exitoso
{
  success: true,
  url: "https://res.cloudinary.com/.../LXR62759012_1699000000.jpg",
  publicId: "payment-receipts/LXR62759012_1699000000",
  format: "jpg",
  width: 1920,
  height: 1080,
  bytes: 245678,
  uploadedAt: Date,
  mediaId: "1234567890"
}

// Resultado fallido
{
  success: false,
  error: "Mensaje de error",
  mediaId: "1234567890"
}
```

#### 2. Eliminar Comprobante

```javascript
await cloudinaryUploader.deleteReceipt('payment-receipts/LXR62759012_1699000000');
```

#### 3. Listar Comprobantes

```javascript
const receipts = await cloudinaryUploader.listReceipts(50); // Máximo 50 resultados
```

#### 4. Obtener Información de Archivo

```javascript
const info = await cloudinaryUploader.getResourceInfo('payment-receipts/LXR62759012_1699000000');
```

#### 5. Verificar Configuración

```javascript
const isConfigured = cloudinaryUploader.isConfigured();
// true si las credenciales están configuradas
```

---

## 🔒 Seguridad y Mejores Prácticas

### Variables de Entorno

✅ **NUNCA** versiones las credenciales en Git
```gitignore
# .gitignore
.env
.env.local
.env.production
```

✅ Usa variables de entorno en producción (Render, Heroku, etc.)

### Acceso a las Imágenes

Las imágenes en Cloudinary son **públicas por defecto**, pero:

- ✅ Las URLs son difíciles de adivinar (incluyen timestamps)
- ✅ Solo se comparten con el cliente y el hotel
- ✅ Cloudinary ofrece opciones de privacidad adicionales:
  - **Signed URLs** (URLs firmadas con expiración)
  - **Authenticated images** (requieren autenticación)
  - **Access control** (por IP, referrer, etc.)

### Privacidad Avanzada (Opcional)

Para hacer las imágenes privadas:

```javascript
// En cloudinary-uploader.js
const cloudinaryResult = await this.uploadToCloudinary(imageBuffer, fileName, {
  folder: 'payment-receipts',
  type: 'authenticated',  // Requiere autenticación
  access_mode: 'authenticated'
});
```

---

## 📈 Límites y Pricing

### Plan Gratuito de Cloudinary

- ✅ **25 GB** de almacenamiento
- ✅ **25 GB** de ancho de banda/mes
- ✅ **25,000** transformaciones/mes
- ✅ **500,000** imágenes

**Estimación para un hotel:**
- Promedio: 200 KB por comprobante
- Capacidad: ~125,000 comprobantes
- Con 100 reservas/mes: ~20 años de almacenamiento

### Planes Pagos

Si necesitas más, Cloudinary ofrece:
- **Plus**: $89/mes (100 GB almacenamiento)
- **Advanced**: $224/mes (250 GB almacenamiento)
- **Enterprise**: Personalizado

---

## 🐛 Troubleshooting

### Error: "Cloudinary no está configurado correctamente"

**Causa**: Faltan variables de entorno

**Solución**:
```bash
# Verifica que existan en tu .env
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

### Error: "No se pudo obtener la URL del medio de WhatsApp"

**Causa**: Token de WhatsApp inválido o expirado

**Solución**:
```bash
# Verifica tu token de WhatsApp
WHATSAPP_ACCESS_TOKEN=tu_token_permanente
```

### Error: "Upload failed"

**Causa**: Límites de Cloudinary alcanzados o imagen corrupta

**Solución**:
1. Verifica tu cuota en el dashboard de Cloudinary
2. Revisa los logs para ver el error específico
3. El sistema tiene **fallback** a WhatsApp media si Cloudinary falla

### Las imágenes no se suben

**Checklist**:
1. ✅ Credenciales de Cloudinary configuradas
2. ✅ Token de WhatsApp configurado
3. ✅ MongoDB conectado
4. ✅ Reserva en estado `pending_payment`
5. ✅ La imagen es válida (JPG, PNG, etc.)

---

## 📝 Logs del Sistema

El sistema registra cada operación:

```
📤 Subiendo comprobante a Cloudinary para reserva LXR62759012...
🔗 URL del medio de WhatsApp obtenida
📥 Imagen descargada de WhatsApp
✅ Imagen subida a Cloudinary exitosamente
✅ Comprobante subido: https://res.cloudinary.com/.../LXR62759012_1699000000.jpg
✅ Reserva actualizada a payment_received
📧 Notificaciones enviadas
```

---

## 🎯 Ventajas de Cloudinary vs. Almacenamiento Local

| Característica | Cloudinary ☁️ | Local 💾 |
|----------------|---------------|----------|
| **Escalabilidad** | Ilimitada | Limitada por disco |
| **CDN Global** | ✅ Sí | ❌ No |
| **Backup automático** | ✅ Sí | ❌ Debes implementarlo |
| **Optimización** | ✅ Automática | ❌ Manual |
| **Costo inicial** | ✅ Gratis (25GB) | ✅ Gratis |
| **Mantenimiento** | ✅ Ninguno | ❌ Tú lo gestionas |
| **URLs permanentes** | ✅ Sí | ⚠️ Depende del servidor |
| **Transformaciones** | ✅ Sí (resize, crop) | ❌ No |
| **Disponibilidad** | ✅ 99.9% SLA | ⚠️ Depende de tu servidor |

---

## 🔄 Migración de Comprobantes Existentes

Si tienes comprobantes almacenados localmente y quieres migrarlos:

```javascript
// Script de migración (crear en scripts/migrate-to-cloudinary.js)
const fs = require('fs');
const cloudinaryUploader = require('../src/services/cloudinary-uploader');
const { models } = require('../src/modules/database/database');

async function migrateReceipts() {
  const reservations = await models.Reservation.find({
    paymentProof: { $regex: /^whatsapp:\/\// }
  });

  for (const reservation of reservations) {
    // Si tienes el archivo local, súbelo
    const localPath = `./uploads/${reservation.confirmationCode}.jpg`;
    
    if (fs.existsSync(localPath)) {
      const buffer = fs.readFileSync(localPath);
      const result = await cloudinaryUploader.uploadToCloudinary(
        buffer,
        `${reservation.confirmationCode}_migrated`
      );
      
      if (result.success) {
        reservation.paymentProof = result.url;
        await reservation.save();
        console.log(`✅ Migrado: ${reservation.confirmationCode}`);
      }
    }
  }
}

migrateReceipts();
```

---

## 📚 Recursos Adicionales

- [Documentación oficial de Cloudinary](https://cloudinary.com/documentation)
- [Cloudinary Node.js SDK](https://cloudinary.com/documentation/node_integration)
- [WhatsApp Cloud API - Media](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media)
- [Dashboard de Cloudinary](https://cloudinary.com/console)

---

## ✅ Checklist de Implementación

- [x] Cuenta de Cloudinary creada
- [x] Credenciales obtenidas
- [x] Variables de entorno configuradas
- [x] Servicio `cloudinary-uploader.js` creado
- [x] `app.js` actualizado con integración
- [x] MongoDB con campo `paymentProof`
- [x] Prueba de subida realizada
- [ ] Monitoreo de cuota de Cloudinary configurado
- [ ] Plan de respaldo implementado (opcional)

---

**Desarrollado para Auto Hotel Luxor** 🏨

_Integración con Cloudinary completada exitosamente_ ☁️✨
