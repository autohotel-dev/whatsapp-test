/**
 * Test para verificar que los datos del Flow se generen correctamente
 */

const { processFlowLogic } = require('./src/modules/chatbot/flow');

console.log('🧪 ===== TEST DE DATOS DEL FLOW =====\n');

// Simular la petición inicial que hace WhatsApp
const testData = {
  screen: "RESERVA",
  action: { name: "init" },
  data: {},
  form_response: null
};

console.log('📥 Simulando petición inicial de WhatsApp:');
console.log(JSON.stringify(testData, null, 2));
console.log('\n');

processFlowLogic(testData).then(response => {
  console.log('\n📤 RESPUESTA QUE SE ENVIARÁ A WHATSAPP:');
  console.log('='.repeat(60));
  console.log(JSON.stringify(response, null, 2));
  console.log('='.repeat(60));
  
  // Verificaciones
  console.log('\n✅ VERIFICACIONES:');
  
  if (response.version) {
    console.log('✓ Versión presente:', response.version);
  } else {
    console.log('✗ FALTA: version');
  }
  
  if (response.screen) {
    console.log('✓ Screen presente:', response.screen);
  } else {
    console.log('✗ FALTA: screen');
  }
  
  if (response.data) {
    console.log('✓ Data presente');
    
    // Verificar cada campo
    const fields = ['tipo_habitacion', 'fecha', 'hora', 'numero_personas'];
    fields.forEach(field => {
      if (response.data[field] && Array.isArray(response.data[field])) {
        console.log(`  ✓ ${field}: ${response.data[field].length} opciones`);
        
        // Verificar estructura del primer item
        if (response.data[field].length > 0) {
          const item = response.data[field][0];
          if (item.id && item.title) {
            console.log(`    ✓ Estructura correcta: {id: "${item.id}", title: "${item.title}"}`);
          } else {
            console.log(`    ✗ Estructura incorrecta:`, item);
          }
        }
      } else {
        console.log(`  ✗ FALTA o NO ES ARRAY: ${field}`);
      }
    });
    
    // Verificar flags
    if (response.data.is_fecha_enabled === true) {
      console.log('  ✓ is_fecha_enabled: true');
    }
    if (response.data.is_hora_enabled === true) {
      console.log('  ✓ is_hora_enabled: true');
    }
    if (response.data.is_numero_personas_enabled === true) {
      console.log('  ✓ is_numero_personas_enabled: true');
    }
    
  } else {
    console.log('✗ FALTA: data');
  }
  
  console.log('\n🎯 RESULTADO: ');
  if (response.data && response.data.tipo_habitacion && response.data.tipo_habitacion.length > 0) {
    console.log('✅ Los datos se generan correctamente. El problema debe estar en:');
    console.log('   1. La encriptación de la respuesta');
    console.log('   2. La configuración del endpoint en Meta');
    console.log('   3. El certificado SSL');
  } else {
    console.log('❌ Los datos NO se están generando correctamente');
  }
  
}).catch(error => {
  console.error('❌ ERROR en el test:', error);
});
