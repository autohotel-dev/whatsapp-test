# 🚀 Guía de Inicio Rápido

## ⚡ Probar las Mejoras (Sin WhatsApp)

```bash
# Ejecutar suite de tests
node test-improvements.js
```

Esto te mostrará todas las nuevas funcionalidades en acción.

## 📊 Ver Analytics

### Opción 1: Desde Node.js
```bash
node analytics.js
```

### Opción 2: Desde el servidor (cuando esté corriendo)
```bash
# Resumen rápido
curl http://localhost:3000/analytics/summary

# Analytics completas
curl http://localhost:3000/analytics

# Stats de usuario específico
curl http://localhost:3000/analytics/user/+5214421234567
```

## 🏃 Iniciar el Servidor

```bash
# Instalación
npm install

# Iniciar
npm start
```

Verás algo como esto:
```
🏨 ==========================================
🏨 AUTO HOTEL LUXOR CHATBOT v2.1
🏨 ==========================================
✅ Servidor iniciado en puerto: 3000

📍 ENDPOINTS PRINCIPALES:
  • POST /webhook - Webhook de WhatsApp
  • GET  /webhook - Verificación de webhook
  • GET  /health - Health check
  • POST /test-flow/:phone - Test manual de flow

📊 ENDPOINTS DE ANALYTICS:
  • GET  /analytics - Métricas completas
  • GET  /analytics/summary - Resumen rápido
  • GET  /analytics/user/:phone - Stats de usuario

✨ NUEVAS CARACTERÍSTICAS:
  ✓ Sistema de contexto conversacional
  ✓ Detección de intenciones con scoring
  ✓ Rate limiting avanzado anti-spam
  ✓ Analytics y métricas en tiempo real
  ✓ Manejo de errores con reintentos
  ✓ Respuestas inteligentes para baja confianza
🏨 ==========================================
```

## 🧪 Tests Rápidos

### 1. Health Check
```bash
curl http://localhost:3000/health
```

### 2. Ver Métricas
```bash
curl http://localhost:3000/analytics/summary
```

### 3. Probar Flow Manual (opcional)
```bash
curl -X POST http://localhost:3000/test-flow/+5214421234567
```

## 📈 Monitorear en Tiempo Real

Abre múltiples terminales:

**Terminal 1:** Servidor
```bash
npm start
```

**Terminal 2:** Ver logs de analytics
```bash
node analytics.js
```

**Terminal 3:** Watch metrics cada 5 segundos
```bash
# PowerShell
while($true) { 
  curl http://localhost:3000/analytics/summary
  Start-Sleep -Seconds 5 
  Clear-Host
}
```

## 🎯 Principales Mejoras

### Antes vs Ahora

| Característica | Antes | Ahora |
|---------------|-------|-------|
| Memoria conversacional | ❌ | ✅ 30 min |
| Scoring de intenciones | ❌ | ✅ 0-100% |
| Rate limiting | ⚠️ 2s | ✅ 15/min |
| Analytics | ❌ | ✅ Tiempo real |
| Reintentos | ❌ | ✅ Hasta 2 |
| FAQ | ❌ | ✅ 5+ |

## 🔍 Debugging

### Ver estado interno del chatbot
```javascript
// En Node.js REPL o script
const chatbot = require('./autoreply');

// Ver contextos activos
console.log('Usuarios activos:', chatbot.userContext.size);

// Ver analytics
console.log(chatbot.getAnalytics());

// Ver stats de usuario
console.log(chatbot.getUserStats('+5214421234567'));
```

### Ver logs detallados
Los logs ahora muestran:
- 🎯 Intención detectada con % de confianza
- ⏰ Rate limiting cuando se activa
- 📊 Tracking de cada interacción
- ❌ Errores con detalles

## 💡 Tips

1. **Monitorea la tasa de errores**: Si supera el 5%, revisa los logs
2. **Revisa las top intenciones**: Optimiza las respuestas más usadas
3. **Analiza usuarios con muchas interacciones**: Pueden indicar confusión
4. **Rate limiting activándose mucho**: Posible bot malicioso

## 📚 Documentación Completa

- **README.md** - Documentación general
- **MEJORAS.md** - Detalles de todas las mejoras
- **test-improvements.js** - Suite de tests

## 🆘 Troubleshooting

### El servidor no inicia
```bash
# Verificar puerto
netstat -ano | findstr :3000

# Cambiar puerto
$env:PORT=3001; npm start
```

### Analytics no muestra datos
```bash
# Es normal si no ha habido interacciones
# Ejecuta el test para generar datos:
node test-improvements.js
```

### Error de módulos
```bash
# Reinstalar dependencias
Remove-Item -Recurse -Force node_modules
npm install
```

## ✅ Checklist de Verificación

- [ ] `npm install` ejecutado
- [ ] Variables de entorno configuradas (.env)
- [ ] Servidor inicia sin errores
- [ ] `/health` responde OK
- [ ] `/analytics/summary` responde
- [ ] `node test-improvements.js` pasa todos los tests
- [ ] Logs muestran intenciones con confianza

## 🎉 ¡Todo Listo!

Tu chatbot ahora tiene:
- 🧠 Inteligencia mejorada
- 📊 Analytics completas
- 🛡️ Protección anti-spam
- 🔧 Manejo robusto de errores
- ⚡ Respuestas más rápidas e inteligentes

**¡Disfruta de las mejoras!** 🚀
