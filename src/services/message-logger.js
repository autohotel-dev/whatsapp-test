const { database } = require('../modules/database/database');

/**
 * Servicio centralizado para registrar mensajes en la base de datos
 */
class MessageLogger {
  /**
   * Guardar un mensaje entrante (del usuario al bot)
   * @param {string} userPhone - Teléfono del usuario
   * @param {string} text - Texto del mensaje
   * @param {string} intent - Intención detectada
   * @param {number} confidence - Nivel de confianza
   * @param {string} messageType - Tipo de mensaje (text, image, button, flow)
   */
  async logIncoming(userPhone, text, intent = 'unknown', confidence = 0, messageType = 'text') {
    try {
      if (!database.isConnected()) {
        console.warn('⚠️ BD no conectada - mensaje no guardado');
        return null;
      }

      const messageData = {
        text: text,
        direction: 'incoming',
        intent: intent,
        confidence: confidence,
        timestamp: new Date(),
        messageType: messageType
      };

      const result = await database.saveMessage(userPhone, messageData);
      
      if (result) {
        console.log(`💾 Mensaje entrante guardado: ${userPhone} - "${text?.substring(0, 30)}..."`);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error guardando mensaje entrante:', error.message);
      return null;
    }
  }

  /**
   * Guardar un mensaje saliente (del bot al usuario)
   * @param {string} userPhone - Teléfono del usuario
   * @param {string} text - Texto del mensaje
   * @param {string} intent - Intención/tipo de respuesta
   * @param {string} messageType - Tipo de mensaje (text, image, button, flow)
   */
  async logOutgoing(userPhone, text, intent = 'bot_response', messageType = 'text') {
    try {
      if (!database.isConnected()) {
        console.warn('⚠️ BD no conectada - mensaje no guardado');
        return null;
      }

      const messageData = {
        text: text,
        direction: 'outgoing',
        intent: intent,
        confidence: 1.0, // Bot siempre tiene confianza máxima
        timestamp: new Date(),
        messageType: messageType
      };

      const result = await database.saveMessage(userPhone, messageData);
      
      if (result) {
        console.log(`💾 Mensaje saliente guardado: ${userPhone} - "${text?.substring(0, 30)}..."`);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error guardando mensaje saliente:', error.message);
      return null;
    }
  }

  /**
   * Guardar múltiples mensajes (útil para conversaciones con varios mensajes)
   * @param {string} userPhone - Teléfono del usuario
   * @param {Array} messages - Array de objetos con {text, direction, intent, messageType}
   */
  async logBatch(userPhone, messages) {
    try {
      const results = [];
      
      for (const msg of messages) {
        if (msg.direction === 'incoming') {
          results.push(await this.logIncoming(
            userPhone, 
            msg.text, 
            msg.intent, 
            msg.confidence, 
            msg.messageType
          ));
        } else {
          results.push(await this.logOutgoing(
            userPhone, 
            msg.text, 
            msg.intent, 
            msg.messageType
          ));
        }
        
        // Pequeño delay entre mensajes para mantener el orden
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      return results;
    } catch (error) {
      console.error('❌ Error guardando batch de mensajes:', error.message);
      return [];
    }
  }

  /**
   * Obtener historial de mensajes de un usuario
   * @param {string} userPhone - Teléfono del usuario
   * @param {number} limit - Cantidad de mensajes a obtener
   */
  async getHistory(userPhone, limit = 50) {
    try {
      if (!database.isConnected()) {
        return [];
      }

      const conversation = await database.getActiveConversation(userPhone);
      
      if (!conversation || !conversation.messages) {
        return [];
      }

      return conversation.messages
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
    } catch (error) {
      console.error('❌ Error obteniendo historial:', error.message);
      return [];
    }
  }
}

// Exportar instancia única
module.exports = new MessageLogger();
