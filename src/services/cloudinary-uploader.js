const cloudinary = require('cloudinary').v2;
const axios = require('axios');

/**
 * Servicio para subir comprobantes de pago a Cloudinary
 */
class CloudinaryUploader {
  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || process.env.VERIFY_TOKEN;
    
    // Configurar Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });

    this.validateConfig();
  }

  /**
   * Validar configuración de Cloudinary
   */
  validateConfig() {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      console.error('❌ CLOUDINARY_CLOUD_NAME no configurado');
    }
    if (!process.env.CLOUDINARY_API_KEY) {
      console.error('❌ CLOUDINARY_API_KEY no configurado');
    }
    if (!process.env.CLOUDINARY_API_SECRET) {
      console.error('❌ CLOUDINARY_API_SECRET no configurado');
    }
    if (!this.accessToken) {
      console.error('❌ WHATSAPP_ACCESS_TOKEN no configurado');
    }
  }

  /**
   * Verificar si Cloudinary está configurado correctamente
   */
  isConfigured() {
    return !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );
  }

  /**
   * Obtener la URL de descarga de un medio de WhatsApp
   * @param {string} mediaId - ID del medio en WhatsApp
   * @returns {Promise<string>} URL temporal de descarga
   */
  async getWhatsAppMediaUrl(mediaId) {
    try {
      const response = await axios.get(
        `https://graph.facebook.com/v18.0/${mediaId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      return response.data.url;
    } catch (error) {
      console.error('❌ Error obteniendo URL del medio de WhatsApp:', error.response?.data || error.message);
      throw new Error('No se pudo obtener la URL del medio de WhatsApp');
    }
  }

  /**
   * Descargar imagen desde WhatsApp como buffer
   * @param {string} mediaUrl - URL del medio en WhatsApp
   * @returns {Promise<Buffer>} Buffer de la imagen
   */
  async downloadWhatsAppMedia(mediaUrl) {
    try {
      const response = await axios.get(mediaUrl, {
        responseType: 'arraybuffer',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      return Buffer.from(response.data);
    } catch (error) {
      console.error('❌ Error descargando medio de WhatsApp:', error.message);
      throw new Error('No se pudo descargar el archivo de WhatsApp');
    }
  }

  /**
   * Subir imagen a Cloudinary desde un buffer
   * @param {Buffer} imageBuffer - Buffer de la imagen
   * @param {string} fileName - Nombre del archivo (sin extensión)
   * @param {string} folder - Carpeta en Cloudinary
   * @returns {Promise<Object>} Resultado de Cloudinary
   */
  async uploadToCloudinary(imageBuffer, fileName, folder = 'payment-receipts') {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          public_id: fileName,
          resource_type: 'image',
          format: 'jpg',
          transformation: [
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
          ],
          tags: ['comprobante', 'pago', 'whatsapp']
        },
        (error, result) => {
          if (error) {
            console.error('❌ Error subiendo a Cloudinary:', error);
            reject(error);
          } else {
            console.log('✅ Imagen subida a Cloudinary exitosamente');
            resolve(result);
          }
        }
      );

      // Escribir el buffer al stream
      uploadStream.end(imageBuffer);
    });
  }

  /**
   * Subir comprobante de pago desde WhatsApp a Cloudinary
   * @param {string} mediaId - ID de la imagen en WhatsApp
   * @param {string} confirmationCode - Código de confirmación de la reserva
   * @returns {Promise<Object>} Información del archivo subido
   */
  async uploadPaymentReceipt(mediaId, confirmationCode) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Cloudinary no está configurado correctamente');
      }

      console.log(`📤 Subiendo comprobante a Cloudinary para reserva ${confirmationCode}...`);

      // 1. Obtener URL del medio en WhatsApp
      const mediaUrl = await this.getWhatsAppMediaUrl(mediaId);
      console.log('🔗 URL del medio de WhatsApp obtenida');

      // 2. Descargar la imagen como buffer
      const imageBuffer = await this.downloadWhatsAppMedia(mediaUrl);
      console.log('📥 Imagen descargada de WhatsApp');

      // 3. Generar nombre único para el archivo
      const timestamp = Date.now();
      const fileName = `${confirmationCode}_${timestamp}`;

      // 4. Subir a Cloudinary
      const cloudinaryResult = await this.uploadToCloudinary(imageBuffer, fileName);

      console.log(`✅ Comprobante subido: ${cloudinaryResult.secure_url}`);

      return {
        success: true,
        url: cloudinaryResult.secure_url,
        publicId: cloudinaryResult.public_id,
        format: cloudinaryResult.format,
        width: cloudinaryResult.width,
        height: cloudinaryResult.height,
        bytes: cloudinaryResult.bytes,
        uploadedAt: new Date(),
        mediaId: mediaId
      };

    } catch (error) {
      console.error('❌ Error en proceso de subida:', error.message);
      return {
        success: false,
        error: error.message,
        mediaId: mediaId
      };
    }
  }

  /**
   * Eliminar un comprobante de Cloudinary
   * @param {string} publicId - Public ID del archivo en Cloudinary
   * @returns {Promise<Object>} Resultado de la eliminación
   */
  async deleteReceipt(publicId) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Cloudinary no está configurado correctamente');
      }

      const result = await cloudinary.uploader.destroy(publicId);
      console.log('🗑️ Comprobante eliminado de Cloudinary:', publicId);
      return result;
    } catch (error) {
      console.error('❌ Error eliminando comprobante:', error.message);
      throw error;
    }
  }

  /**
   * Obtener información de un archivo en Cloudinary
   * @param {string} publicId - Public ID del archivo
   * @returns {Promise<Object>} Información del archivo
   */
  async getResourceInfo(publicId) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Cloudinary no está configurado correctamente');
      }

      const result = await cloudinary.api.resource(publicId);
      return result;
    } catch (error) {
      console.error('❌ Error obteniendo info del recurso:', error.message);
      throw error;
    }
  }

  /**
   * Listar todos los comprobantes en Cloudinary
   * @param {number} maxResults - Número máximo de resultados
   * @returns {Promise<Array>} Lista de archivos
   */
  async listReceipts(maxResults = 50) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Cloudinary no está configurado correctamente');
      }

      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: 'payment-receipts/',
        max_results: maxResults,
        resource_type: 'image'
      });

      return result.resources;
    } catch (error) {
      console.error('❌ Error listando comprobantes:', error.message);
      throw error;
    }
  }

  /**
   * Formatear tamaño de archivo en formato legible
   * @param {number} bytes - Tamaño en bytes
   * @returns {string} Tamaño formateado
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

// Exportar instancia única
module.exports = new CloudinaryUploader();
