const { generateKeyPairSync } = require('crypto');
const fs = require('fs');

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

fs.writeFileSync('whatsapp-webhook-key.pem', privateKey);
fs.writeFileSync('whatsapp-webhook-cert.pem', publicKey);
console.log('Certificados generados correctamente');