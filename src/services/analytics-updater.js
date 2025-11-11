const { database, models } = require('../modules/database/database');

/**
 * Servicio para actualizar las analíticas diarias automáticamente
 */
class AnalyticsUpdater {
  constructor() {
    this.updateInterval = null;
    this.isRunning = false;
  }

  /**
   * Calcular y guardar las analíticas del día actual
   */
  async updateDailyAnalytics() {
    try {
      if (!database.isConnected()) {
        console.warn('⚠️ BD no conectada - analytics no actualizados');
        return null;
      }

      console.log('📊 Actualizando analytics diarias...');

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // 1. Contar mensajes del día
      const conversations = await models.Conversation.find({
        'messages.timestamp': { 
          $gte: today,
          $lt: tomorrow
        }
      });

      const allMessages = conversations.flatMap(conv => 
        (conv.messages || []).filter(msg => {
          const msgDate = new Date(msg.timestamp);
          return msgDate >= today && msgDate < tomorrow;
        })
      );

      const totalMessages = allMessages.length;

      // 2. Usuarios únicos del día
      const uniquePhones = new Set(conversations.map(c => c.userPhone));
      const uniqueUsers = uniquePhones.size;

      // 3. Nuevos usuarios (primera interacción hoy)
      const newUsers = await models.User.countDocuments({
        firstInteraction: { $gte: today, $lt: tomorrow }
      });

      // 4. Usuarios que vuelven
      const returningUsers = uniqueUsers - newUsers;

      // 5. Contar por intención
      const intentCounts = new Map();
      allMessages.forEach(msg => {
        if (msg.intent) {
          intentCounts.set(
            msg.intent, 
            (intentCounts.get(msg.intent) || 0) + 1
          );
        }
      });

      // 6. Top intenciones
      const topIntents = Array.from(intentCounts.entries())
        .map(([intent, count]) => ({ intent, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // 7. Confianza promedio
      const messagesWithConfidence = allMessages.filter(m => m.confidence > 0);
      const averageConfidence = messagesWithConfidence.length > 0
        ? messagesWithConfidence.reduce((sum, m) => sum + m.confidence, 0) / messagesWithConfidence.length
        : 0;

      // 8. Tasa de conversión
      const todayReservations = await models.Reservation.countDocuments({
        createdAt: { $gte: today, $lt: tomorrow },
        status: { $in: ['confirmed', 'completed'] }
      });
      
      const conversionRate = uniqueUsers > 0 
        ? (todayReservations / uniqueUsers) * 100 
        : 0;

      // 9. Horas pico (horas con más mensajes)
      const messagesByHour = new Array(24).fill(0);
      allMessages.forEach(msg => {
        const hour = new Date(msg.timestamp).getHours();
        messagesByHour[hour]++;
      });

      const peakHours = messagesByHour
        .map((count, hour) => ({ hour, count }))
        .filter(h => h.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(h => h.hour);

      // 10. Contar errores (mensajes con baja confianza)
      const errorCount = allMessages.filter(m => 
        m.direction === 'incoming' && m.confidence < 0.5
      ).length;

      // 11. Guardar en BD
      const analyticsData = {
        date: today,
        totalMessages,
        uniqueUsers,
        newUsers,
        returningUsers,
        intentCounts,
        errorCount,
        averageConfidence: Math.round(averageConfidence * 100) / 100,
        conversionRate: Math.round(conversionRate * 100) / 100,
        peakHours,
        topIntents
      };

      const result = await database.saveDailyAnalytics(analyticsData);

      console.log('✅ Analytics diarias actualizadas:', {
        fecha: today.toISOString().split('T')[0],
        mensajes: totalMessages,
        usuarios: uniqueUsers,
        nuevos: newUsers,
        conversión: `${conversionRate.toFixed(2)}%`
      });

      return result;

    } catch (error) {
      console.error('❌ Error actualizando analytics diarias:', error.message);
      return null;
    }
  }

  /**
   * Actualizar analíticas de días anteriores (útil para recuperar datos)
   */
  async updateHistoricalAnalytics(daysBack = 7) {
    console.log(`📊 Actualizando analytics de los últimos ${daysBack} días...`);
    
    for (let i = 0; i < daysBack; i++) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - i);
      targetDate.setHours(0, 0, 0, 0);

      await this.updateAnalyticsForDate(targetDate);
      
      // Pequeño delay para no sobrecargar
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('✅ Analytics históricas actualizadas');
  }

  /**
   * Actualizar analíticas de una fecha específica
   */
  async updateAnalyticsForDate(targetDate) {
    try {
      if (!database.isConnected()) {
        return null;
      }

      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Obtener conversaciones de ese día
      const conversations = await models.Conversation.find({
        'messages.timestamp': { 
          $gte: startOfDay,
          $lte: endOfDay
        }
      });

      const allMessages = conversations.flatMap(conv => 
        (conv.messages || []).filter(msg => {
          const msgDate = new Date(msg.timestamp);
          return msgDate >= startOfDay && msgDate <= endOfDay;
        })
      );

      if (allMessages.length === 0) {
        console.log(`⚠️ No hay mensajes para ${startOfDay.toISOString().split('T')[0]}`);
        return null;
      }

      const totalMessages = allMessages.length;
      const uniquePhones = new Set(conversations.map(c => c.userPhone));
      const uniqueUsers = uniquePhones.size;

      const newUsers = await models.User.countDocuments({
        firstInteraction: { $gte: startOfDay, $lte: endOfDay }
      });

      const returningUsers = uniqueUsers - newUsers;

      const intentCounts = new Map();
      allMessages.forEach(msg => {
        if (msg.intent) {
          intentCounts.set(msg.intent, (intentCounts.get(msg.intent) || 0) + 1);
        }
      });

      const topIntents = Array.from(intentCounts.entries())
        .map(([intent, count]) => ({ intent, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const messagesWithConfidence = allMessages.filter(m => m.confidence > 0);
      const averageConfidence = messagesWithConfidence.length > 0
        ? messagesWithConfidence.reduce((sum, m) => sum + m.confidence, 0) / messagesWithConfidence.length
        : 0;

      const todayReservations = await models.Reservation.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        status: { $in: ['confirmed', 'completed'] }
      });
      
      const conversionRate = uniqueUsers > 0 ? (todayReservations / uniqueUsers) * 100 : 0;

      const messagesByHour = new Array(24).fill(0);
      allMessages.forEach(msg => {
        const hour = new Date(msg.timestamp).getHours();
        messagesByHour[hour]++;
      });

      const peakHours = messagesByHour
        .map((count, hour) => ({ hour, count }))
        .filter(h => h.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(h => h.hour);

      const errorCount = allMessages.filter(m => 
        m.direction === 'incoming' && m.confidence < 0.5
      ).length;

      const analyticsData = {
        date: startOfDay,
        totalMessages,
        uniqueUsers,
        newUsers,
        returningUsers,
        intentCounts,
        errorCount,
        averageConfidence: Math.round(averageConfidence * 100) / 100,
        conversionRate: Math.round(conversionRate * 100) / 100,
        peakHours,
        topIntents
      };

      return await database.saveDailyAnalytics(analyticsData);

    } catch (error) {
      console.error('❌ Error actualizando analytics para fecha:', error.message);
      return null;
    }
  }

  /**
   * Iniciar actualización automática (cada hora)
   */
  startAutoUpdate(intervalHours = 1) {
    if (this.isRunning) {
      console.warn('⚠️ Analytics updater ya está corriendo');
      return;
    }

    console.log(`🚀 Iniciando actualización automática de analytics (cada ${intervalHours}h)`);
    
    // Actualizar inmediatamente
    this.updateDailyAnalytics();

    // Luego cada X horas
    this.updateInterval = setInterval(() => {
      this.updateDailyAnalytics();
    }, intervalHours * 60 * 60 * 1000);

    this.isRunning = true;
  }

  /**
   * Detener actualización automática
   */
  stopAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      this.isRunning = false;
      console.log('⏹️ Analytics updater detenido');
    }
  }

  /**
   * Obtener resumen de analytics de los últimos días
   */
  async getAnalyticsSummary(days = 7) {
    try {
      return await database.getAnalyticsSummary(days);
    } catch (error) {
      console.error('❌ Error obteniendo resumen de analytics:', error.message);
      return [];
    }
  }
}

// Exportar instancia única
module.exports = new AnalyticsUpdater();
