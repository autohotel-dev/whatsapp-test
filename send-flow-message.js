// send-flow-message.js
const axios = require('axios');

async function sendFlowMessage(phoneNumber, flowToken = null) {
  const ACCESS_TOKEN = 'TU_ACCESS_TOKEN_DE_WHATSAPP';
  const PHONE_NUMBER_ID = 'TU_PHONE_NUMBER_ID';
  
  const messageData = {
    messaging_product: "whatsapp",
    to: phoneNumber, // Número del usuario en formato internacional: 521234567890
    type: "interactive",
    interactive: {
      type: "flow",
      header: {
        type: "text",
        text: "📅 Book Your Appointment"
      },
      body: {
        text: "Click below to schedule your appointment with us!"
      },
      action: {
        name: "flow",
        parameters: {
          flow_message_version: "3",
          flow_token: flowToken || `flow_${Date.now()}`,
          flow_id: "TU_FLOW_ID", // El ID de tu flow en Meta
          flow_cta: "Book Now",
          flow_action: "navigate",
          flow_action_payload: {
            screen: "APPOINTMENT"
          }
        }
      }
    }
  };

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      messageData,
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Flow message sent:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error sending flow message:', error.response?.data || error.message);
    throw error;
  }
}

// Ejemplo de uso
// sendFlowMessage("521234567890");