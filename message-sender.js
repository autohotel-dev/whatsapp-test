const axios = require('axios');

class MessageSender {
  constructor() {
    this.accessToken = process.env.VERIFY_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.flowId = process.env.FLOW_ID;

    this.validateConfig();
  }

  validateConfig() {
    if (!this.accessToken) {
      console.error('❌ VERIFY_TOKEN no configurado');
    }
    if (!this.phoneNumberId) {
      console.error('❌ WHATSAPP_PHONE_NUMBER_ID no configurado');
    }
    if (!this.flowId) {
      console.warn('⚠️  FLOW_ID no configurado - Flows no funcionarán');
    }
  }

  /**
   * Enviar mensaje de texto simple
   */
  async sendTextMessage(phoneNumber, text) {
    try {
      const messageData = {
        messaging_product: "whatsapp",
        to: this.formatPhoneNumber(phoneNumber),
        type: "text",
        text: {
          body: text
        }
      };

      const response = await this.makeApiCall(messageData);
      console.log('✅ Mensaje de texto enviado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error enviando mensaje de texto:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Enviar mensaje con Flow para reservas
   */
  async sendFlowMessage(phoneNumber, flowToken = null) {
    try {
      if (!this.flowId) {
        throw new Error('FLOW_ID no configurado');
      }

      const messageData = {
        messaging_product: "whatsapp",
        to: this.formatPhoneNumber(phoneNumber),
        type: "interactive",
        interactive: {
          type: "flow",
          header: {
            type: "text",
            text: "🏨 Reserva tu Habitación"
          },
          body: {
            text: "Completa los datos para reservar tu habitación en Auto Hotel Luxor 🏨"
          },
          action: {
            name: "flow",
            parameters: {
              flow_message_version: "3",
              flow_token: flowToken || `hotel_flow_${Date.now()}`,
              flow_id: this.flowId,
              flow_cta: "Reservar Ahora",
              flow_action: "navigate",
              flow_action_payload: {
                screen: "APPOINTMENT"
              }
            }
          }
        }
      };

      const response = await this.makeApiCall(messageData);
      console.log('✅ Flow message enviado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error enviando flow message:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Enviar mensaje con imagen
   */
  async sendImageMessage(phoneNumber, imageUrl, caption = '') {
    try {
      const messageData = {
        messaging_product: "whatsapp",
        to: this.formatPhoneNumber(phoneNumber),
        type: "image",
        image: {
          link: imageUrl,
          caption: caption
        }
      };

      const response = await this.makeApiCall(messageData);
      console.log('✅ Imagen enviada:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error enviando imagen:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Enviar mensaje con botones
   */
  async sendButtonMessage(phoneNumber, text, buttons) {
    try {
      // Usar siempre lista para mejor presentación y mayor ancho
      return this.sendListMessage(phoneNumber, text, "Selecciona una opción", [
        {
          title: "Opciones disponibles",
          rows: buttons.map(button => ({
            id: button.id,
            title: button.title,
            description: ""
          }))
        }
      ]);
    } catch (error) {
      console.error('❌ Error enviando mensaje con botones:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Enviar mensaje con lista de opciones
   */
  async sendListMessage(phoneNumber, text, buttonText, sections) {
    try {
      const messageData = {
        messaging_product: "whatsapp",
        to: this.formatPhoneNumber(phoneNumber),
        type: "interactive",
        interactive: {
          type: "list",
          header: {
            type: "text",
            text: "🏨 Auto Hotel Luxor"
          },
          body: {
            text: text
          },
          action: {
            button: buttonText,
            sections: sections
          }
        }
      };

      const response = await this.makeApiCall(messageData);
      console.log('✅ Mensaje con lista enviado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error enviando mensaje con lista:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Enviar mensaje de ubicación
   */
  async sendLocationMessage(phoneNumber, latitude, longitude, name, address) {
    try {
      const messageData = {
        messaging_product: "whatsapp",
        to: this.formatPhoneNumber(phoneNumber),
        type: "location",
        location: {
          latitude: latitude,
          longitude: longitude,
          name: name,
          address: address
        }
      };

      const response = await this.makeApiCall(messageData);
      console.log('✅ Ubicación enviada:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error enviando ubicación:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Enviar mensaje de contacto
   */
  async sendContactMessage(phoneNumber, contactData) {
    try {
      const messageData = {
        messaging_product: "whatsapp",
        to: this.formatPhoneNumber(phoneNumber),
        type: "contacts",
        contacts: [
          {
            addresses: [
              {
                street: contactData.address,
                city: contactData.city,
                state: contactData.state,
                zip: contactData.zip,
                country: contactData.country,
                country_code: contactData.country_code,
                type: "WORK"
              }
            ],
            birthday: contactData.birthday,
            emails: [
              {
                email: contactData.email,
                type: "WORK"
              }
            ],
            name: {
              formatted_name: contactData.name,
              first_name: contactData.first_name,
              last_name: contactData.last_name
            },
            org: {
              company: contactData.company,
              department: contactData.department,
              title: contactData.title
            },
            phones: [
              {
                phone: contactData.phone,
                type: "WORK",
                wa_id: contactData.wa_id
              }
            ],
            urls: [
              {
                url: contactData.website,
                type: "WORK"
              }
            ]
          }
        ]
      };

      const response = await this.makeApiCall(messageData);
      console.log('✅ Contacto enviado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error enviando contacto:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Plantilla de mensaje rápido para opciones del hotel
   */
  async sendQuickOptions(phoneNumber) {
    const buttons = [
      {
        title: "🏨 Habitaciones"
      },
      {
        title: "💰 Precios"
      },
      {
        title: "🎉 Reservar"
      }
    ];

    return await this.sendButtonMessage(
      phoneNumber,
      "¿En qué te puedo ayudar? Selecciona una opción:",
      buttons
    );
  }

  /**
   * Plantilla de lista para servicios
   */
  async sendServicesList(phoneNumber) {
    const sections = [
      {
        title: "Servicios Principales",
        rows: [
          {
            id: "servicio_1",
            title: "🏊 Piscina Infinita",
            description: "Piscina con vista al mar"
          },
          {
            id: "servicio_2",
            title: "🍽️ Restaurantes",
            description: "3 restaurantes gourmet"
          },
          {
            id: "servicio_3",
            title: "🧘 Spa & Wellness",
            description: "Masajes y tratamientos"
          }
        ]
      },
      {
        title: "Más Servicios",
        rows: [
          {
            id: "servicio_4",
            title: "🏋️ Gimnasio 24/7",
            description: "Equipo de última generación"
          },
          {
            id: "servicio_5",
            title: "👶 Guardería",
            description: "Servicio de niñera"
          }
        ]
      }
    ];

    return await this.sendListMessage(
      phoneNumber,
      "Estos son nuestros servicios principales:",
      "Ver Servicios",
      sections
    );
  }

  /**
   * Llamada genérica a la API de WhatsApp
   */
  async makeApiCall(messageData) {
    if (!this.accessToken || !this.phoneNumberId) {
      throw new Error('Credenciales de WhatsApp no configuradas');
    }

    return await axios.post(
      `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`,
      messageData,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
  }

  /**
   * Formatear número de teléfono
   */
  formatPhoneNumber(phoneNumber) {
    // Remover espacios, guiones, paréntesis
    let cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');

    // Si no tiene código de país, agregar +52 (México) por defecto
    if (!cleanNumber.startsWith('+')) {
      if (cleanNumber.startsWith('52')) {
        cleanNumber = '+' + cleanNumber;
      } else if (cleanNumber.startsWith('1')) {
        cleanNumber = '+' + cleanNumber;
      } else {
        cleanNumber = '+52' + cleanNumber;
      }
    }

    return cleanNumber;
  }

  /**
   * Verificar si un número tiene WhatsApp
   */
  async checkWhatsAppNumber(phoneNumber) {
    try {
      const response = await axios.get(
        `https://graph.facebook.com/v18.0/${this.phoneNumberId}`,
        {
          params: {
            fields: 'id',
            'recipient': this.formatPhoneNumber(phoneNumber)
          },
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      return response.data.id !== undefined;
    } catch (error) {
      console.error('Error verificando número:', error.response?.data || error.message);
      return false;
    }
  }
}

// Crear instancia única
const messageSender = new MessageSender();

// Exportar funciones individuales para uso directo
module.exports = {
  // Instancia completa
  messageSender,

  // Funciones individuales (más fáciles de usar)
  sendTextMessage: (phone, text) => messageSender.sendTextMessage(phone, text),
  sendFlowMessage: (phone, token) => messageSender.sendFlowMessage(phone, token),
  sendImageMessage: (phone, image, caption) => messageSender.sendImageMessage(phone, image, caption),
  sendButtonMessage: (phone, text, buttons) => messageSender.sendButtonMessage(phone, text, buttons),
  sendListMessage: (phone, text, buttonText, sections) => messageSender.sendListMessage(phone, text, buttonText, sections),
  sendLocationMessage: (phone, lat, lng, name, address) => messageSender.sendLocationMessage(phone, lat, lng, name, address),
  sendContactMessage: (phone, contact) => messageSender.sendContactMessage(phone, contact),
  sendQuickOptions: (phone) => messageSender.sendQuickOptions(phone),
  sendServicesList: (phone) => messageSender.sendServicesList(phone),
  checkWhatsAppNumber: (phone) => messageSender.checkWhatsAppNumber(phone),
  formatPhoneNumber: (phone) => messageSender.formatPhoneNumber(phone)
};