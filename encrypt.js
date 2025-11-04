import crypto from 'crypto';

// ✅ ENCRIPTAR RESPONSE (igual que el ejemplo de Meta)
function encryptResponse(response, aesKeyBuffer, initialVectorBuffer) {
  // Flip initial vector (como en el ejemplo oficial)
  const flipped_iv = [];
  for (const pair of initialVectorBuffer.entries()) {
    flipped_iv.push(~pair[1]);
  }

  // Encriptar response data con AES-GCM
  const cipher = crypto.createCipheriv(
    "aes-128-gcm",
    aesKeyBuffer,
    Buffer.from(flipped_iv)
  );

  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(response), "utf-8"),
    cipher.final(),
    cipher.getAuthTag(),
  ]).toString("base64");

  console.log('✅ Response encriptado correctamente');
  return encrypted;
}

export default encryptResponse;
