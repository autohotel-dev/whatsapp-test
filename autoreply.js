const { sendFlowMessage, sendTextMessage, sendImageMessage } = require('./message-sender.js');
const responses = require('./responses.js');

class HotelChatbot {
  constructor() {
    this.responses = responses;
    this.userLastMessage = new Map();
    this.MIN_TIME_BETWEEN_MESSAGES = 2000; // 2 segundos mínimo entre mensajes
  }

  async handleMessage(userPhone, messageText) {
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
    const intent = this.detectIntent(cleanMessage).toLowerCase();

    try {
      // ✅ SWITCH CASE CORREGIDO
      switch (intent) {
        case 'reservar':
          console.log(`🎯 Activando flow de reserva para ${userPhone}`);
          // Primero enviar mensaje de confirmación
          await sendTextMessage(userPhone, this.responses.reservar.message);
          // Luego enviar el flow
          await sendFlowMessage(userPhone);
          break;

        case 'habitaciones':
          await this.sendInfoResponse(userPhone, this.responses.habitaciones.message);
          break;

        case 'precios':
          await this.sendInfoResponse(userPhone, this.responses.precios.message);
          break;

        case 'paquetes':
          await this.sendInfoResponse(userPhone, this.responses.paquetes.message);
          break;

        case 'fotos':
          await this.sendInfoResponse(userPhone, this.responses.fotos.message);
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
        'fotos de habitaciones decoradas', 'fotos de ejemplos decorados', 'fotos de decoradas', 'ejemplos decoradas',
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

  async sendInfoResponse(userPhone, type) {
    const response = this.responses[type];

    try {
      if (response.image) {
        // Enviar imagen + texto
        await sendImageMessage(userPhone, response.image, response.message);
      } else {
        // Enviar solo texto
        await sendTextMessage(userPhone, response.message);
      }
    } catch (error) {
      console.error(`❌ Error enviando ${type}:`, error);
      // Fallback: enviar solo texto si la imagen falla
      await sendTextMessage(userPhone, response.message);
    }
  }

  // ✅ MÉTODO PARA ENVIAR MENSAJES DE TEXTO (para usar desde app.js)
  async sendTextMessage(userPhone, message) {
    try {
      await sendTextMessage(userPhone, message);
    } catch (error) {
      console.error('❌ Error enviando mensaje de texto:', error);
      throw error;
    }
  }
}

module.exports = new HotelChatbot();