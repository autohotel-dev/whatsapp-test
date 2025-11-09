const chatbot = require('../chatbot/autoreply');

/**
 * Módulo de Analytics para visualizar métricas del chatbot
 */

// 📊 Obtener todas las métricas
function getAllAnalytics() {
  const analytics = chatbot.getAnalytics();
  
  console.log('\n📊 ===== ANALYTICS DEL CHATBOT =====');
  console.log(`📨 Total de mensajes procesados: ${analytics.totalMessages}`);
  console.log(`👥 Usuarios activos: ${analytics.activeUsers}`);
  console.log(`👤 Total de usuarios: ${analytics.totalUsers}`);
  console.log(`❌ Errores: ${analytics.errorCount} (${analytics.errorRate})`);
  
  console.log('\n🎯 Top 5 Intenciones:');
  analytics.topIntents.forEach(([intent, count], index) => {
    console.log(`  ${index + 1}. ${intent}: ${count} mensajes`);
  });
  
  console.log('\n📈 Todas las Intenciones:');
  Object.entries(analytics.intentCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([intent, count]) => {
      const percentage = (count / analytics.totalMessages * 100).toFixed(1);
      console.log(`  • ${intent}: ${count} (${percentage}%)`);
    });
  
  console.log('\n=====================================\n');
  
  return analytics;
}

// 👤 Obtener estadísticas de un usuario específico
function getUserAnalytics(userPhone) {
  const stats = chatbot.getUserStats(userPhone);
  
  if (!stats) {
    console.log(`❌ No hay datos para el usuario: ${userPhone}`);
    return null;
  }
  
  console.log(`\n👤 ===== ESTADÍSTICAS DE ${userPhone} =====`);
  console.log(`💬 Mensajes en contexto: ${stats.messageCount}`);
  console.log(`🔄 Total de interacciones: ${stats.interactionCount}`);
  
  if (stats.firstSeen) {
    const firstDate = new Date(stats.firstSeen);
    console.log(`🕐 Primera interacción: ${firstDate.toLocaleString('es-MX')}`);
  }
  
  if (stats.lastSeen) {
    const lastDate = new Date(stats.lastSeen);
    const timeSince = Math.floor((Date.now() - stats.lastSeen) / 1000 / 60);
    console.log(`🕐 Última interacción: ${lastDate.toLocaleString('es-MX')} (hace ${timeSince} minutos)`);
  }
  
  if (stats.recentIntents.length > 0) {
    console.log('\n📋 Intenciones recientes:');
    stats.recentIntents.forEach((intent, index) => {
      console.log(`  ${index + 1}. ${intent}`);
    });
  }
  
  console.log('\n=====================================\n');
  
  return stats;
}

// 🔄 Mostrar resumen rápido
function quickSummary() {
  const analytics = chatbot.getAnalytics();
  
  console.log('\n⚡ RESUMEN RÁPIDO');
  console.log(`📨 Mensajes: ${analytics.totalMessages} | 👥 Usuarios: ${analytics.activeUsers}/${analytics.totalUsers} | ❌ Errores: ${analytics.errorRate}`);
  
  if (analytics.topIntents.length > 0) {
    const [topIntent, topCount] = analytics.topIntents[0];
    console.log(`🔥 Intención más popular: ${topIntent} (${topCount} veces)`);
  }
  
  console.log('');
}

// 📤 Exportar métricas en formato JSON
function exportAnalytics() {
  const analytics = chatbot.getAnalytics();
  return {
    timestamp: new Date().toISOString(),
    metrics: analytics,
    summary: {
      conversionRate: analytics.intentCounts['reservar'] 
        ? (analytics.intentCounts['reservar'] / analytics.totalMessages * 100).toFixed(2) + '%'
        : '0%',
      mostPopularIntent: analytics.topIntents[0]?.[0] || 'N/A',
      avgMessagesPerUser: analytics.totalUsers > 0
        ? (analytics.totalMessages / analytics.totalUsers).toFixed(2)
        : 0
    }
  };
}

// 🧪 Modo debug - mostrar todas las interacciones
function debugMode() {
  console.log('\n🔍 ===== MODO DEBUG =====');
  console.log('Contextos de usuario activos:', chatbot.userContext.size);
  console.log('Rate limiting activo para:', chatbot.userMessageCount.size, 'usuarios');
  console.log('Últimos mensajes procesados:', chatbot.userLastMessage.size);
  console.log('========================\n');
}

// Si se ejecuta directamente, mostrar analytics
if (require.main === module) {
  console.log('🚀 Analytics del Chatbot - Auto Hotel Luxor\n');
  
  // Esperar 1 segundo para que el chatbot se inicialice
  setTimeout(() => {
    quickSummary();
    getAllAnalytics();
    debugMode();
    
    console.log('💡 Tip: Importa este módulo para acceder a:');
    console.log('  - getAllAnalytics()');
    console.log('  - getUserAnalytics(userPhone)');
    console.log('  - quickSummary()');
    console.log('  - exportAnalytics()');
    console.log('  - debugMode()');
  }, 1000);
}

module.exports = {
  getAllAnalytics,
  getUserAnalytics,
  quickSummary,
  exportAnalytics,
  debugMode
};
