/**
 * UX Enhancer - Mejoras de experiencia de usuario
 * Typing indicators, respuestas dinámicas, personalización
 */

const { sendTextMessage } = require('./message-sender');
const axios = require('axios');

class UXEnhancer {
  constructor() {
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.accessToken = process.env.VERIFY_TOKEN;
    
    // Plantillas de respuestas según hora
    this.greetings = {
      morning: ['¡Buenos días! ☀️', '¡Buen día! 🌅', 'Buenos días ✨'],
      afternoon: ['¡Buenas tardes! 🌤️', '¡Buena tarde! 👋', 'Buenas tardes ☀️'],
      evening: ['¡Buenas noches! 🌙', '¡Buena noche! ⭐', 'Buenas noches 🌃'],
      night: ['¡Buenas noches! 🌛', 'Buenas noches 🌟', '¡Hola! 🌙']
    };

    // Emojis según tipo de habitación
    this.roomEmojis = {
      'master suite junior': '🏨',
      'master suite': '🛏️',
      'jacuzzi': '🛁',
      'sauna': '♨️',
      'alberca': '🏊'
    };
  }

  // ============================================
  // TYPING INDICATORS
  // ============================================

  async sendTypingIndicator(userPhone, duration = 2000) {
    if (!this.phoneNumberId || !this.accessToken) {
      console.log('⚠️  WhatsApp API no configurado para typing indicators');
      return;
    }

    try {
      // Marcar como "leyendo"
      await this.sendChatState(userPhone, 'composing');
      
      // Esperar duración realista
      await this.delay(duration);
      
    } catch (error) {
      console.error('❌ Error enviando typing indicator:', error.message);
    }
  }

  async sendChatState(userPhone, state) {
    try {
      await axios.post(
        `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: userPhone,
          type: 'text',
          text: {
            body: state === 'composing' ? '...' : ''
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      // Silently fail - not critical
    }
  }

  // ============================================
  // RESPUESTAS DINÁMICAS
  // ============================================

  getDynamicGreeting() {
    const hour = new Date().getHours();
    let timeOfDay;
    
    if (hour >= 5 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 18) timeOfDay = 'afternoon';
    else if (hour >= 18 && hour < 22) timeOfDay = 'evening';
    else timeOfDay = 'night';

    const greetings = this.greetings[timeOfDay];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  getWeekendMessage() {
    const day = new Date().getDay();
    const isWeekend = day === 0 || day === 6;
    
    if (isWeekend) {
      return '\n\n🎉 *¡Oferta de fin de semana!* Pregunta por nuestros paquetes especiales.';
    }
    
    return '';
  }

  getSeasonalMessage() {
    const month = new Date().getMonth();
    
    // Temporada alta (vacaciones)
    if ([11, 0, 1, 6, 7].includes(month)) {
      return '\n\n⚠️ *Temporada alta* - Te recomendamos reservar con anticipación.';
    }
    
    return '';
  }

  // ============================================
  // PERSONALIZACIÓN
  // ============================================

  personalizeMessage(message, userProfile = {}) {
    let personalized = message;

    // Agregar saludo dinámico si el mensaje empieza genéricamente
    if (message.startsWith('Hola') || message.startsWith('¡Hola')) {
      personalized = personalized.replace(/^(¡?Hola!?)/, this.getDynamicGreeting());
    }

    // Agregar nombre si está disponible
    if (userProfile.name) {
      personalized = `${personalized.split('\n')[0]} ${userProfile.name}!\n${personalized.split('\n').slice(1).join('\n')}`;
    }

    // Agregar mensaje de bienvenida para usuarios VIP
    if (userProfile.segmentation === 'vip') {
      personalized += '\n\n✨ *Gracias por ser cliente VIP*';
    }

    // Agregar ofertas de fin de semana
    personalized += this.getWeekendMessage();

    return personalized;
  }

  // ============================================
  // FORMATEO DE MENSAJES
  // ============================================

  formatPrice(price) {
    return `$${price.toLocaleString('es-MX')} MXN`;
  }

  formatDate(date) {
    return new Date(date).toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Agregar emojis contextualmente
  addContextualEmojis(message, context) {
    // Detectar tipo de habitación y agregar emoji
    for (const [room, emoji] of Object.entries(this.roomEmojis)) {
      if (message.toLowerCase().includes(room)) {
        message = message.replace(new RegExp(room, 'gi'), `${emoji} ${room}`);
      }
    }

    return message;
  }

  // ============================================
  // MENSAJES CON EFECTO DE TYPING
  // ============================================

  async sendMessageWithTyping(userPhone, message, options = {}) {
    try {
      // Calcular duración de typing basado en longitud del mensaje
      const typingDuration = Math.min(Math.max(message.length * 30, 1000), 3000);
      
      // Mostrar typing indicator
      if (options.showTyping !== false) {
        await this.sendTypingIndicator(userPhone, typingDuration);
      }

      // Enviar mensaje
      await sendTextMessage(userPhone, message);

      console.log(`✅ Mensaje enviado con UX mejorado a ${userPhone}`);
    } catch (error) {
      console.error('❌ Error enviando mensaje con typing:', error.message);
      throw error;
    }
  }

  // ============================================
  // MENSAJES PROGRESIVOS
  // ============================================

  async sendProgressiveMessage(userPhone, parts, delayBetween = 1500) {
    try {
      for (let i = 0; i < parts.length; i++) {
        if (i > 0) {
          await this.delay(delayBetween);
        }
        
        await this.sendMessageWithTyping(userPhone, parts[i]);
      }
    } catch (error) {
      console.error('❌ Error enviando mensaje progresivo:', error.message);
      throw error;
    }
  }

  // ============================================
  // CONFIRMACIONES INTERACTIVAS
  // ============================================

  buildInteractiveConfirmation(message, confirmText = 'Confirmar', cancelText = 'Cancelar') {
    return {
      text: message,
      buttons: [
        { id: 'confirm', title: confirmText },
        { id: 'cancel', title: cancelText }
      ]
    };
  }

  // ============================================
  // SUGERENCIAS INTELIGENTES
  // ============================================

  getSuggestions(intent, userHistory = []) {
    const suggestionMap = {
      habitaciones: ['Ver precios', 'Ver fotos', 'Reservar'],
      precios: ['Ver habitaciones', 'Ver paquetes', 'Reservar'],
      paquetes: ['Ver fotos', 'Ver precios', 'Reservar'],
      fotos: ['Ver precios', 'Reservar ahora', 'Ver paquetes'],
      servicios: ['Ver habitaciones', 'Ver ubicación', 'Reservar'],
      ubicacion: ['Ver horarios', 'Ver servicios', 'Reservar']
    };

    const suggestions = suggestionMap[intent] || ['Ver menú', 'Reservar'];
    
    // Filtrar sugerencias ya visitadas
    return suggestions.filter(s => !userHistory.includes(s.toLowerCase()));
  }

  // ============================================
  // RESPUESTAS SEGÚN SENTIMIENTO
  // ============================================

  getResponseBySentiment(sentiment, baseMessage) {
    const sentimentPrefixes = {
      positive: '¡Me alegra ayudarte! 😊 ',
      negative: 'Lamento la situación. 😔 ',
      confused: 'Entiendo que puede ser confuso. 🤔 ',
      urgent: 'Atenderé tu solicitud de inmediato. ⚡ '
    };

    const prefix = sentimentPrefixes[sentiment] || '';
    return prefix + baseMessage;
  }

  // ============================================
  // REMARKETING Y SEGUIMIENTO
  // ============================================

  async scheduleFollowUp(userPhone, intent, delay = 24 * 60 * 60 * 1000) {
    // Guardar en base de datos para envío posterior
    const followUpMessages = {
      habitaciones: '👋 Hola! Vi que te interesaban nuestras habitaciones. ¿Tienes alguna duda?',
      precios: '💰 ¡Tenemos promociones especiales! ¿Te gustaría conocerlas?',
      reservar: '📅 ¿Ya decidiste cuándo nos visitarás? Estoy aquí para ayudarte con la reserva.'
    };

    const message = followUpMessages[intent];
    if (message) {
      // Aquí se integraría con un sistema de colas (Bull, Agenda, etc.)
      console.log(`📅 Follow-up programado para ${userPhone} en ${delay/1000/60/60} horas`);
    }
  }

  // ============================================
  // VALIDACIÓN DE INPUTS
  // ============================================

  validatePhoneNumber(phone) {
    // Formato mexicano
    const mexicanPhoneRegex = /^\+?52\d{10}$/;
    return mexicanPhoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validateDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return date >= today;
  }

  // ============================================
  // GAMIFICACIÓN
  // ============================================

  getProgressMessage(userProfile) {
    const { totalMessages, totalReservations, leadScore } = userProfile;

    if (totalReservations >= 5) {
      return '⭐ ¡Eres un cliente VIP! Gracias por tu preferencia.';
    } else if (totalReservations >= 2) {
      return '🎖️ ¡Cliente frecuente! Te apreciamos mucho.';
    } else if (leadScore >= 70) {
      return '🔥 Estás a un paso de hacer tu primera reserva!';
    } else if (totalMessages >= 5) {
      return '👍 Gracias por tu interés en Auto Hotel Luxor.';
    }

    return '';
  }

  // ============================================
  // UTILIDADES
  // ============================================

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Calcular tiempo de lectura estimado
  calculateReadingTime(text) {
    const wordsPerMinute = 200;
    const words = text.split(/\s+/).length;
    const minutes = words / wordsPerMinute;
    return Math.ceil(minutes * 60 * 1000); // En milisegundos
  }

  // Truncar texto largo
  truncate(text, maxLength = 1000) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }
}

// Exportar instancia única
const uxEnhancer = new UXEnhancer();

module.exports = uxEnhancer;
