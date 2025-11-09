/**
 * Sistema de NLP Avanzado con OpenAI
 * Procesamiento de lenguaje natural, corrección de typos, multi-idioma
 */

const axios = require('axios');

class AINLP {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.enabled = !!this.openaiApiKey;
    this.model = 'gpt-3.5-turbo';
    
    // Cache para evitar llamadas repetidas
    this.cache = new Map();
    this.cacheTimeout = 60 * 60 * 1000; // 1 hora
    
    if (!this.enabled) {
      console.log('⚠️  OpenAI no configurado - usando NLP básico');
    } else {
      console.log('✅ OpenAI NLP habilitado');
    }

    // Prompt base para el hotel
    this.systemPrompt = `Eres un asistente virtual del Auto Hotel Luxor en Querétaro, México.
Tu trabajo es entender las intenciones de los clientes y responder de manera profesional y amigable.

INFORMACIÓN DEL HOTEL:
- Ubicación: Av. Prol. Boulevard Bernardo Quintana, 1000B, Querétaro
- Tipos de habitaciones: Master Suite Junior, Master Suite, Master Suite con Jacuzzi, Master Suite con Jacuzzi y Sauna, Master Suite con Alberca
- Servicios: WiFi, Estacionamiento, Servicio de habitación, Sauna, Jacuzzi, Alberca
- Horarios: Abierto 24/7 con diferentes tarifas según día
- Teléfono: 442 210 3292

INTENCIONES POSIBLES:
- reservar: Cliente quiere hacer una reservación
- habitaciones: Pregunta sobre tipos de cuartos
- precios: Pregunta sobre costos y tarifas
- paquetes: Interés en paquetes decorados especiales
- fotos: Quiere ver imágenes
- servicios: Pregunta sobre amenidades
- horarios: Check-in, check-out, horarios
- ubicacion: Dirección, cómo llegar
- exclusivos: Servicios premium
- menu: Quiere ver opciones
- quejas: Tiene una queja o problema
- elogio: Felicitaciones o feedback positivo

Detecta la intención del mensaje y responde en formato JSON.`;
  }

  // ============================================
  // DETECCIÓN DE INTENCIÓN CON IA
  // ============================================

  async detectIntent(message, context = {}) {
    if (!this.enabled) {
      return this.basicIntentDetection(message);
    }

    try {
      // Verificar cache
      const cacheKey = `intent_${message}`;
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          console.log('📦 Intent desde cache');
          return cached.data;
        }
      }

      const prompt = `Mensaje del cliente: "${message}"

${context.previousMessages ? `Contexto previo: ${context.previousMessages.join(', ')}` : ''}

Analiza el mensaje y responde SOLO con un JSON:
{
  "intent": "nombre_de_intencion",
  "confidence": 0.95,
  "language": "es",
  "sentiment": "positive/neutral/negative",
  "entities": {
    "date": "si menciona fecha",
    "numberOfGuests": "si menciona personas",
    "roomType": "si menciona tipo de habitación"
  },
  "suggestedResponse": "breve sugerencia de respuesta"
}`;

      const response = await this.callOpenAI([
        { role: 'system', content: this.systemPrompt },
        { role: 'user', content: prompt }
      ]);

      const result = JSON.parse(response);
      
      // Guardar en cache
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      console.error('❌ Error en AI Intent Detection:', error.message);
      return this.basicIntentDetection(message);
    }
  }

  // Fallback a detección básica
  basicIntentDetection(message) {
    return {
      intent: 'unknown',
      confidence: 0.5,
      language: 'es',
      sentiment: 'neutral'
    };
  }

  // ============================================
  // CORRECCIÓN DE TYPOS
  // ============================================

  async correctTypos(message) {
    if (!this.enabled || message.length < 3) {
      return message;
    }

    try {
      const cacheKey = `typo_${message}`;
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
      }

      const prompt = `Corrige los errores de ortografía en este mensaje manteniendo el significado original. 
Si no hay errores, devuelve el mensaje exactamente igual.
Mensaje: "${message}"
Responde SOLO con el mensaje corregido, sin explicaciones.`;

      const corrected = await this.callOpenAI([
        { role: 'user', content: prompt }
      ]);

      this.cache.set(cacheKey, {
        data: corrected,
        timestamp: Date.now()
      });

      if (corrected !== message) {
        console.log(`📝 Typo corregido: "${message}" → "${corrected}"`);
      }

      return corrected;
    } catch (error) {
      console.error('❌ Error corrigiendo typos:', error.message);
      return message;
    }
  }

  // ============================================
  // TRADUCCIÓN
  // ============================================

  async translate(message, targetLang = 'es') {
    if (!this.enabled) {
      return message;
    }

    try {
      const prompt = `Traduce este mensaje a ${targetLang === 'es' ? 'español' : 'inglés'}: "${message}"
Responde SOLO con la traducción, sin explicaciones.`;

      const translation = await this.callOpenAI([
        { role: 'user', content: prompt }
      ]);

      return translation;
    } catch (error) {
      console.error('❌ Error traduciendo:', error.message);
      return message;
    }
  }

  async detectLanguage(message) {
    if (!this.enabled) {
      // Detección simple
      const englishWords = ['hello', 'hi', 'room', 'price', 'booking', 'reservation'];
      const hasEnglish = englishWords.some(word => message.toLowerCase().includes(word));
      return hasEnglish ? 'en' : 'es';
    }

    try {
      const prompt = `Detecta el idioma de este mensaje. Responde SOLO con el código de idioma (es, en, etc.): "${message}"`;
      
      const language = await this.callOpenAI([
        { role: 'user', content: prompt }
      ]);

      return language.toLowerCase().trim();
    } catch (error) {
      return 'es';
    }
  }

  // ============================================
  // GENERACIÓN DE RESPUESTAS INTELIGENTES
  // ============================================

  async generateResponse(userMessage, intent, context = {}) {
    if (!this.enabled) {
      return null;
    }

    try {
      const prompt = `El cliente escribió: "${userMessage}"
Intención detectada: ${intent}
${context.userProfile ? `Perfil del usuario: ${JSON.stringify(context.userProfile)}` : ''}
${context.previousMessages ? `Mensajes previos: ${context.previousMessages.join(', ')}` : ''}

Genera una respuesta profesional, amigable y útil para el Auto Hotel Luxor.
Máximo 3 oraciones. Usa emojis apropiados.
Responde SOLO con la respuesta, sin explicaciones.`;

      const response = await this.callOpenAI([
        { role: 'system', content: this.systemPrompt },
        { role: 'user', content: prompt }
      ]);

      return response;
    } catch (error) {
      console.error('❌ Error generando respuesta:', error.message);
      return null;
    }
  }

  // ============================================
  // ANÁLISIS DE SENTIMIENTO
  // ============================================

  async analyzeSentiment(message) {
    if (!this.enabled) {
      return { sentiment: 'neutral', score: 0.5 };
    }

    try {
      const prompt = `Analiza el sentimiento de este mensaje en JSON:
"${message}"

Responde SOLO con JSON:
{
  "sentiment": "positive/neutral/negative",
  "score": 0.8,
  "emotion": "happy/angry/confused/neutral",
  "urgency": "low/medium/high"
}`;

      const result = await this.callOpenAI([
        { role: 'user', content: prompt }
      ]);

      return JSON.parse(result);
    } catch (error) {
      console.error('❌ Error en análisis de sentimiento:', error.message);
      return { sentiment: 'neutral', score: 0.5, emotion: 'neutral', urgency: 'low' };
    }
  }

  // ============================================
  // EXTRACCIÓN DE ENTIDADES
  // ============================================

  async extractEntities(message) {
    if (!this.enabled) {
      return {};
    }

    try {
      const prompt = `Extrae información relevante de este mensaje para una reserva de hotel:
"${message}"

Responde SOLO con JSON:
{
  "date": "fecha si la menciona",
  "numberOfGuests": número,
  "roomType": "tipo de habitación si la menciona",
  "specialRequests": "peticiones especiales",
  "budget": "presupuesto si lo menciona"
}`;

      const result = await this.callOpenAI([
        { role: 'user', content: prompt }
      ]);

      return JSON.parse(result);
    } catch (error) {
      console.error('❌ Error extrayendo entidades:', error.message);
      return {};
    }
  }

  // ============================================
  // SUGERENCIAS DE UPSELL
  // ============================================

  async suggestUpsell(intent, userProfile = {}) {
    if (!this.enabled) {
      return null;
    }

    try {
      const prompt = `El cliente mostró interés en: ${intent}
${userProfile.interests ? `Intereses previos: ${userProfile.interests.join(', ')}` : ''}
${userProfile.leadScore ? `Lead score: ${userProfile.leadScore}` : ''}

Sugiere UN upsell apropiado para el Auto Hotel Luxor.
Debe ser sutil y relevante. Máximo 1 oración.
Responde SOLO con la sugerencia, sin explicaciones.`;

      const suggestion = await this.callOpenAI([
        { role: 'system', content: this.systemPrompt },
        { role: 'user', content: prompt }
      ]);

      return suggestion;
    } catch (error) {
      console.error('❌ Error generando upsell:', error.message);
      return null;
    }
  }

  // ============================================
  // LLAMADA A OPENAI API
  // ============================================

  async callOpenAI(messages, options = {}) {
    if (!this.enabled) {
      throw new Error('OpenAI no está configurado');
    }

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: options.model || this.model,
          messages: messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 500
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 segundos
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      if (error.response) {
        console.error('❌ OpenAI API Error:', error.response.data);
      } else {
        console.error('❌ OpenAI Request Error:', error.message);
      }
      throw error;
    }
  }

  // ============================================
  // UTILIDADES
  // ============================================

  clearCache() {
    this.cache.clear();
    console.log('🧹 Cache de AI limpiado');
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      enabled: this.enabled,
      model: this.model
    };
  }

  isEnabled() {
    return this.enabled;
  }
}

// Exportar instancia única
const aiNLP = new AINLP();

module.exports = aiNLP;
