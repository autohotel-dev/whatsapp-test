const { sendFlowMessage, sendTextMessage, sendImageMessage, sendButtonMessage } = require('./message-sender');
const responses = require('./responses.js');

class HotelChatbot {
  constructor() {
    this.responses = responses;
    this.userLastMessage = new Map();
    this.MIN_TIME_BETWEEN_MESSAGES = 2000; // 2 segundos mínimo entre mensajes
  }

  async handleMessage(userPhone, messageText, buttonId = null) {
    try {
      // If it's a button click, handle it directly
      if (buttonId) {
        console.log(`🔄 Procesando botón: ${buttonId} de ${userPhone}`);
        return this.handleButtonClick(userPhone, buttonId);
      }

      const cleanMessage = messageText.toLowerCase().trim();

      // ✅ VERIFICAR RATE LIMITING
      if (!this.checkRateLimit(userPhone)) {
        console.log(`⏰ Rate limiting para ${userPhone} - Mensaje muy rápido`);
        return;
      }

      console.log(`💬 Mensaje de ${userPhone}: "${cleanMessage}"`);

      // Detectar intención del usuario
      const intent = this.detectIntent(cleanMessage);

      // ✅ SWITCH CASE CORREGIDO
      switch (intent) {
        case 'menu':
          return this.sendInfoResponse(userPhone, 'menu');
        case 'default':
          return this.sendInfoResponse(userPhone, 'default');
        case 'reservar':
          console.log(`🎯 Activando flow de reserva para ${userPhone}`);
          await sendTextMessage(userPhone, this.responses.reservar.message);
          await sendFlowMessage(userPhone);
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
          await sendTextMessage(userPhone, this.responses.reservar.message);
          await sendFlowMessage(userPhone);
          break;
        default:
          // ✅ EVITAR RESPONDER A MENSAJES MUY CORTOS O VACÍOS
          if (this.shouldRespondToDefault(cleanMessage)) {
            await sendTextMessage(userPhone, this.responses.default.message);
          } else {
            console.log(`🔇 Ignorando mensaje corto/vacío: "${cleanMessage}"`);
          }
          break;
      }
    } catch (error) {
      console.error('❌ Error enviando respuesta:', error);
      await this.sendErrorResponse(userPhone, error);
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

  // ✅ VERIFICAR RATE LIMITING
  checkRateLimit(userPhone) {
    const now = Date.now();
    const lastMessageTime = this.userLastMessage.get(userPhone);

    if (lastMessageTime && (now - lastMessageTime) < this.MIN_TIME_BETWEEN_MESSAGES) {
      return false;
    }

    this.userLastMessage.set(userPhone, now);
    return true;
  }

  // ✅ MANEJADOR DE ERRORES
  async sendErrorResponse(userPhone, error) {
    try {
      await sendTextMessage(userPhone, '⚠️ Lo siento, hubo un error procesando tu mensaje. Por favor intenta de nuevo.');
    } catch (fallbackError) {
      console.error('❌ Error incluso enviando mensaje de fallback:', fallbackError);
    }
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

  detectIntent(message) {
    const patterns = {
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

    // Buscar coincidencia exacta primero
    for (const [intent, keywords] of Object.entries(patterns)) {
      if (keywords.includes(message)) {
        return intent;
      }
    }

    // Buscar coincidencias parciales
    for (const [intent, keywords] of Object.entries(patterns)) {
      for (const keyword of keywords) {
        if (message.includes(keyword) || keyword.includes(message)) {
          return intent;
        }
      }
    }

    // Comandos específicos
    if (['menu', 'menú', 'opciones', 'ayuda', 'help'].includes(message)) {
      return 'menu';
    }

    return 'default';
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
        const buttonMessage = response.text || '**Selecciona una opción**';
        await sendButtonMessage(userPhone, buttonMessage, response.buttons);
      }

      console.log(`✅ Respuesta ${responseKey} enviada completamente`);

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