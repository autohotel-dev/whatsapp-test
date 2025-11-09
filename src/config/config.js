// config.js
require('dotenv').config();

const config = {
  port: process.env.PORT || 3000,
  verifyToken: process.env.VERIFY_TOKEN || 'hotel_luxor_2024_token',
  privateKey: process.env.PRIVATE_KEY, // ← Esta es la importante
  version: '1.0.0',
  
  // Configuración del flow
  flowConfig: {
    dataApiVersion: "3.0",
    supportedActions: ["INIT", "BACK", "data_exchange", "ping"]
  },
  
  // Configuración de citas
  appointment: {
    maxDaysInFuture: 30,
    businessHours: {
      start: 9,  // 9 AM
      end: 18    // 6 PM
    },
    slotDuration: 30 // minutos
  }
};

// Validar configuración
console.log('🔧 Configuración cargada:');
console.log('   - Puerto:', config.port);
console.log('   - Verify Token:', config.verifyToken ? '✓ Configurado' : '✗ No configurado');
console.log('   - Private Key:', config.privateKey ? '✓ Configurada' : '✗ NO CONFIGURADA - LOS FLOWS NO FUNCIONARÁN');

if (!config.privateKey) {
  console.error('❌ ERROR CRÍTICO: PRIVATE_KEY no configurada en variables de entorno');
  console.error('💡 Agrega PRIVATE_KEY=tu_private_key_en_base64 en tu archivo .env');
}

module.exports = config;