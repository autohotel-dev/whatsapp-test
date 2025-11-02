const fs = require('fs');
const cert = fs.readFileSync('whatsapp-webhook-cert.pem', 'utf8');
// Eliminar espacios en blanco y saltos de línea
const cleanCert = cert
  .replace(/-----BEGIN CERTIFICATE-----/, '')
  .replace(/-----END CERTIFICATE-----/, '')
  .replace(/\s+/g, '');
// Volver a formatear correctamente
const fixedCert = `-----BEGIN CERTIFICATE-----\n${cleanCert}\n-----END CERTIFICATE-----`;
fs.writeFileSync('fixed-cert.pem', fixedCert);
console.log('Certificado corregido guardado en fixed-cert.pem');