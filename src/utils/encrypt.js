const crypto = require('crypto');

/**
 * Encripta la respuesta para Meta Flows
 */
function encryptResponse(response, aesKeyBuffer, initialVectorBuffer) {
  try {
    // Flip initial vector (como en el ejemplo oficial de Meta)
    const flipped_iv = Buffer.from(initialVectorBuffer.map(byte => ~byte));

    // Encriptar response data con AES-GCM
    const cipher = crypto.createCipheriv(
      "aes-128-gcm",
      aesKeyBuffer,
      flipped_iv
    );
    
    const responseString = JSON.stringify(response);
    const encrypted = Buffer.concat([
      cipher.update(responseString, "utf-8"),
      cipher.final(),
      cipher.getAuthTag(),
    ]).toString("base64");

    console.log('✅ Response encriptado correctamente');
    return encrypted;

  } catch (error) {
    console.error('❌ Error en encryptResponse:', error.message);
    throw new Error('ENCRYPTION_FAILED: ' + error.message);
  }
}

module.exports = {
  encryptResponse
};