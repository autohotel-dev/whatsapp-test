const selfsigned = require('selfsigned');
const fs = require('fs');

const attrs = [{ name: 'commonName', value: 'localhost' }];
const pems = selfsigned.generate(attrs, { days: 365 });

fs.writeFileSync('whatsapp-webhook-key.pem', pems.private);
fs.writeFileSync('whatsapp-webhook-cert.pem', pems.cert);

console.log('Certificados generados exitosamente:');
console.log('- whatsapp-webhook-key.pem (clave privada)');
console.log('- whatsapp-webhook-cert.pem (certificado)');