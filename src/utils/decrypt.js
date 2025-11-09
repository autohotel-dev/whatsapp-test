const crypto = require('crypto');
const config = require('../config/config.js');

function decryptRequest(body) {
  const { encrypted_aes_key, encrypted_flow_data, initial_vector } = body;

  console.log('🔐 ===== INICIANDO DESENCRIPTACIÓN =====');
  console.log('📦 Body keys:', Object.keys(body));

  // Si no hay datos encriptados, retornar datos de prueba
  if (!encrypted_flow_data || !encrypted_aes_key || !initial_vector) {
    console.log('⚠️  Datos encriptados faltantes, usando datos de prueba');
    return getTestData();
  }

  try {
    console.log('🔑 Verificando private key...');
    if (!config.privateKey || config.privateKey.includes('TU_PRIVATE_KEY')) {
      console.error('❌ Private key no configurada correctamente');
      return getTestData();
    }

    // 1. Desencriptar clave AES
    console.log('🔓 Desencriptando AES key...');
    const decryptedAesKey = crypto.privateDecrypt(
      {
        key: config.privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
      },
      Buffer.from(encrypted_aes_key, "base64")
    );

    // 2. Desencriptar flow data
    console.log('📄 Desencriptando flow data...');
    const flowDataBuffer = Buffer.from(encrypted_flow_data, "base64");
    const initialVectorBuffer = Buffer.from(initial_vector, "base64");

    const TAG_LENGTH = 16;
    const encrypted_flow_data_body = flowDataBuffer.subarray(0, -TAG_LENGTH);
    const encrypted_flow_data_tag = flowDataBuffer.subarray(-TAG_LENGTH);

    const decipher = crypto.createDecipheriv(
      "aes-128-gcm",
      decryptedAesKey,
      initialVectorBuffer
    );
    decipher.setAuthTag(encrypted_flow_data_tag);

    const decryptedJSONString = Buffer.concat([
      decipher.update(encrypted_flow_data_body),
      decipher.final(),
    ]).toString("utf-8");

    const decryptedBody = JSON.parse(decryptedJSONString);
    
    console.log('✅ DESENCRIPTACIÓN EXITOSA');
    console.log('🎯 Screen:', decryptedBody.screen);
    console.log('🎯 Action:', decryptedBody.action?.name);
    
    return {
      decryptedBody: decryptedBody,
      aesKeyBuffer: decryptedAesKey,
      initialVectorBuffer,
    };

  } catch (error) {
    console.error('❌ ERROR en desencriptación:', error.message);
    console.log('🔄 Usando datos de prueba debido al error...');
    return getTestData();
  }
}

// ✅ DATOS DE PRUEBA PARA CUANDO FALLE LA DESENCRIPTACIÓN
function getTestData() {
  console.log('🧪 Cargando datos de prueba...');
  
  const testData = {
    screen: "RESERVA",
    action: { name: "init" },
    data: {},
    form_response: null
  };
  
  console.log('📋 Datos de prueba:', testData);
  
  return {
    decryptedBody: testData,
    aesKeyBuffer: Buffer.alloc(0),
    initialVectorBuffer: Buffer.alloc(0)
  };
}

module.exports = {
  decryptRequest
};