const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const port = process.env.PORT || 3000;
const verifyToken = process.env.VERIFY_TOKEN;
const privateKey = process.env.PRIVATE_KEY;

// ✅ MIDDLEWARE DE LOG
app.use((req, res, next) => {
  console.log('🔍 SOLICITUD RECIBIDA:', req.method, req.originalUrl);
  next();
});

// ✅ DESENCRIPTAR REQUEST (igual que el ejemplo de Meta)
function decryptRequest(body, privatePem) {
  const { encrypted_aes_key, encrypted_flow_data, initial_vector } = body;

  try {
    // 1. Desencriptar clave AES con RSA
    const decryptedAesKey = crypto.privateDecrypt(
      {
        key: privatePem,
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
    console.error('❌ Error desencriptando:', error.message);
    throw error;
  }
}

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

// ✅ LÓGICA DEL FLOW (adaptada a tu caso)
function processFlowLogic(decryptedBody) {
  const { screen, data, version, action, flow_token } = decryptedBody;
  
  console.log('🔄 Procesando flow data:', { action, screen, version });

  // Health check
  if (action === "ping") {
    return {
      data: {
        status: "active",
      },
    };
  }

  // Manejar error del cliente
  if (data?.error) {
    console.warn("Error del cliente:", data);
    return {
      data: {
        acknowledged: true,
      },
    };
  }

  // Request inicial cuando se abre el flow
  if (action === "INIT") {
    return {
      screen: "WELCOME_SCREEN",
      data: {
        welcome_message: "¡Bienvenido!",
        instructions: "Selecciona una opción para continuar",
        options: ["Opción 1", "Opción 2", "Opción 3"],
        timestamp: new Date().toISOString()
      },
    };
  }

  // Intercambio de datos
  if (action === "data_exchange") {
    switch (screen) {
      case "WELCOME_SCREEN":
        // Procesar selección del usuario
        const selectedOption = data?.selected_option;
        
        if (!selectedOption) {
          return {
            screen: "WELCOME_SCREEN",
            data: {
              error_message: "Por favor selecciona una opción",
              options: ["Opción 1", "Opción 2", "Opción 3"],
              timestamp: new Date().toISOString()
            }
          };
        }

        return {
          screen: "DETAILS_SCREEN",
          data: {
            selected_option: selectedOption,
            message: `Has seleccionado: ${selectedOption}`,
            input_fields: ["nombre", "email"],
            timestamp: new Date().toISOString()
          },
        };

      case "DETAILS_SCREEN":
        // Finalizar el flow
        return {
          screen: "SUCCESS",
          data: {
            extension_message_response: {
              params: {
                flow_token: flow_token,
                result: "Proceso completado exitosamente",
                user_data: data,
                timestamp: new Date().toISOString()
              },
            },
          },
        };

      default:
        console.error("Screen no manejado:", screen);
        return {
          screen: "WELCOME_SCREEN",
          data: {
            error_message: "Screen no reconocido",
            timestamp: new Date().toISOString()
          }
        };
    }
  }

  // Action BACK
  if (action === "BACK") {
    return {
      screen: "WELCOME_SCREEN",
      data: {
        welcome_message: "Has regresado al inicio",
        options: ["Opción 1", "Opción 2", "Opción 3"],
        timestamp: new Date().toISOString()
      },
    };
  }

  console.error("Action no manejado:", action);
  throw new Error(`Action no manejado: ${action}`);
}

// ✅ RUTA PRINCIPAL
app.post('/webhook', (req, res) => {
  console.log('🟢 POST /webhook - Flow request recibido');
  
  try {
    const { encrypted_flow_data, encrypted_aes_key, initial_vector } = req.body;
    
    if (!encrypted_flow_data || !encrypted_aes_key || !initial_vector) {
      console.log('❌ Faltan campos requeridos');
      return res.status(421).send('MISSING_REQUIRED_FIELDS');
    }

    console.log('📦 Parámetros recibidos');
    console.log('   - encrypted_flow_data:', encrypted_flow_data.substring(0, 50) + '...');
    console.log('   - encrypted_aes_key:', encrypted_aes_key.substring(0, 50) + '...');
    console.log('   - initial_vector:', initial_vector);

    // 1. Desencriptar request
    const { decryptedBody, aesKeyBuffer, initialVectorBuffer } = decryptRequest(req.body, privateKey);
    
    console.log('📦 Flow data desencriptado:', decryptedBody);

    // 2. Procesar lógica del flow
    const screenResponse = processFlowLogic(decryptedBody);
    console.log('🎯 Response a enviar:', screenResponse);

    // 3. Encriptar y enviar response
    const encryptedResponse = encryptResponse(screenResponse, aesKeyBuffer, initialVectorBuffer);
    
    console.log('📤 ENVIANDO RESPUESTA ENCRIPTADA');
    res.status(200).send(encryptedResponse);
    
  } catch (error) {
    console.error('💥 Error crítico:', error.message);
    
    if (error.message.includes('decrypt')) {
      return res.status(421).send('DECRYPTION_FAILED');
    }
    
    res.status(500).send('INTERNAL_SERVER_ERROR');
  }
});

// ✅ VERIFICACIÓN DEL WEBHOOK
app.get('/webhook', (req, res) => {
  console.log('🔵 GET /webhook - Verificación');
  
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('✅ VERIFICACIÓN EXITOSA');
    return res.status(200).send(challenge);
  }

  console.log('❌ Verificación fallida');
  res.status(403).send('VERIFICATION_FAILED');
});

// ✅ HEALTH CHECK
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Meta Flows Webhook',
    version: '1.0',
    timestamp: new Date().toISOString()
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log('🚀 ==================================');
  console.log('🚀 META FLOWS WEBHOOK - CORREGIDO');
  console.log('🚀 ==================================');
  console.log(`✅ Servidor ejecutándose en puerto ${port}`);
  console.log(`✅ Webhook: /webhook`);
  console.log(`✅ Usando AES-GCM (oficial de Meta)`);
  console.log('🚀 ==================================');
});