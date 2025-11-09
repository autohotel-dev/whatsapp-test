const { sendFlowMessage, sendTextMessage, sendImageMessage } = require('./message-sender.js');

class HotelChatbot {
  constructor() {
    this.responses = {
      // Respuestas para información general
      habitaciones: {
        message: `🏨 **Tipos de Habitaciones Disponibles:**

• 🛏 **Master Suite Junior** 
  - Habitación de torre (Hotel)

• 🛌 **Master Suite** 
  - Habitación sencilla

• 🛁 **Master Suite con Jaccuzzi** 
  - Habitación sencilla con jaccuzzi 

• ♨️ **Master Suite con Jaccuzzi y Sauna** 
  - Habitación con jaccuzzi y sauna

• 🏊 **Master Suite con Alberca** 
  - Habitación con alberca

¿Te gustaría conocer los precios o hacer una reserva?`,
        image: 'https://autohoteluxor.com/src/images/galeria/Master%20suite%20%20Sauna%20y%20Jacuzzi.jpg'
      },

      precios: {
        message: `💰 **Tarifas por horas y/o noche:**

• Master Suite Junior: $520 MXN para 2 👥 personas 
  - 🕒 Hora extra $110 MXN 
  - 🕒 4 Horas extra $270 MXN 
  - 👤 Persona extra $180 MXN 
  - 👥 Máximo 3 personas

• Master Suite: $600 MXN para 2 👥 personas 
  - 🕒 Hora extra $120 MXN 
  - 🕒 4 Horas extra $300 MXN 
  - 👤 Persona extra $200 MXN 
  - 👥 Máximo 3 personas

• Master Suite con Jaccuzzi: $900 MXN para 2 👥 personas 
  - 🕒 Hora extra $210 MXN 
  - 🕒 4 Horas extra $440 MXN 
  - 👤 Persona extra $300 MXN 
  - 👥 Máximo 4 personas

• Master Suite con Jaccuzzi y Sauna: $1240 MXN para 2 👥 personas 
  - 🕒 Hora extra $260 MXN 
  - 🕒 4 Horas extra $600 MXN 
  - 👤 Persona extra $300 MXN 
  - 👥 Máximo 4 personas

• Master Suite con Alberca: $1990 MXN para 2 👥 personas 
  - 🕒 Hora extra $260 MXN 
  - 🕒 4 Horas extra $1000 MXN 
  - 👤 Persona extra $380 MXN 
  - 👥 Máximo 10 personas

*Incluye internet gratis, amenidades, servicio de habitación y servicio de comida*`,
        image: 'https://autohoteluxor.com/src/images/galeria/Master%20suite%20Sauna%20y%20Jacuzzi.jpg'
      },

      servicios: {
        message: `⭐ **Servicios del Hotel:**

• 🏊 Alberca
• 🍽️ Servicio de comida y bebida (Servicio de habitación)
• ♨️ Sauna
• 🛁 Jaccuzzi
• 📶 WiFi gratis
• 🅿️ Estacionamiento (Cochera)
• 🚕 Servicio de taxis
• 🧼 Amenidades

Puedes escribir "menu" para ver nuevamente las opciones.`
      },

      horarios: {
        message: `🕒 **Horarios:**

• Domingo a partir de las 06:00 am a Viernes a las 06:00 am, estancia de 12 Horas.

• Viernes a partir de las 06:00 am a Domingo a las 06:00 am, estancia de 8 Horas.

• Servicio de desayunos: 8:00 - 12:00

• Servicio de comida de Lunes a Sabado de 14:00 - 20:00 y Domingo de 14:00 - 19:00

• Servicio de snacks de Lunes a Domingo de 22:00 - 4:00

Puedes escribir "menu" para ver nuevamente las opciones.`
      },

      ubicacion: {
        message: `📍 **Ubicación:**

🏨 Auto Hotel Luxor
🌊 Av. Prol. Boulevard Bernardo Quintana, 1000B
🏖️ Col. Ind. Benito Juárez, CP 76120, Querétaro, México

📞 Teléfono: +52 442 210 3292
🌐 Website: https://autohoteluxor.com

¿Necesitas indicaciones para llegar?
Da click en el botón "Ver en Google Maps"`,
        buttons: [
          {
            type: 'url',
            title: '📍 Ver en Google Maps',
            url: 'https://maps.app.goo.gl/9xUHkBxyATFhE5Fr6'
          }
        ]

      },

      // Respuesta para reservas
      reservar: {
        message: `🎉 ¡Excelente! Te ayudo a reservar tu habitación.

Vamos a necesitar:
1. 🏨 Tipo de habitación
2. 📅 Fecha de reservación  
3. 👥 Número de personas
4. 📝 Tus datos de contacto

*Presiona el botón "Reservar Ahora" para comenzar*`
      },

      servicios_compania: {
        message: `💫 **Servicios Exclusivos**

Para información sobre nuestros servicios premium y experiencias personalizadas, te invitamos a:

📞 **Contactar directamente a recepción: 442 210 3292 o al 0 estando en su habitación**
📍 **Solicitar información en nuestro mostrador**

Nuestro equipo te atenderá de manera discreta y profesional para proporcionarte todos los detalles sobre las opciones disponibles.

*Atención confidencial y personalizada*`
      },

      // Respuesta por defecto
      default: {
        message: `🔺 ¡Bienvenido a Auto Hotel Luxor!

Puedo ayudarte con:

• 🏨 *"habitaciones"* - Ver tipos de habitaciones
• 💰 *"precios"* - Conocer precios  
• ⭐ *"servicios"* - Servicios del hotel
• 🕒 *"horarios"* - Horarios de operación
• 📍 *"ubicación"* - Nuestra dirección y contacto
• 🎉 *"reservar"* - Hacer una reserva de habitación decorada
• 💫 *"exclusivos"* - Experiencias personalizadas

  *📌 Política de Reservas:*
  • 🎀 *Habitaciones Decoradas*: Se aceptan reservas previas con 2 dias de anticipación
  • 🚪 *Habitaciones Estándar*: Se asignan por orden de llegada, sujetas a disponibilidad

¿En qué te puedo ayudar? 👇`
      }
    };

    // ✅ RATE LIMITING - Evitar spam
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
    const intent = this.detectIntent(cleanMessage);

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
          await this.sendInfoResponse(userPhone, 'habitaciones');
          break;

        case 'precios':
          await this.sendInfoResponse(userPhone, 'precios');
          break;

        case 'servicios':
          await sendTextMessage(userPhone, this.responses.servicios.message);
          break;

        case 'exclusivos':
          await sendTextMessage(userPhone, this.responses.servicios_compania.message);
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
        'compañía', 'compania', 'acompañamiento', 'acompanamiento',
        'servicios exclusivos', 'servicios premium', 'servicios especiales',
        'experiencias personalizadas', 'servicios personalizados',

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