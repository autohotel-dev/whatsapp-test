# 🚀 Instrucciones de Despliegue a Render

## ✅ Cambios Realizados

### 1. **Fix Critical: sendTextMessage en app.js**
- ❌ Antes: `hotelChatbot.sendTextMessage()` (no existía)
- ✅ Ahora: Importado `sendTextMessage` directamente desde `message-sender.js`

### 2. **Fix MongoDB: Lead Score Conflict**
- ❌ Antes: Conflicto al usar `$inc`, `$max`, `$min` simultáneamente
- ✅ Ahora: Lógica secuencial que obtiene, calcula y actualiza

### 3. **Nuevo: Generador de Llaves RSA**
- Creado `certs/whatsapp-flow-private.pem` (nueva llave privada)
- Creado `certs/whatsapp-flow-public.pem` (certificado público)

---

## 📋 Pasos para Desplegar

### Paso 1: Commit y Push

```bash
# Ver cambios
git status

# Agregar todos los cambios
git add .

# Commit
git commit -m "Fix: Corrección crítica de sendTextMessage y leadScore, nuevas llaves RSA para flows"

# Push a GitHub
git push origin main
```

### Paso 2: Configurar en Render

**⚠️ IMPORTANTE: Debes configurar la PRIVATE_KEY en Render:**

1. Ve a: https://dashboard.render.com
2. Selecciona tu servicio: `whatsapp-test`
3. Ve a: **Environment**
4. Busca o agrega: `PRIVATE_KEY`
5. Valor (copia EXACTAMENTE):

```
-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDyH5Gwvpiro+mI
NEOsjvSSs1SBvh/ww9SKWpNT5kHK5ngTQZru7HCXJo5f4DyGnZ9rIA6aKutnoQUP
3MBZIcB504OcK0v9vyfPGWaWtxBGFk9i6EJ3hI0QwBSH4Wu5rMkZGnrhJur5cVrA
rWZvBx+CDdTQx5D84gwCMBmKCkZHEyjyZevzNi9y+FF2WFsHIbrB16wpwgLrfGWP
2z4qVgsamfARyDyzlsCDYINs1aQvX2Zcm8+6K2jE30hitbkjqsI9rp43KFs7oeiJ
Mi84FQ7cy3i1gjy7ZLDJyvEXBg0IrcrUGQkN9qd9gGLRYIbShSxztryUWj8pyx/c
jljmXfANAgMBAAECggEAC4NJRe52K3kujlGv4xlkE0KwMsAj3CqvpUmDxmJFQBzf
2kiNEa3P97v3WqM6tYryrOEYGKgQS/vp1fSA9+wFLzXJxQgBA8aOYchbKrD3NuHy
MemJ2Y2FuKVthH2JRgmrgURTUffsBeLoNg+4tnBQBPrb4vaOVBv6hrMbT8dHyrLM
muxHS2nGiucdV6ulkQ2fi9JRbfn1Oh78qCya2FcR80eLasaN1/9XC0eravRVukXJ
ds8kDq6JFob6gNtb5cEx90ztkQs0jePHdenNF+xgoG4+IMmNoGtZgL17wClwJQxP
4c/XPeUspBGHvuAJu1QAKl9QmEq+MnkUnoRwLW9huQKBgQD7MNLcgLKmr9zs0qGm
q1X48fhTJGGR35D27yg7eSe5GS8T7XiTKOoiD9TBWep/Dz9FPIKkTGGzK82Zqf5O
q8vdSsanXOsI5iIjlJzgPGYAJ7VN+YsV+otORI59xTq74HomB+MfD0AInI8evs6D
w82+hgf1FiVTDfnIYhn/VmQP1QKBgQD2wk2F5FOvezE5kckLqulNaPMazyq9ZgVJ
XAVYAmnqttid4wucmU1smNMRkHwQMF6VxUCXksn0RfLFY0/ylNytvpCRS/63Goyz
IjIxqF2UwDqIth4uAVwCgA/Svs/0L1Tw1oCK/Vgf5VgNBO5B9E6GPBi249Gvm6QR
yVrYyDkzWQKBgED6Q0GJBS27RmH4pppPrgCkz0Dqo1axx3UpLnYcBBuMmTIFdvBS
YCaJg9a0ZMWTcyF84qqPm6JWjWvXnpJJPIY1Bqhaj+4QYfpkQiR7W0NlAjB2gfUg
h5Kqh1WfhG7/RXm7BpSNRFo17Yvdfdx19S34y+wpW2RdtCSSw/jaJy41AoGBALUd
4tbew0nvCy9tQPquZPWrjZxk6MMBqemxgD6b7vAXayFgL/quTzThazLeMSGUzyfx
EzrtxAvmd43IGjs8ZkmksOnktL3i39jvxZXLNXzkJ1KHEdnEp6syIesWoP5i616m
oszhrRgkNx+/Ob3xOt2uKJm82ACkJaXkfCjXtZxpAoGBAJF9nVo/0vHScY64A/wz
FGsScQEUW8XOr0u9IOlVqlad9RDZsn0t6Rs9SSJQWKjlErOOirDXSYytuwY3wTmO
hAvk5tgHUzMVCpHpnN37rTGQ6Y7alTp8/ZtYnBrYSW2LG41d5urS5SHvg8yzxAT0
WdHB7IdLARLzM49mvZkznQmr
-----END PRIVATE KEY-----
```

6. **Guarda** → Render redeployeará automáticamente

### Paso 3: Configurar Certificado Público en Meta

1. Ve a: https://business.facebook.com/wa/manage/flows/
2. Selecciona tu Flow
3. Ve a: **Settings → Endpoint**
4. Busca: **"Public Key"** o **"Upload Public Key"**
5. Sube el archivo: `certs/whatsapp-flow-public.pem`
6. **Guarda y Publica** el Flow

---

## 🔍 Verificación

### Después del Deploy en Render (espera 2-3 minutos):

**1. Revisa los logs en Render:**

Deberías ver:
```
✅ Servidor iniciado
✓ Private Key: ✓ Configurada
✅ Conectado a MongoDB
```

**2. Prueba "reservar" en WhatsApp:**

Deberías recibir:
```
🎉 ¡Excelente! Te ayudo a reservar tu habitación.

Vamos a necesitar:
1. 🏨 Tipo de habitación
2. 📅 Fecha de reservación
3. 👥 Número de personas
4. 📝 Tus datos de contacto

*Presiona el botón "Comenzar Reserva" para continuar*
```

**3. Abre el Flow y verifica los dropdowns:**

Los dropdowns deberían mostrar:
- ✅ 5 tipos de habitaciones
- ✅ 10 fechas disponibles
- ✅ 11 horarios
- ✅ 10 opciones de personas

---

## ❌ Si Algo Sale Mal

### Error: "sendTextMessage is not a function"
→ El código viejo está en Render. Asegúrate de hacer push correctamente.

### Error: "oaep decoding error"
→ La PRIVATE_KEY en Render no coincide con el certificado público en Meta.
→ Vuelve a configurar ambas.

### Dropdowns vacíos
→ El certificado público en Meta no se subió correctamente.
→ Sube `certs/whatsapp-flow-public.pem` nuevamente.

### Error de MongoDB leadScore
→ Ya está corregido en el código. Solo necesitas deployear.

---

## 📞 Contacto

Si tienes problemas, revisa:
1. Logs en Render Dashboard
2. Estado del servicio en Render
3. Configuración del Flow en Meta

---

**¡Listo para desplegar! 🚀**
