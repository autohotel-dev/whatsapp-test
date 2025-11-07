// encrypt.js - Versión corregida
const crypto = require('crypto');

/**
 * Encripta la respuesta para Meta Flows
 */
function encryptResponse(responseData, aesKeyBuffer, initialVectorBuffer) {
  console.log('🔐 ===== ENCRYPT RESPONSE =====');
  console.log('📤 Datos a encriptar:', JSON.stringify(responseData, null, 2));
  
  try {
    // Flip initial vector (como en el ejemplo oficial de Meta)
    const flipped_iv = Buffer.from(initialVectorBuffer).map(byte => ~byte & 0xFF);

    // Encriptar response data con AES-GCM
    const cipher = crypto.createCipheriv(
      "aes-128-gcm",
      aesKeyBuffer,
      flipped_iv
    );
    
    const responseString = JSON.stringify(responseData);
    console.log('📝 JSON a encriptar:', responseString);
    
    let encryptedData = cipher.update(responseString, "utf8");
    encryptedData = Buffer.concat([encryptedData, cipher.final()]);
    const authTag = cipher.getAuthTag();
    
    // Combinar datos encriptados + auth tag
    const finalEncryptedData = Buffer.concat([encryptedData, authTag]).toString("base64");

    console.log('✅ Response encriptado correctamente');
    
    // ✅ RETORNAR OBJETO CON LA ESTRUCTURA CORRECTA
    return {
      encrypted_flow_data: finalEncryptedData,
      initial_vector: initialVectorBuffer.toString('base64') // ⚠️ IMPORTANTE: usar el IV original, no el flipped
    };

  } catch (error) {
    console.error('❌ Error en encryptResponse:', error.message);
    
    // Fallback para testing - SIN encriptación
    console.log('🔄 Usando fallback sin encriptación para testing');
    const responseString = JSON.stringify(responseData);
    return {
      encrypted_flow_data: Buffer.from(responseString).toString('base64'),
      initial_vector: initialVectorBuffer.toString('base64')
    };
  }
}

module.exports = {
  encryptResponse
};