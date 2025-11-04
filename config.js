const config = {
  port: process.env.PORT || 3000,
  verifyToken: process.env.VERIFY_TOKEN,
  privateKey: process.env.PRIVATE_KEY,
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

// Validar configuración requerida
if (!config.privateKey) {
  console.error('❌ PRIVATE_KEY no configurada');
  process.exit(1);
}

if (!config.verifyToken) {
  console.warn('⚠️  VERIFY_TOKEN no configurado - Verificación deshabilitada');
}

module.exports = config;