/**
 * Sistema de Notificaciones y Alertas
 * Email, Webhooks, y notificaciones en tiempo real
 */

const nodemailer = require('nodemailer');
const axios = require('axios');

class NotificationSystem {
  constructor() {
    this.emailEnabled = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
    this.webhookEnabled = !!process.env.NOTIFICATION_WEBHOOK;
    this.slackEnabled = !!process.env.SLACK_WEBHOOK;
    
    // Configurar transportador de email
    if (this.emailEnabled) {
      this.transporter = nodemailer.createTransporter({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      console.log('✅ Sistema de email habilitado');
    } else {
      console.log('⚠️  Email no configurado');
    }

    // Thresholds para alertas
    this.thresholds = {
      errorRate: 5, // %
      responseTime: 5000, // ms
      concurrentUsers: 50,
      lowConfidenceRate: 30 // %
    };

    // Cola de notificaciones
    this.notificationQueue = [];
    this.processing = false;
  }

  // ============================================
  // ALERTAS AUTOMÁTICAS
  // ============================================

  async checkAndAlert(analytics) {
    const alerts = [];

    // Alert: Alta tasa de errores
    if (analytics.errorRate > this.thresholds.errorRate) {
      alerts.push({
        type: 'error',
        title: '⚠️ Alta Tasa de Errores',
        message: `La tasa de errores es ${analytics.errorRate}% (límite: ${this.thresholds.errorRate}%)`,
        priority: 'high',
        data: { errorRate: analytics.errorRate }
      });
    }

    // Alert: Muchos usuarios simultáneos
    if (analytics.activeUsers > this.thresholds.concurrentUsers) {
      alerts.push({
        type: 'warning',
        title: '👥 Alto Tráfico',
        message: `${analytics.activeUsers} usuarios activos simultáneamente`,
        priority: 'medium',
        data: { activeUsers: analytics.activeUsers }
      });
    }

    // Enviar alertas
    for (const alert of alerts) {
      await this.send(alert);
    }

    return alerts;
  }

  // ============================================
  // ENVIAR NOTIFICACIÓN
  // ============================================

  async send(notification) {
    this.notificationQueue.push({
      ...notification,
      timestamp: new Date()
    });

    if (!this.processing) {
      await this.processQueue();
    }
  }

  async processQueue() {
    this.processing = true;

    while (this.notificationQueue.length > 0) {
      const notification = this.notificationQueue.shift();

      try {
        // Enviar por todos los canales disponibles
        await Promise.allSettled([
          this.sendEmail(notification),
          this.sendSlack(notification),
          this.sendWebhook(notification)
        ]);

        console.log(`🔔 Notificación enviada: ${notification.title}`);
      } catch (error) {
        console.error('❌ Error enviando notificación:', error.message);
      }

      // Pequeño delay entre notificaciones
      await this.delay(500);
    }

    this.processing = false;
  }

  // ============================================
  // EMAIL
  // ============================================

  async sendEmail(notification) {
    if (!this.emailEnabled) return;

    try {
      const emailConfig = {
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
        subject: `[Auto Hotel Luxor] ${notification.title}`,
        html: this.buildEmailTemplate(notification)
      };

      await this.transporter.sendMail(emailConfig);
      console.log('📧 Email enviado');
    } catch (error) {
      console.error('❌ Error enviando email:', error.message);
    }
  }

  buildEmailTemplate(notification) {
    const priorityColors = {
      low: '#4CAF50',
      medium: '#FF9800',
      high: '#F44336'
    };

    const color = priorityColors[notification.priority] || '#2196F3';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${color}; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
          .data { background: white; padding: 15px; border-radius: 5px; margin-top: 15px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>${notification.title}</h2>
          </div>
          <div class="content">
            <p><strong>Tipo:</strong> ${notification.type}</p>
            <p><strong>Prioridad:</strong> ${notification.priority}</p>
            <p><strong>Mensaje:</strong></p>
            <p>${notification.message}</p>
            
            ${notification.data ? `
              <div class="data">
                <strong>Datos adicionales:</strong>
                <pre>${JSON.stringify(notification.data, null, 2)}</pre>
              </div>
            ` : ''}
            
            <p><strong>Fecha:</strong> ${new Date(notification.timestamp).toLocaleString('es-MX')}</p>
          </div>
          <div class="footer">
            <p>Auto Hotel Luxor - Sistema de Chatbot</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // ============================================
  // SLACK
  // ============================================

  async sendSlack(notification) {
    if (!this.slackEnabled) return;

    try {
      const priorityEmojis = {
        low: ':white_check_mark:',
        medium: ':warning:',
        high: ':rotating_light:'
      };

      const emoji = priorityEmojis[notification.priority] || ':bell:';

      await axios.post(process.env.SLACK_WEBHOOK, {
        text: `${emoji} *${notification.title}*`,
        attachments: [{
          color: notification.type === 'error' ? 'danger' : 'warning',
          fields: [
            { title: 'Mensaje', value: notification.message, short: false },
            { title: 'Prioridad', value: notification.priority, short: true },
            { title: 'Tipo', value: notification.type, short: true }
          ],
          footer: 'Auto Hotel Luxor Bot',
          ts: Math.floor(notification.timestamp / 1000)
        }]
      });

      console.log('💬 Slack notificado');
    } catch (error) {
      console.error('❌ Error enviando a Slack:', error.message);
    }
  }

  // ============================================
  // WEBHOOK GENÉRICO
  // ============================================

  async sendWebhook(notification) {
    if (!this.webhookEnabled) return;

    try {
      await axios.post(process.env.NOTIFICATION_WEBHOOK, {
        event: 'notification',
        data: notification
      }, {
        timeout: 5000
      });

      console.log('🔗 Webhook enviado');
    } catch (error) {
      console.error('❌ Error enviando webhook:', error.message);
    }
  }

  // ============================================
  // NOTIFICACIONES ESPECÍFICAS
  // ============================================

  async notifyNewReservation(reservationData) {
    await this.send({
      type: 'success',
      title: '🎉 Nueva Reservación',
      message: `Reserva de ${reservationData.roomType} para ${reservationData.numberOfGuests} personas`,
      priority: 'high',
      data: reservationData
    });
  }

  async notifyHighValueLead(userPhone, leadScore) {
    if (leadScore >= 70) {
      await this.send({
        type: 'info',
        title: '💎 Lead de Alto Valor',
        message: `Usuario ${userPhone} tiene un lead score de ${leadScore}`,
        priority: 'medium',
        data: { userPhone, leadScore }
      });
    }
  }

  async notifySystemError(errorData) {
    await this.send({
      type: 'error',
      title: '❌ Error del Sistema',
      message: errorData.message,
      priority: 'high',
      data: errorData
    });
  }

  async notifyLowConfidence(userPhone, message, confidence) {
    await this.send({
      type: 'warning',
      title: '🤔 Mensaje No Comprendido',
      message: `Usuario ${userPhone}: "${message}" (confianza: ${(confidence * 100).toFixed(1)}%)`,
      priority: 'low',
      data: { userPhone, message, confidence }
    });
  }

  async notifyDailySummary(analytics) {
    await this.send({
      type: 'info',
      title: '📊 Resumen Diario',
      message: `Mensajes: ${analytics.totalMessages} | Usuarios: ${analytics.totalUsers} | Conversión: ${analytics.conversionRate}%`,
      priority: 'low',
      data: analytics
    });
  }

  // ============================================
  // UTILIDADES
  // ============================================

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getQueueSize() {
    return this.notificationQueue.length;
  }

  getStatus() {
    return {
      emailEnabled: this.emailEnabled,
      slackEnabled: this.slackEnabled,
      webhookEnabled: this.webhookEnabled,
      queueSize: this.notificationQueue.length,
      processing: this.processing
    };
  }
}

// Exportar instancia única
const notificationSystem = new NotificationSystem();

module.exports = notificationSystem;
