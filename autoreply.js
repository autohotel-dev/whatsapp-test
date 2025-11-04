const { sendFlowMessage, sendTextMessage, sendImageMessage } = require('./message-sender.js');

class HotelChatbot {
  constructor() {
    this.responses = {
      // Respuestas para información general
      habitaciones: {
        message: `🏨 **Tipos de Habitaciones Disponibles:**

• 💎 **Suite Ejecutiva** - 50m², vista al mar, jacuzzi
• 🌊 **Habitación Deluxe** - 35m², balcón, vista al océano  
• 🌴 **Habitación Estándar** - 25m², cama king size
• 👨‍👩‍👧‍👦 **Familiar** - 40m², 2 camas queen, área de estar

¿Te gustaría conocer los precios o hacer una reserva?`,
        image: 'https://ejemplo.com/habitaciones.jpg'
      },

      precios: {
        message: `💰 **Tarifas por Noche:**

• Suite Ejecutiva: $250 USD
• Habitación Deluxe: $180 USD  
• Habitación Estándar: $120 USD
• Familiar: $200 USD

*Incluye desayuno buffet e internet gratis*`,
        image: 'https://ejemplo.com/precios.jpg'
      },

      servicios: {
        message: `⭐ **Servicios del Hotel:**

• 🏊 Piscina infinita
• 🍽️ 3 restaurantes
• 🧘 Spa y wellness center
• 🏋️ Gimnasio 24/7
• 📶 WiFi gratis
• 🅿️ Estacionamiento
• 🐾 Pet friendly
• 👶 Guardería

¿En qué más puedo ayudarte?`
      },

      horarios: {
        message: `🕒 **Horarios:**

• Check-in: 3:00 PM
• Check-out: 12:00 PM
• Desayuno: 6:30 AM - 11:00 AM
• Piscina: 7:00 AM - 10:00 PM
• Spa: 9:00 AM - 8:00 PM
• Restaurante: 7:00 AM - 11:00 PM`
      },

      ubicacion: {
        message: `📍 **Ubicación:**

🏨 Hotel Paradise Beach Resort
🌊 Avenida Costera 1234
🏖️ Cancún, México

📞 Teléfono: +52 998 123 4567
🌐 Website: www.hotelparadise.com

¿Necesitas indicaciones para llegar?`
      },

      // Respuesta para reservas
      reservar: {
        isFlow: true,
        message: `🎉 ¡Excelente! Te ayudo a reservar tu habitación.

Vamos a necesitar:
1. 🏨 Tipo de habitación
2. 📅 Fechas de estadía  
3. 👥 Número de huéspedes
4. 📝 Tus datos de contacto

*Presiona el botón "Reservar Ahora" para comenzar*`
      },

      // Respuesta por defecto
      default: {
        message: `🏨 ¡Bienvenido al Hotel Paradise Beach Resort! 🌊

Puedo ayudarte con:

• 🏨 *"habitaciones"* - Ver tipos de habitaciones
• 💰 *"precios"* - Conocer tarifas  
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

  detectIntent(message) {
    const patterns = {
      reservar: [
        'reservar habitación', 'reservar habitacion', 'hacer reserva', 'quiero reservar',
        'reservar ahora', 'agendar habitación', 'reservar cuarto', 'booking',
        'reservación', 'reservar una habitación', 'quiero una habitación'
      ],
      habitaciones: [
        'habitaciones', 'cuartos', 'tipos de habitación', 'que habitaciones tienen',
        'opciones de habitación', 'tipos de cuarto', 'habitaciones disponibles'
      ],
      precios: [
        'precios', 'tarifas', 'costos', 'cuanto cuesta', 'precio por noche',
        'cuales son los precios', 'tarifa', 'costo'
      ],
      servicios: [
        'servicios', 'amenidades', 'que servicios tienen', 'facilidades',
        'que incluye', 'servicios del hotel'
      ],
      horarios: [
        'horarios', 'check in', 'check out', 'check-in', 'check-out',
        'a que hora es el check in', 'horario', 'que hora cierran'
      ],
      ubicacion: [
        'ubicación', 'ubicacion', 'dirección', 'direccion', 'donde están',
        'localización', 'como llegar', 'contacto', 'teléfono'
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