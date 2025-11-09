const { sendFlowMessage, sendTextMessage, sendImageMessage, sendButtonMessage } = require('./message-sender');
const responses = require('./responses.js');

class HotelChatbot {
  constructor() {
    this.responses = responses;
    this.userLastMessage = new Map();
    this.MIN_TIME_BETWEEN_MESSAGES = 2000; // 2 segundos mínimo entre mensajes
  }

  async handleMessage(userPhone, messageText, buttonId = null) {
    // If it's a button click, handle it directly
    if (buttonId) {
      console.log(`🔄 Procesando botón: ${buttonId} de ${userPhone}`);
      switch (buttonId) {
        case 'ver_fotos':
          return this.sendInfoResponse(userPhone, 'fotos');
        case 'reservar_ahora':
          await sendTextMessage(userPhone, this.responses.reservar.message);
          return sendFlowMessage(userPhone);
        case 'menu':
          return this.sendInfoResponse(userPhone, 'menu');
        case 'precios':
          return this.sendInfoResponse(userPhone, 'precios');
        case 'habitaciones':
          return this.sendInfoResponse(userPhone, 'habitaciones');
        case 'paquetes':
          return this.sendInfoResponse(userPhone, 'paquetes');
        case 'ubicacion':
          return this.sendInfoResponse(userPhone, 'ubicacion');
        case 'exclusivos':
          return this.sendInfoResponse(userPhone, 'exclusivos');
        case 'servicios':
          return this.sendInfoResponse(userPhone, 'servicios');
        case 'horarios':
          return this.sendInfoResponse(userPhone, 'horarios');
        default:
          console.log(`❌ Botón no reconocido: ${buttonId}`);
          return sendTextMessage(userPhone, 'Opción no reconocida. Por favor intenta de nuevo.');
      }
    }

    const cleanMessage = messageText.toLowerCase().trim();

    // ✅ VERIFICAR RATE LIMITING
    const now = Date.now();
    const lastMessageTime = this.userLastMessage.get(userPhone);

    if (lastMessageTime && (now - lastMessageTime) < this.MIN_TIME_BETWEEN_MESSAGES) {
      console.log(`⏰ Rate limiting para ${userPhone} - Mensaje muy rápido`);
      return; // Ignorar mensajes muy rápidos
    }

    // ✅ ACTUALIZAR ÚLTIMO MENSAJE
    this.userLastMessage.set(userPhone, now);

    console.log(`💬 Mensaje de ${userPhone}: "${cleanMessage}"`);

    // Detectar intención del usuario
    const intent = this.detectIntent(cleanMessage);

    try {
      // ✅ SWITCH CASE CORREGIDO
      switch (intent) {
        case 'menu':
          return this.sendInfoResponse(userPhone, 'menu');
        case 'default':
          return this.sendInfoResponse(userPhone, 'default');
        case 'reservar':
          console.log(`🎯 Activando flow de reserva para ${userPhone}`);
          // Primero enviar mensaje de confirmación
          await sendTextMessage(userPhone, this.responses.reservar.message);
          // Luego enviar el flow
          await sendFlowMessage(userPhone);
          break;

        case 'habitaciones':
          await this.sendInfoResponse(userPhone, 'habitaciones');
          break;

        case 'precios':
          await this.sendInfoResponse(userPhone, 'precios');
          break;

        case 'paquetes':
          await this.sendInfoResponse(userPhone, 'paquetes');
          break;

        case 'fotos':
          await this.sendInfoResponse(userPhone, 'fotos');
          break;

        case 'servicios':
          await sendTextMessage(userPhone, this.responses.servicios.message);
          break;

        case 'exclusivos':
          await sendTextMessage(userPhone, this.responses.exclusivos.message);
          break;

        case 'horarios':
          await sendTextMessage(userPhone, this.responses.horarios.message);
          break;

        case 'ubicacion':
          await sendTextMessage(userPhone, this.responses.ubicacion.message);
          break;

        case 'ver_fotos':
          // Manejar clic en el botón "Ver fotos"
          await this.sendInfoResponse(userPhone, 'fotos');
          break;

        case 'reservar_ahora':
          // Manejar clic en el botón "Reservar"
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
      // Enviar mensaje de error al usuario
      try {
        await sendTextMessage(userPhone, '⚠️ Lo siento, hubo un error procesando tu mensaje. Por favor intenta de nuevo.');
      } catch (fallbackError) {
        console.error('❌ Error incluso enviando mensaje de fallback:', fallbackError);
      }
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
        'paquetes', 'paquete', 'paquetes decorados', 'promociones decoradas', 'decoradas', 'decorados',
        'precio de paquetes', 'paquetes', 'paquetes disponibles',
      ],
      fotos: [
        'fotos de habitaciones decoradas', 'fotos de ejemplos decorados', 'fotos de decoradas',
        'ejemplos decoradas', 'ver_fotos', 'ver fotos', 'fotos'
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
        'telefono', 'ubicacion', 'direcciones', 'donde esta', 'mapa'
      ],
      exclusivos: [
        // Básicos y discretos
        'compañía', 'exclusivos', 'exclusivo', 'compania', 'acompañamiento', 'acompanamiento',
        'servicios exclusivos', 'servicios premium', 'servicios especiales',
        'experiencias personalizadas', 'servicios personalizados', 'exclusivo', 'exclusivos',

        // Términos comunes en el ambiente
        'escorts', 'escort', 'escort service',
        'damas de compañía', 'damas de compania',
        'acompañantes', 'acompanantes',

        // Servicios específicos
        'compañía nocturna', 'compania nocturna',
        'servicios nocturnos', 'servicios de noche',
        'compañía por horas', 'compania por horas',

        // Términos en inglés
        'call girls', 'call girl', 'companion',
        'adult services', 'adult entertainment',

        // Términos de entretenimiento
        'entretenimiento', 'entretenimiento adulto',
        'servicios para adultos', 'servicios discretos',

        // Para eventos
        'compañía para eventos', 'compania para eventos',
        'acompañamiento para cenas', 'acompanamiento para cenas',

        // Términos locales comunes
        'servicio privado', 'atención personal',
        'servicios confidenciales', 'servicios reservados',

        // Palabras relacionadas
        'masajes', 'spa', 'relajación', 'compania femenina',
        'compania masculina', 'modelos', 'edecanes'
      ]
    };

    for (const [intent, keywords] of Object.entries(patterns)) {
      if (keywords.some(keyword => message.includes(keyword))) {
        return intent;
      }
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
        await this.delay(1000); // Esperar 1 segundo
      }
      else if (response.images && response.images.length > 0) {
        console.log(`🖼️ Enviando ${response.images.length} imágenes`);
        for (let i = 0; i < response.images.length; i++) {
          console.log(`📸 Imagen ${i + 1}: ${response.images[i]}`);
          await sendImageMessage(userPhone, response.images[i], '');
          if (i < response.images.length - 1) {
            await this.delay(800); // Esperar entre imágenes
          }
        }
        await this.delay(500); // Esperar después de todas las imágenes
      }

      // ✅ PASO 2: MENSAJE DE TEXTO (si existe)
      if (response.message) {
        console.log(`💬 Enviando mensaje de texto`);
        await sendTextMessage(userPhone, response.message);
        await this.delay(500); // Esperar después del texto
      }

      // ✅ PASO 3: BOTONES (si existen)
      if (response.buttons && response.buttons.length > 0) {
        console.log(`🔘 Enviando ${response.buttons.length} botones`);
        const buttonMessage = response.text || '';
        await sendButtonMessage(userPhone, buttonMessage, response.buttons);
      }

      console.log(`✅ Respuesta ${responseKey} enviada completamente`);

    } catch (error) {
      console.error(`❌ Error enviando ${responseKey}:`, error);

      // Fallback elegante
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

  // El método sendTextMessage se ha eliminado porque ya existe una función global con el mismo nombre
  // que está siendo importada al inicio del archivo
}

module.exports = new HotelChatbot();