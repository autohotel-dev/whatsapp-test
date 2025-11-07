// encrypt.js - Versión simple que funcionaba
const crypto = require('crypto');

function encryptResponse(responseData, aesKeyBuffer, initialVectorBuffer) {
  console.log('🔐 Encrypting response...');
  
  try {
    // Si no hay AES key (datos de prueba), retornar sin encriptar
    if (aesKeyBuffer.length === 0) {
      console.log('🔄 No AES key - retornando sin encriptar');
      return {
        encrypted_flow_data: Buffer.from(JSON.stringify(responseData)).toString('base64'),
        initial_vector: initialVectorBuffer.toString('base64')
      };
    }

    // Encriptación real con AES-GCM
    const cipher = crypto.createCipheriv('aes-128-gcm', aesKeyBuffer, initialVectorBuffer);
    
    let encrypted = cipher.update(JSON.stringify(responseData), 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const authTag = cipher.getAuthTag();
    
    const finalData = encrypted + authTag.toString('base64');
    
    console.log('✅ Response encriptado');
    return {
      encrypted_flow_data: finalData,
      initial_vector: initialVectorBuffer.toString('base64')
    };
    
  } catch (error) {
    console.error('❌ Error en encryptResponse:', error);
    
    // Fallback absoluto
    console.log('🔄 Fallback: retornando sin encriptar');
    return {
      encrypted_flow_data: Buffer.from(JSON.stringify(responseData)).toString('base64'),
      initial_vector: initialVectorBuffer.toString('base64')
    };
  }
}

module.exports = { encryptResponse };