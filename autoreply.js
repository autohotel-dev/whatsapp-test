const { sendFlowMessage, sendTextMessage, sendImageMessage } = require('./message-sender.js');

class HotelChatbot {
  constructor() {
    this.responses = {
      // Respuestas para información general
      habitaciones: {
        message: `🏨 **Tipos de Habitaciones Disponibles:**

• 🏨 **Master Suite Junior** - Habitación de torre (Hotel)
• 🛌 **Master Suite** - Habitación sencilla
• 🛁 **Master Suite con Jaccuzzi** - Habitación sencilla con jaccuzzi 
• ♨️ **Master SUite con Jaccuzzi y Sauna** - Habitación con jaccuzzi y sauna
• 🏊 **Master SUite con Alberca** - Habitación con alberca

¿Te gustaría conocer los precios o hacer una reserva?`,
        image: 'https://autohoteluxor.com/src/images/galeria/Master%20suite%20%20Sauna%20y%20Jacuzzi.jpg'
      },

      precios: {
        message: `💰 **Tarifas por horas y/o noche:**

• Master Suite Junior: $520 MXN
• Master Suite: $600 MXN  
• Master Suite con Jaccuzzi: $900 MXN
• Master SUite con Jaccuzzi y Sauna: $1240 MXN
• Master SUite con Alberca: $1990 MXN

*Incluye internet gratis, amenidades, servicio de habitación y servicio de comida*`,
        image: 'https://autohoteluxor.com/src/images/galeria/Master%20suite%20Sauna%20y%20Jacuzzi.jpg'
      },

      servicios: {
        message: `⭐ **Servicios del Hotel:**

• 🏊 Alberca
• 🍽️ Servicio de comida y bebida (Servicio de habitación)
• 🧘 Sauna
• 🏋️ Jaccuzzi
• 📶 WiFi gratis
• 🅿️ Estacionamiento (Cochera)
• 🐾 Servicio de taxis
• 👶 Amenidades

¿En qué más puedo ayudarte?`
      },

      horarios: {
        message: `🕒 **Horarios:**


• Servicio de desayunos a la carta: 8:00 - 12:00
• Servicio de comida a la carta: 14:00 - 20:00
• Servicio de cenas a la carta: 22:00 - 6:00`
      },

      ubicacion: {
        message: `📍 **Ubicación:**

🏨 Auto Hotel Luxor
🌊 Av. Prol. Boulevard Bernardo Quintana, 1000B
🏖️ Col. Ind. Benito Juárez, CP 76120, Querétaro, México

📞 Teléfono: +52 442 210 3292
🌐 Website: https://autohoteluxor.com

¿Necesitas indicaciones para llegar?`
      },

      // Respuesta para reservas
      reservar: {
        isFlow: true,
        message: `🎉 ¡Excelente! Te ayudo a reservar tu habitación.

Vamos a necesitar:
1. 🏨 Tipo de habitación
2. 📅 Fecha de reservación  
3. 👥 Número de personas
4. 📝 Tus datos de contacto

*Presiona el botón "Reservar Ahora" para comenzar*`
      },

      // Respuesta por defecto
      default: {
        message: `🏨 ¡Bienvenido a Auto Hotel Luxor! 🌊

Puedo ayudarte con:

• 🏨 *"habitaciones"* - Ver tipos de habitaciones
• 💰 *"precios"* - Conocer precios  
• ⭐ *"servicios"* - Servicios del hotel
• 🕒 *"horarios"* - Horarios de operación
• 📍 *"ubicación"* - Nuestra dirección y contacto
• 🎉 *"reservar habitación"* - Hacer una reserva

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

    // Ignorar comandos comunes de sistemas
    const systemCommands = ['/start', '/help', '/menu', 'start', 'help', 'menu'];
    if (systemCommands.includes(message)) return true; // Estos SÍ respondemos

    return true;
  }

  detectIntent(message) {
    const patterns = {
      reservar: [
        'reservar habitación', 'reservar habitacion', 'hacer reserva', 'quiero reservar',
        'reservar ahora', 'agendar habitación', 'reservar cuarto', 'booking',
        'reservación', 'reservar una habitación', 'quiero una habitación', 'reservar', 'reserva'
      ],
      habitaciones: [
        'habitaciones', 'cuartos', 'tipos de habitación', 'que habitaciones tienen',
        'opciones de habitación', 'tipos de cuarto', 'habitaciones disponibles', 'habitacion'
      ],
      precios: [
        'precios', 'tarifas', 'costos', 'cuanto cuesta', 'precio por noche',
        'cuales son los precios', 'tarifa', 'costo', 'precio'
      ],
      servicios: [
        'servicios', 'amenidades', 'que servicios tienen', 'facilidades',
        'que incluye', 'servicios del hotel', 'servicio'
      ],
      horarios: [
        'horarios', 'check in', 'check out', 'check-in', 'check-out',
        'a que hora es el check in', 'horario', 'que hora cierran', 'hora', 'esta abierto', 'abre'
      ],
      ubicacion: [
        'ubicación', 'ubicacion', 'dirección', 'direccion', 'donde están',
        'localización', 'como llegar', 'contacto', 'teléfono', 'ubicacion', 'direcciones', 'donde esta'
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

    if (response.image) {
      // Enviar imagen + texto
      await sendImageMessage(userPhone, response.image, response.message);
    } else {
      // Enviar solo texto
      await sendTextMessage(userPhone, response.message);
    }
  }
}

module.exports = new HotelChatbot();