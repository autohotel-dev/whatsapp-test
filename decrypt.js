const crypto = require('crypto');
const config = require('./config.js');

/**
 * Desencripta el request de Meta Flows
 */
function decryptRequest(body) {
  const { encrypted_aes_key, encrypted_flow_data, initial_vector } = body;

  try {
    // 1. Desencriptar clave AES con RSA
    const decryptedAesKey = crypto.privateDecrypt(
      {
        key: config.privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
      },
      Buffer.from(encrypted_aes_key, "base64")
    );

    // 2. Desencriptar flow data con AES-GCM
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

    console.log('✅ Request desencriptado correctamente');
    
    return {
      decryptedBody: JSON.parse(decryptedJSONString),
      aesKeyBuffer: decryptedAesKey,
      initialVectorBuffer,
    };

  } catch (error) {
    console.error('❌ Error en decryptRequest:', error.message);
    throw new Error('DECRYPTION_FAILED: ' + error.message);
  }
}

module.exports = {
  decryptRequest
};