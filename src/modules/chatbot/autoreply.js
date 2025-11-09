const { sendTextMessage, sendImageMessage, sendButtonMessage } = require('../../services/message-sender');
const sendFlowMessage = require('../../services/send-flow-message');
const responses = require('./responses.js');
const { database } = require('../database/database.js');

class HotelChatbot {
  constructor() {
    this.responses = responses;
    this.userLastMessage = new Map();
    this.MIN_TIME_BETWEEN_MESSAGES = 2000; // 2 segundos mínimo entre mensajes
    
    // ✨ NUEVO: Sistema de contexto conversacional
    this.userContext = new Map(); // Guarda el contexto de cada usuario
    this.userSessionTimeout = 30 * 60 * 1000; // 30 minutos
    
    // ✨ NUEVO: Analytics y métricas
    this.analytics = {
      totalMessages: 0,
      intentCounts: {},
      errorCount: 0,
      userInteractions: new Map()
    };
    
    // ✨ NUEVO: Rate limiting avanzado
    this.userMessageCount = new Map(); // Contador de mensajes por usuario
    this.MAX_MESSAGES_PER_MINUTE = 15;
    
    // ✨ NUEVO: FAQ común
    this.commonFAQ = {
      'cuanto cuesta': 'precios',
      'esta abierto': 'horarios',
      'donde estan': 'ubicacion',
      'que incluye': 'servicios',
      'como reservo': 'reservar'
    };
  }

  async handleMessage(userPhone, messageText, buttonId = null) {
    try {
      // ✨ ANALYTICS: Incrementar contador
      this.analytics.totalMessages++;
      
      // If it's a button click, handle it directly
      if (buttonId) {
        console.log(`🔄 Procesando botón: ${buttonId} de ${userPhone}`);
        this.trackUserInteraction(userPhone, 'button_click', buttonId);
        return this.handleButtonClick(userPhone, buttonId);
      }

      const cleanMessage = messageText.toLowerCase().trim();

      // ✅ VERIFICAR RATE LIMITING AVANZADO
      if (!this.checkAdvancedRateLimit(userPhone)) {
        console.log(`⏰ Rate limiting para ${userPhone} - Demasiados mensajes`);
        this.trackUserInteraction(userPhone, 'rate_limited');
        return;
      }

      console.log(`💬 Mensaje de ${userPhone}: "${cleanMessage}"`);

      // ✨ NUEVO: Actualizar contexto de usuario
      this.updateUserContext(userPhone, cleanMessage);

      // ✨ MEJORADO: Detectar intención con scoring
      const intentResult = this.detectIntentWithScore(cleanMessage);
      const intent = intentResult.intent;
      const confidence = intentResult.confidence;
      
      console.log(`🎯 Intención detectada: ${intent} (confianza: ${(confidence * 100).toFixed(1)}%)`);
      
      // ✨ ANALYTICS: Tracking de intenciones
      this.analytics.intentCounts[intent] = (this.analytics.intentCounts[intent] || 0) + 1;
      this.trackUserInteraction(userPhone, 'message', intent);

      // ✨ NUEVO: Guardar en base de datos (si está conectada)
      if (database.isConnected()) {
        // Guardar mensaje del usuario
        await database.saveMessage(userPhone, {
          text: cleanMessage,
          intent: intent,
          confidence: confidence,
          direction: 'incoming',
          messageType: 'text'
        });

        // Actualizar o crear perfil de usuario
        await database.createOrUpdateUser(userPhone);
      }

      // ✅ SWITCH CASE CORREGIDO
      switch (intent) {
        case 'menu':
          return this.sendInfoResponse(userPhone, 'menu');
        case 'default':
          return this.sendInfoResponse(userPhone, 'default');
        case 'reservar':
          console.log(`🎯 Activando flow de reserva para ${userPhone}`);
          try {
            await sendTextMessage(userPhone, this.responses.reservar.message);
            await this.delay(1000); // Pequeño delay antes del flow
            await sendFlowMessage(userPhone);
            console.log(`✅ Flow de reserva enviado a ${userPhone}`);
          } catch (flowError) {
            console.error(`❌ Error enviando flow a ${userPhone}:`, flowError.message);
            await sendTextMessage(userPhone, '⚠️ Lo siento, hubo un problema al cargar el formulario. Por favor intenta: "quiero reservar una habitación"');
          }
          break;
        case 'habitaciones':
        case 'precios':
        case 'paquetes':
        case 'fotos':
        case 'servicios':
        case 'exclusivos':
        case 'horarios':
        case 'ubicacion':
          await this.sendInfoResponse(userPhone, intent);
          break;
        case 'ver_fotos':
          await this.sendInfoResponse(userPhone, 'fotos');
          break;
        case 'reservar_ahora':
          try {
            await sendTextMessage(userPhone, this.responses.reservar.message);
            await this.delay(1000);
            await sendFlowMessage(userPhone);
            console.log(`✅ Flow de reserva enviado a ${userPhone}`);
          } catch (flowError) {
            console.error(`❌ Error enviando flow:`, flowError.message);
            await sendTextMessage(userPhone, '⚠️ Error al cargar el formulario. Contacta recepción: 442 210 3292');
          }
          break;
        default:
          // ✨ MEJORADO: Verificar confianza antes de responder
          if (confidence < 0.3) {
            // Baja confianza - ofrecer ayuda
            console.log(`❓ Baja confianza (${(confidence * 100).toFixed(1)}%) para: "${cleanMessage}"`);
            await this.sendLowConfidenceResponse(userPhone, cleanMessage);
          } else if (this.shouldRespondToDefault(cleanMessage)) {
            await sendTextMessage(userPhone, this.responses.default.message);
          } else {
            console.log(`🔇 Ignorando mensaje corto/vacío: "${cleanMessage}"`);
          }
          break;
      }
    } catch (error) {
      console.error('❌ Error enviando respuesta:', error);
      this.analytics.errorCount++;
      await this.sendErrorResponseWithRetry(userPhone, error);
    }
  }

  // ✅ MANEJADOR DE CLICS EN BOTONES
  async handleButtonClick(userPhone, buttonId) {
    const buttonActions = {
      'ver_fotos': () => this.sendInfoResponse(userPhone, 'fotos'),
      'reservar_ahora': async () => {
        await sendTextMessage(userPhone, this.responses.reservar.message);
        return sendFlowMessage(userPhone);
      },
      'menu': () => this.sendInfoResponse(userPhone, 'menu'),
      'precios': () => this.sendInfoResponse(userPhone, 'precios'),
      'habitaciones': () => this.sendInfoResponse(userPhone, 'habitaciones'),
      'paquetes': () => this.sendInfoResponse(userPhone, 'paquetes'),
      'ubicacion': () => this.sendInfoResponse(userPhone, 'ubicacion'),
      'exclusivos': () => this.sendInfoResponse(userPhone, 'exclusivos'),
      'servicios': () => this.sendInfoResponse(userPhone, 'servicios'),
      'horarios': () => this.sendInfoResponse(userPhone, 'horarios')
    };

    const action = buttonActions[buttonId];
    if (action) {
      return await action();
    } else {
      console.log(`❌ Botón no reconocido: ${buttonId}`);
      return sendTextMessage(userPhone, 'Opción no reconocida. Por favor intenta de nuevo.');
    }
  }

  // ✅ VERIFICAR RATE LIMITING (Mantener compatibilidad)
  checkRateLimit(userPhone) {
    const now = Date.now();
    const lastMessageTime = this.userLastMessage.get(userPhone);

    if (lastMessageTime && (now - lastMessageTime) < this.MIN_TIME_BETWEEN_MESSAGES) {
      return false;
    }

    this.userLastMessage.set(userPhone, now);
    return true;
  }

  // ✨ NUEVO: Rate limiting avanzado anti-spam
  checkAdvancedRateLimit(userPhone) {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Obtener o inicializar contador de mensajes
    let messageLog = this.userMessageCount.get(userPhone) || [];
    
    // Filtrar mensajes del último minuto
    messageLog = messageLog.filter(timestamp => timestamp > oneMinuteAgo);
    
    // Verificar si excede el límite
    if (messageLog.length >= this.MAX_MESSAGES_PER_MINUTE) {
      console.log(`🚫 Usuario ${userPhone} excedió límite: ${messageLog.length} mensajes/minuto`);
      return false;
    }
    
    // Agregar timestamp actual
    messageLog.push(now);
    this.userMessageCount.set(userPhone, messageLog);
    
    // También verificar rate limit básico
    return this.checkRateLimit(userPhone);
  }

  // ✅ MANEJADOR DE ERRORES (mantener para compatibilidad)
  async sendErrorResponse(userPhone, error) {
    try {
      await sendTextMessage(userPhone, '⚠️ Lo siento, hubo un error procesando tu mensaje. Por favor intenta de nuevo.');
    } catch (fallbackError) {
      console.error('❌ Error incluso enviando mensaje de fallback:', fallbackError);
    }
  }

  // ✨ NUEVO: Manejador de errores con reintentos
  async sendErrorResponseWithRetry(userPhone, error, retries = 2) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`🔄 Reintento ${attempt}/${retries} para ${userPhone}`);
          await this.delay(1000 * attempt); // Backoff exponencial
        }
        
        await sendTextMessage(
          userPhone, 
          '⚠️ Lo siento, hubo un error procesando tu mensaje. Por favor intenta de nuevo o escribe "menu" para ver las opciones.'
        );
        return; // Éxito
      } catch (fallbackError) {
        console.error(`❌ Error en intento ${attempt + 1}:`, fallbackError.message);
        if (attempt === retries) {
          console.error('💥 Todos los reintentos fallaron');
        }
      }
    }
  }

  // ✨ NUEVO: Respuesta para baja confianza
  async sendLowConfidenceResponse(userPhone, originalMessage) {
    const helpMessage = `🤔 No estoy seguro de entender "${originalMessage}".

¿Quizás buscas información sobre?
• 🏨 Habitaciones
• 💰 Precios
• 📅 Reservar
• 📍 Ubicación

Escribe la palabra clave o "menu" para ver todas las opciones.`;
    
    await sendTextMessage(userPhone, helpMessage);
  }

  // ✨ NUEVO: Actualizar contexto de usuario
  updateUserContext(userPhone, message) {
    const now = Date.now();
    let context = this.userContext.get(userPhone) || {
      messages: [],
      intents: [],
      firstInteraction: now,
      lastInteraction: now
    };

    // Agregar mensaje al historial (mantener últimos 10)
    context.messages.push({ text: message, timestamp: now });
    if (context.messages.length > 10) {
      context.messages.shift();
    }

    context.lastInteraction = now;
    this.userContext.set(userPhone, context);

    // Limpiar contextos antiguos (más de 30 minutos)
    this.cleanOldContexts();
  }

  // ✨ NUEVO: Limpiar contextos viejos
  cleanOldContexts() {
    const now = Date.now();
    for (const [phone, context] of this.userContext.entries()) {
      if (now - context.lastInteraction > this.userSessionTimeout) {
        this.userContext.delete(phone);
        console.log(`🧹 Limpiando contexto antiguo de ${phone}`);
      }
    }
  }

  // ✨ NUEVO: Tracking de interacciones para analytics
  trackUserInteraction(userPhone, type, data = null) {
    const interaction = {
      type,
      data,
      timestamp: Date.now()
    };

    let userInteractions = this.analytics.userInteractions.get(userPhone) || [];
    userInteractions.push(interaction);
    
    // Mantener últimas 50 interacciones por usuario
    if (userInteractions.length > 50) {
      userInteractions.shift();
    }
    
    this.analytics.userInteractions.set(userPhone, userInteractions);
  }

  // ✨ NUEVO: Obtener analytics
  getAnalytics() {
    return {
      totalMessages: this.analytics.totalMessages,
      intentCounts: this.analytics.intentCounts,
      errorCount: this.analytics.errorCount,
      activeUsers: this.userContext.size,
      totalUsers: this.analytics.userInteractions.size,
      topIntents: Object.entries(this.analytics.intentCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
      errorRate: this.analytics.totalMessages > 0 
        ? (this.analytics.errorCount / this.analytics.totalMessages * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  // ✨ NUEVO: Obtener estadísticas de usuario específico
  getUserStats(userPhone) {
    const context = this.userContext.get(userPhone);
    const interactions = this.analytics.userInteractions.get(userPhone) || [];
    
    if (!context && interactions.length === 0) {
      return null;
    }

    return {
      messageCount: context?.messages.length || 0,
      interactionCount: interactions.length,
      firstSeen: context?.firstInteraction || null,
      lastSeen: context?.lastInteraction || null,
      recentIntents: interactions
        .filter(i => i.type === 'message')
        .slice(-5)
        .map(i => i.data)
    };
  }
  // ✅ DETECTAR SI DEBEMOS RESPONDER A MENSAJE POR DEFECTO
  shouldRespondToDefault(message) {
    if (!message || message.trim().length === 0) return false;

    // Ignorar mensajes muy cortos que podrían ser typos
    if (message.length < 2) return false;

    // Ignorar mensajes que son solo emojis o símbolos
    const onlySymbols = /^[^\w\s]+$/.test(message);
    if (onlySymbols) return false;

    // Comandos comunes que SÍ respondemos
    const systemCommands = [
      '/start', '/help', '/menu', 'start', 'help', 'menu',
      'hola', 'buenos dias', 'buenas tardes', 'buenas noches',
      'hello', 'hi', 'ayuda'
    ];
    if (systemCommands.includes(message)) return true;

    return true;
  }

  // ✨ NUEVO: Detectar intención con scoring de confianza
  detectIntentWithScore(message) {
    const patterns = this.getIntentPatterns();
    let bestMatch = { intent: 'default', confidence: 0, matches: [] };

    // Verificar FAQ común primero
    for (const [question, intent] of Object.entries(this.commonFAQ)) {
      if (message.includes(question)) {
        return { intent, confidence: 0.9, source: 'faq' };
      }
    }

    // Buscar coincidencia exacta (alta confianza)
    for (const [intent, keywords] of Object.entries(patterns)) {
      if (keywords.includes(message)) {
        return { intent, confidence: 1.0, source: 'exact' };
      }
    }

    // Buscar coincidencias parciales con scoring
    for (const [intent, keywords] of Object.entries(patterns)) {
      let matchCount = 0;
      let matchedKeywords = [];
      
      for (const keyword of keywords) {
        if (message.includes(keyword)) {
          matchCount++;
          matchedKeywords.push(keyword);
        } else if (keyword.includes(message) && message.length >= 3) {
          matchCount += 0.5;
          matchedKeywords.push(keyword);
        }
      }
      
      // Calcular confianza basada en coincidencias
      const confidence = Math.min(matchCount / keywords.length, 1.0);
      
      if (confidence > bestMatch.confidence) {
        bestMatch = {
          intent,
          confidence,
          matches: matchedKeywords,
          source: 'partial'
        };
      }
    }

    // Comandos específicos del menú
    const menuCommands = ['menu', 'menú', 'opciones', 'ayuda', 'help'];
    if (menuCommands.includes(message)) {
      return { intent: 'menu', confidence: 1.0, source: 'command' };
    }

    // Si la mejor coincidencia es muy baja, retornar default
    if (bestMatch.confidence < 0.2) {
      return { intent: 'default', confidence: 0.1, source: 'fallback' };
    }

    return bestMatch;
  }

  // ✅ MANTENER: Método original para compatibilidad
  detectIntent(message) {
    return this.detectIntentWithScore(message).intent;
  }

  // ✨ NUEVO: Obtener patrones de intenciones (extraído para reutilización)
  getIntentPatterns() {
    return {
      reservar: [
        'reservar', 'reserva', 'reservación', 'reservacion', 'hacer reserva',
        'quiero reservar', 'reservar ahora', 'agendar', 'booking', 'quiero una habitación',
        'necesito una habitación', 'disponibilidad', 'reservar habitación',
        'reservar cuarto', 'hacer reservación'
      ],
      habitaciones: [
        'habitaciones', 'habitación', 'habitacion', 'cuartos', 'cuarto',
        'tipos de habitación', 'que habitaciones tienen', 'opciones de habitación',
        'tipos de cuarto', 'habitaciones disponibles', 'suites'
      ],
      precios: [
        'precios', 'precio', 'tarifas', 'tarifa', 'costos', 'costo',
        'cuanto cuesta', 'precio por noche', 'cuales son los precios',
        'cuanto vale', 'valor'
      ],
      paquetes: [
        'paquetes', 'paquete', 'paquetes decorados', 'promociones decoradas', 
        'decoradas', 'decorados', 'precio de paquetes', 'paquetes disponibles'
      ],
      fotos: [
        'fotos de habitaciones decoradas', 'fotos de ejemplos decorados', 
        'fotos de decoradas', 'ejemplos decoradas', 'ver_fotos', 'ver fotos', 'fotos'
      ],
      servicios: [
        'servicios', 'servicio', 'amenidades', 'que servicios tienen',
        'facilidades', 'que incluye', 'servicios del hotel', 'comodidades'
      ],
      horarios: [
        'horarios', 'horario', 'check in', 'check out', 'check-in', 'check-out',
        'a que hora es el check in', 'que hora cierran', 'hora', 'esta abierto',
        'abre', 'cierra', 'tiempos'
      ],
      ubicacion: [
        'ubicación', 'ubicacion', 'dirección', 'direccion', 'donde están',
        'localización', 'localizacion', 'como llegar', 'contacto', 'teléfono',
        'telefono', 'mapa', 'donde esta', 'direcciones'
      ],
      exclusivos: [
        'compañía', 'exclusivos', 'exclusivo', 'compania', 'acompañamiento', 
        'acompanamiento', 'servicios exclusivos', 'servicios premium', 
        'servicios especiales', 'experiencias personalizadas', 'servicios personalizados'
      ]
    };
  }

  async sendInfoResponse(userPhone, responseKey) {
    const response = this.responses[responseKey];
    if (!response) {
      console.error(`No se encontró respuesta para la clave: ${responseKey}`);
      return sendTextMessage(userPhone, '⚠️ Error: información no disponible.');
    }

    try {
      console.log(`📤 Enviando respuesta para: ${responseKey}`);

      // ✅ PASO 1: IMÁGENES (si existen)
      if (response.image) {
        console.log(`🖼️ Enviando imagen individual: ${response.image}`);
        await sendImageMessage(userPhone, response.image, '');
        await this.delay(1000);
      } else if (response.images && response.images.length > 0) {
        console.log(`🖼️ Enviando ${response.images.length} imágenes`);
        for (let i = 0; i < response.images.length; i++) {
          console.log(`📸 Imagen ${i + 1}: ${response.images[i]}`);
          await sendImageMessage(userPhone, response.images[i], '');
          if (i < response.images.length - 1) {
            await this.delay(800);
          }
        }
        await this.delay(500);
      }

      // ✅ PASO 2: MENSAJE DE TEXTO (si existe)
      if (response.message) {
        console.log(`💬 Enviando mensaje de texto`);
        await sendTextMessage(userPhone, response.message);
        await this.delay(500);
      }

      // ✅ PASO 3: BOTONES (si existen) - SIEMPRE SE EVALÚAN
      if (response.buttons && response.buttons.length > 0) {
        console.log(`🔘 Enviando ${response.buttons.length} botones`);
        // Si hay response.text, usarlo. Si no y ya se envió un mensaje, usar texto por defecto.
        // Si no hay response.text pero no se envió mensaje, usar response.message
        let buttonMessage;
        if (response.text) {
          buttonMessage = response.text;
        } else if (response.message) {
          // Si ya se envió el mensaje como texto separado, no repetirlo en los botones
          buttonMessage = '**Selecciona una opción**';
        } else {
          buttonMessage = '**Selecciona una opción**';
        }
        await sendButtonMessage(userPhone, buttonMessage, response.buttons);
      }

      console.log(`✅ Respuesta ${responseKey} enviada completamente`);

      // ✨ NUEVO: Guardar respuesta del bot en BD (si está conectada)
      if (database.isConnected()) {
        await database.saveMessage(userPhone, {
          text: response.message || `Respuesta: ${responseKey}`,
          intent: responseKey,
          confidence: 1.0,
          direction: 'outgoing',
          messageType: response.buttons ? 'button' : (response.image || response.images) ? 'image' : 'text'
        });
      }

    } catch (error) {
      console.error(`❌ Error enviando ${responseKey}:`, error);
      await this.sendFallbackResponse(userPhone, responseKey, error);
    }
  }

  // ✅ FUNCIÓN AUXILIAR PARA DELAY
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ✅ FALLBACK EN CASO DE ERROR
  async sendFallbackResponse(userPhone, responseKey, error) {
    try {
      const fallbackMessages = {
        'fotos': '📸 Aquí tienes nuestras fotos: [las imágenes no se pudieron cargar]',
        'habitaciones': '🏨 Información de habitaciones: [error temporal]',
        'precios': '💰 Nuestros precios: [no disponible temporalmente]',
        'default': '⚠️ Lo siento, hubo un error. Por favor intenta de nuevo.'
      };

      const fallbackMessage = fallbackMessages[responseKey] || fallbackMessages['default'];
      await sendTextMessage(userPhone, fallbackMessage);

    } catch (fallbackError) {
      console.error('💥 Error incluso en fallback:', fallbackError);
    }
  }
}

module.exports = new HotelChatbot();