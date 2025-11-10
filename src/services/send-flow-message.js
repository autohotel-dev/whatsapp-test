// send-flow-message.js
const axios = require('axios');

async function sendFlowMessage(phoneNumber) {
  // ✅ USAR VARIABLES DE ENTORNO (recomendado)
  const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || 'EAASdSv4AZAPUBP5zQ37h22KSvCZCqej8XvRDZBydA1RZBGt2RQdNpaW8EZBEmsUfFkrEvsH567qy3fvPfvIoX8NgNyWE4xO4ZA1SZB9M5ZAa3dvKlE2ezTZBtruQiFDUg2hQeD9QmmNVtuYSZCz4iNyGdx2OdspZAuzsgEX7NBDu005y321f6qoRwpSm1R1owMGsMrqvQZDZD';
  const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '844633128735027';
  const FLOW_ID = process.env.WHATSAPP_FLOW_ID || '1411892133940250';

  // ✅ Validar que el número tenga formato correcto
  const cleanPhone = phoneNumber.replace(/\s+/g, '').replace('+', '');
  
  const messageData = {
    messaging_product: "whatsapp",
    to: cleanPhone,
    type: "interactive",
    interactive: {
      type: "flow",
      header: {
        type: "text",
        text: " Auto Hotel Luxor"
      },
      body: {
        text: "Complete los datos para reservar su habitación "
      },
      action: {
        name: "flow",
        parameters: {
          flow_message_version: "3",
          flow_token: `luxor_${Date.now()}`,
          flow_id: FLOW_ID,
          flow_cta: "Comenzar Reserva",
          flow_action: "data_exchange"
        }
      }
    }
  };

  try {
    console.log(` Enviando flow a: ${cleanPhone}`);
    
    const response = await axios.post(
      `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
      messageData,
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000
      }
    );
    
    console.log('✅ Flow enviado correctamente');
    return response.data;
    
  } catch (error) {
    console.error('❌ Error crítico enviando flow:');
    
    if (error.response) {
      // El servidor respondió con un código de error
      console.error('Status:', error.response.status);
      console.error('Error Code:', error.response.data?.error?.code);
      console.error('Error Message:', error.response.data?.error?.message);
      console.error('Full Error:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      // La solicitud fue hecha pero no se recibió respuesta
      console.error('No response received:', error.request);
    } else {
      // Algo pasó al configurar la solicitud
      console.error('Request setup error:', error.message);
    }
    
    throw new Error(`Failed to send flow: ${error.response?.data?.error?.message || error.message}`);
  }
}

module.exports = sendFlowMessage;