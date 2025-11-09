# 🚀 Guía de Despliegue - Auto Hotel Luxor Chatbot v3.0

## 📦 Características Completas Implementadas

### ✅ Módulos Core (Siempre Activos)
- Sistema de contexto conversacional
- Detección de intenciones con scoring
- Rate limiting avanzado
- Analytics en tiempo real
- Manejo de errores con reintentos
- Respuestas inteligentes
- Dashboard web

### ⚡ Módulos Avanzados (Opcionales)
- 💾 **Base de Datos MongoDB** - Persistencia de conversaciones y usuarios
- 🤖 **AI NLP con OpenAI** - Procesamiento de lenguaje natural avanzado
- 📧 **Notificaciones Email** - Alertas automáticas por correo
- 💬 **Slack Integration** - Notificaciones en Slack
- 🎨 **UX Enhancer** - Typing indicators y respuestas dinámicas
- 📊 **Lead Scoring** - Puntuación automática de leads
- 🎯 **Segmentación** - Clasificación automática de usuarios

---

## 🔧 Instalación Rápida

### 1. Clonar e Instalar

```bash
cd whatsapp-test
npm install
```

### 2. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tus credenciales
notepad .env
```

### 3. Iniciar Servidor

```bash
# Desarrollo
npm run dev

# Producción
npm start
```

---

## ⚙️ Configuración por Niveles

### 🟢 Nivel 1: Básico (Sin configuración extra)

**Requiere SOLO:**
- `VERIFY_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `FLOW_ID`

**Características disponibles:**
- ✅ Chatbot funcional
- ✅ Analytics en memoria
- ✅ Dashboard web
- ✅ Respuestas inteligentes

```bash
npm start
```

Accede al dashboard: `http://localhost:3000/dashboard`

---

### 🟡 Nivel 2: Intermedio (+Base de Datos)

**Requiere:**
- Todo lo de Nivel 1
- `MONGODB_URI`

**Nuevas características:**
- ✅ Persistencia de conversaciones
- ✅ Historial completo de usuarios
- ✅ Lead scoring
- ✅ Segmentación automática
- ✅ Analytics históricas

#### Instalación de MongoDB

**Opción A: MongoDB Local**
```bash
# Windows - Descargar e instalar desde:
# https://www.mongodb.com/try/download/community

# Linux
sudo apt-get install mongodb

# macOS
brew install mongodb-community
```

**Opción B: MongoDB Atlas (Cloud - Gratis)**
1. Ir a https://www.mongodb.com/cloud/atlas
2. Crear cuenta gratuita
3. Crear cluster (M0 gratis)
4. Obtener connection string
5. Agregar a `.env`:

```env
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/hotel-luxor
```

---

### 🔵 Nivel 3: Avanzado (+AI + Notificaciones)

**Requiere:**
- Todo lo de Nivel 2
- `OPENAI_API_KEY`
- `EMAIL_USER` y `EMAIL_PASS`
- (Opcional) `SLACK_WEBHOOK`

**Nuevas características:**
- ✅ Detección de intenciones con IA
- ✅ Corrección automática de typos
- ✅ Traducción multiidioma
- ✅ Análisis de sentimiento
- ✅ Alertas por email
- ✅ Notificaciones Slack

#### Obtener API Key de OpenAI

1. Ir a https://platform.openai.com
2. Crear cuenta
3. Ir a API Keys
4. Crear nueva key
5. Agregar a `.env`:

```env
OPENAI_API_KEY=sk-tu_api_key_aqui
```

#### Configurar Email (Gmail)

1. Habilitar verificación en 2 pasos en tu cuenta Google
2. Crear contraseña de aplicación:
   - https://myaccount.google.com/apppasswords
3. Agregar a `.env`:

```env
EMAIL_SERVICE=gmail
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_password_de_aplicacion
ADMIN_EMAIL=admin@autohoteluxor.com
```

#### Configurar Slack

1. Crear Incoming Webhook en Slack:
   - https://api.slack.com/messaging/webhooks
2. Agregar a `.env`:

```env
SLACK_WEBHOOK=https://hooks.slack.com/services/T00000000/B00000000/XXXX
```

---

## 📊 Endpoints Disponibles

### Dashboard y Status
```bash
GET  /dashboard              # Dashboard web interactivo
GET  /health                 # Health check
GET  /status                 # Estado de módulos
```

### Analytics
```bash
GET  /analytics              # Métricas completas
GET  /analytics/summary      # Resumen rápido
GET  /analytics/user/:phone  # Stats de usuario
```

### AI y NLP
```bash
POST /ai/detect-intent       # Detectar intención con IA
POST /ai/correct-typos       # Corregir typos
```

### Base de Datos
```bash
GET  /users/:phone           # Perfil de usuario
GET  /conversations/:phone   # Conversaciones
GET  /reservations/:phone    # Reservaciones
GET  /notifications          # Notificaciones
```

---

## 🧪 Testing

### Test Completo de Mejoras
```bash
npm test
# o
node test-improvements.js
```

### Ver Analytics
```bash
npm run analytics
# o
node analytics.js
```

### Test de Módulos Específicos
```bash
# Test de AI
curl -X POST http://localhost:3000/ai/detect-intent \
  -H "Content-Type: application/json" \
  -d '{"message": "quiero reservar una habitación"}'

# Test de typos
curl -X POST http://localhost:3000/ai/correct-typos \
  -H "Content-Type: application/json" \
  -d '{"message": "qiero reservar abitacion"}'

# Ver estado
curl http://localhost:3000/status
```

---

## 🐛 Troubleshooting

### Error: MongoDB no conecta

```bash
# Verificar que MongoDB esté corriendo
# Windows:
net start MongoDB

# Linux/Mac:
sudo systemctl status mongod
```

**Solución alternativa:** El bot funciona SIN MongoDB, solo perderás la persistencia.

### Error: OpenAI API

```bash
# Verificar API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

**Solución alternativa:** El bot funciona sin OpenAI, usando NLP básico.

### Error: Email no envía

- Verificar que sea contraseña de aplicación (no la contraseña normal)
- Revisar configuración de Gmail en `.env`

**Solución alternativa:** Desactiva emails, el bot funciona sin ellos.

---

## 📈 Monitoreo en Producción

### Dashboard

Accede al dashboard en: `http://tu-servidor.com/dashboard`

Actualización automática cada 30 segundos.

### Logs

```bash
# Ver logs en tiempo real
tail -f logs/chatbot.log

# Con PM2
pm2 logs hotel-chatbot
```

### Alertas Automáticas

El sistema envía alertas cuando:
- ✅ Tasa de errores > 5%
- ✅ Usuarios simultáneos > 50
- ✅ Lead de alto valor (score > 70)
- ✅ Mensaje no comprendido (confianza < 30%)

---

## 🔒 Seguridad en Producción

### Variables de Entorno

**NUNCA** subas el archivo `.env` a Git. Está en `.gitignore`.

### HTTPS

Para producción, usa HTTPS:

```bash
# Con Nginx
sudo certbot --nginx -d tu-dominio.com

# O configurar proxy reverso
```

### Rate Limiting

Ya implementado:
- 15 mensajes por minuto por usuario
- 2 segundos mínimo entre mensajes

---

## 🚀 Despliegue a Producción

### Opción 1: PM2 (Recomendado)

```bash
# Instalar PM2
npm install -g pm2

# Iniciar
pm2 start app.js --name hotel-chatbot

# Configurar auto-restart
pm2 startup
pm2 save

# Monitorear
pm2 monit
pm2 logs hotel-chatbot
```

### Opción 2: Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t hotel-chatbot .
docker run -p 3000:3000 --env-file .env hotel-chatbot
```

### Opción 3: Servicios Cloud

**Heroku:**
```bash
heroku create hotel-luxor-bot
git push heroku main
heroku config:set VERIFY_TOKEN=xxx
```

**Railway/Render:**
1. Conectar repositorio
2. Configurar variables de entorno
3. Deploy automático

---

## 📊 Optimización de Rendimiento

### Cache

El sistema ya implementa cache para:
- Detecciones de IA (1 hora)
- Analytics en tiempo real
- Rate limiting

### Base de Datos

```javascript
// Crear índices automáticamente
await database.connect();
```

### Memoria

```bash
# Verificar uso de memoria
curl http://localhost:3000/status
```

---

## 🔄 Actualizaciones

### Actualizar dependencias

```bash
npm update
npm audit fix
```

### Migrar base de datos

```bash
# Backup
mongodump --uri="mongodb://localhost:27017/hotel-luxor"

# Restore
mongorestore dump/
```

---

## 📞 Soporte y Mantenimiento

### Backups Automáticos

Configura backups diarios de MongoDB:

```bash
# Cron job (Linux)
0 2 * * * mongodump --uri="$MONGODB_URI" --out=/backups/$(date +\%Y\%m\%d)
```

### Logs Rotation

```bash
# Con PM2
pm2 install pm2-logrotate
```

### Health Checks

```bash
# Ping cada 5 minutos
*/5 * * * * curl http://localhost:3000/health
```

---

## 🎯 Próximos Pasos

1. ✅ Instalar dependencias: `npm install`
2. ✅ Configurar `.env` mínimo (Nivel 1)
3. ✅ Probar localmente: `npm start`
4. ✅ Acceder a dashboard: `http://localhost:3000/dashboard`
5. ⚡ (Opcional) Configurar MongoDB (Nivel 2)
6. 🚀 (Opcional) Configurar OpenAI (Nivel 3)
7. 🌐 Desplegar a producción

---

## 📚 Documentación Adicional

- **README.md** - Visión general
- **MEJORAS.md** - Detalles técnicos de mejoras v2.1
- **QUICK_START.md** - Inicio rápido
- **test-improvements.js** - Suite de tests

---

## ✨ Resumen de Capacidades

| Característica | Sin Config | +MongoDB | +OpenAI | +Notif |
|---------------|:----------:|:--------:|:-------:|:------:|
| Chatbot básico | ✅ | ✅ | ✅ | ✅ |
| Analytics | ✅ | ✅ | ✅ | ✅ |
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Persistencia | ❌ | ✅ | ✅ | ✅ |
| Lead Scoring | ❌ | ✅ | ✅ | ✅ |
| IA Avanzada | ❌ | ❌ | ✅ | ✅ |
| Corrección typos | ❌ | ❌ | ✅ | ✅ |
| Alertas Email | ❌ | ❌ | ❌ | ✅ |
| Slack | ❌ | ❌ | ❌ | ✅ |

---

**🎉 ¡Todo listo! Tu chatbot avanzado está preparado para desplegarse.**

Para soporte: contacta al equipo de Auto Hotel Luxor
