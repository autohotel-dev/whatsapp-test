/**
 * Sistema de Persistencia con MongoDB
 * Guarda conversaciones, analytics, y contexto de usuarios
 */

const mongoose = require('mongoose');

// ============================================
// SCHEMAS
// ============================================

// Esquema de Conversación
const conversationSchema = new mongoose.Schema({
  userPhone: { type: String, required: true, index: true },
  messages: [{
    text: String,
    intent: String,
    confidence: Number,
    timestamp: { type: Date, default: Date.now },
    direction: { type: String, enum: ['incoming', 'outgoing'] },
    messageType: { type: String, enum: ['text', 'image', 'button', 'flow'] }
  }],
  sessionStart: { type: Date, default: Date.now },
  sessionEnd: Date,
  isActive: { type: Boolean, default: true },
  totalMessages: { type: Number, default: 0 },
  leadScore: { type: Number, default: 0 }, // 0-100
  conversionStatus: { 
    type: String, 
    enum: ['new', 'interested', 'reserved', 'abandoned'],
    default: 'new'
  }
}, { timestamps: true });

// Esquema de Analytics Diarias
const dailyAnalyticsSchema = new mongoose.Schema({
  date: { type: Date, required: true, unique: true },
  totalMessages: { type: Number, default: 0 },
  uniqueUsers: { type: Number, default: 0 },
  newUsers: { type: Number, default: 0 },
  returningUsers: { type: Number, default: 0 },
  intentCounts: { type: Map, of: Number },
  errorCount: { type: Number, default: 0 },
  averageConfidence: { type: Number, default: 0 },
  conversionRate: { type: Number, default: 0 },
  peakHours: [Number],
  topIntents: [{ intent: String, count: Number }]
}, { timestamps: true });

// Esquema de Usuario
const userSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true, index: true },
  name: String,
  email: String,
  firstInteraction: { type: Date, default: Date.now },
  lastInteraction: { type: Date, default: Date.now },
  totalConversations: { type: Number, default: 0 },
  totalMessages: { type: Number, default: 0 },
  totalReservations: { type: Number, default: 0 },
  leadScore: { type: Number, default: 0 },
  interests: [String], // habitaciones, precios, servicios
  preferredLanguage: { type: String, default: 'es' },
  segmentation: {
    type: String,
    enum: ['new', 'engaged', 'frequent', 'vip', 'inactive'],
    default: 'new'
  },
  tags: [String],
  notes: String
}, { timestamps: true });

// Esquema de Reservación
const reservationSchema = new mongoose.Schema({
  userPhone: { type: String, required: true, index: true },
  packageType: String, // deseo, enamorados, premium
  roomType: String, // master_suite_sencilla, master_suite_jacuzzi, etc.
  date: Date,
  checkInTime: String, // hora de check-in
  numberOfGuests: Number,
  customerName: String,
  customerEmail: String,
  specialRequests: String,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  source: { type: String, default: 'whatsapp' },
  totalAmount: Number,
  confirmationCode: String
}, { timestamps: true });

// Esquema de Notificaciones
const notificationSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['error', 'warning', 'info', 'success'],
    required: true 
  },
  title: String,
  message: String,
  data: mongoose.Schema.Types.Mixed,
  read: { type: Boolean, default: false },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
}, { timestamps: true });

// Esquema de Feedback
const feedbackSchema = new mongoose.Schema({
  userPhone: { type: String, required: true },
  reservationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation' },
  rating: { type: Number, min: 1, max: 5 },
  comment: String,
  category: String // servicio, limpieza, ubicacion, precio
}, { timestamps: true });

// ============================================
// MODELOS
// ============================================

const Conversation = mongoose.model('Conversation', conversationSchema);
const DailyAnalytics = mongoose.model('DailyAnalytics', dailyAnalyticsSchema);
const User = mongoose.model('User', userSchema);
const Reservation = mongoose.model('Reservation', reservationSchema);
const Notification = mongoose.model('Notification', notificationSchema);
const Feedback = mongoose.model('Feedback', feedbackSchema);

// ============================================
// CLASE DE BASE DE DATOS
// ============================================

class Database {
  constructor() {
    this.connected = false;
    this.connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-luxor';
  }

  // Conectar a MongoDB
  async connect() {
    try {
      if (this.connected) {
        console.log('✅ Ya conectado a MongoDB');
        return;
      }

      await mongoose.connect(this.connectionString);

      this.connected = true;
      console.log('✅ Conectado a MongoDB exitosamente');
      
      // Crear índices
      await this.createIndexes();
    } catch (error) {
      console.error('❌ Error conectando a MongoDB:', error.message);
      console.log('⚠️  Continuando sin persistencia...');
    }
  }

  // Crear índices para optimizar búsquedas
  async createIndexes() {
    try {
      await User.createIndexes();
      await Conversation.createIndexes();
      console.log('✅ Índices creados');
    } catch (error) {
      console.error('⚠️  Error creando índices:', error.message);
    }
  }

  // ============================================
  // MÉTODOS DE CONVERSACIÓN
  // ============================================

  async saveMessage(userPhone, messageData) {
    if (!this.connected) return null;

    try {
      const conversation = await Conversation.findOneAndUpdate(
        { userPhone, isActive: true },
        {
          $push: { messages: messageData },
          $inc: { totalMessages: 1 },
          $set: { 
            lastInteraction: new Date(),
            'user.lastInteraction': new Date()
          }
        },
        { upsert: true, new: true }
      );

      // Actualizar lead score basado en intenciones
      await this.updateLeadScore(userPhone, messageData.intent);

      return conversation;
    } catch (error) {
      console.error('❌ Error guardando mensaje:', error.message);
      return null;
    }
  }

  async getActiveConversation(userPhone) {
    if (!this.connected) return null;
    
    try {
      return await Conversation.findOne({ userPhone, isActive: true });
    } catch (error) {
      console.error('❌ Error obteniendo conversación:', error.message);
      return null;
    }
  }

  async endConversation(userPhone) {
    if (!this.connected) return null;

    try {
      return await Conversation.findOneAndUpdate(
        { userPhone, isActive: true },
        {
          $set: {
            isActive: false,
            sessionEnd: new Date()
          }
        }
      );
    } catch (error) {
      console.error('❌ Error terminando conversación:', error.message);
      return null;
    }
  }

  // ============================================
  // MÉTODOS DE USUARIO
  // ============================================

  async createOrUpdateUser(userPhone, userData = {}) {
    if (!this.connected) return null;

    try {
      const user = await User.findOneAndUpdate(
        { phone: userPhone },
        {
          $set: {
            lastInteraction: new Date(),
            ...userData
          },
          $setOnInsert: {
            phone: userPhone,
            firstInteraction: new Date()
          },
          $inc: { totalMessages: 1 }
        },
        { upsert: true, new: true }
      );

      // Auto-segmentación
      await this.autoSegmentUser(user);

      return user;
    } catch (error) {
      console.error('❌ Error creando/actualizando usuario:', error.message);
      return null;
    }
  }

  async getUserProfile(userPhone) {
    if (!this.connected) return null;

    try {
      const user = await User.findOne({ phone: userPhone });
      const conversations = await Conversation.countDocuments({ userPhone });
      const reservations = await Reservation.countDocuments({ userPhone });

      return {
        ...user?.toObject(),
        totalConversations: conversations,
        totalReservations: reservations
      };
    } catch (error) {
      console.error('❌ Error obteniendo perfil:', error.message);
      return null;
    }
  }

  async autoSegmentUser(user) {
    if (!this.connected || !user) return;

    try {
      let segmentation = 'new';
      
      if (user.totalReservations >= 5) segmentation = 'vip';
      else if (user.totalReservations >= 2) segmentation = 'frequent';
      else if (user.totalMessages >= 10) segmentation = 'engaged';
      else if (user.totalMessages < 2 && 
               (Date.now() - user.lastInteraction) > 7 * 24 * 60 * 60 * 1000) {
        segmentation = 'inactive';
      }

      if (user.segmentation !== segmentation) {
        await User.updateOne(
          { _id: user._id },
          { $set: { segmentation } }
        );
      }
    } catch (error) {
      console.error('❌ Error en auto-segmentación:', error.message);
    }
  }

  async updateLeadScore(userPhone, intent) {
    if (!this.connected) return;

    try {
      const scoreMap = {
        'reservar': 30,
        'precios': 15,
        'habitaciones': 10,
        'paquetes': 10,
        'fotos': 5,
        'servicios': 5,
        'default': -2
      };

      const scoreChange = scoreMap[intent] || 0;
      
      if (scoreChange !== 0) {
        // Obtener usuario actual
        const user = await User.findOne({ phone: userPhone });
        if (user) {
          // Calcular nuevo score con límites
          let newScore = (user.leadScore || 0) + scoreChange;
          newScore = Math.max(0, Math.min(100, newScore)); // Entre 0 y 100
          
          // Actualizar
          await User.findOneAndUpdate(
            { phone: userPhone },
            { $set: { leadScore: newScore } }
          );
        }
      }
    } catch (error) {
      console.error('❌ Error actualizando lead score:', error.message);
    }
  }

  // ============================================
  // MÉTODOS DE ANALYTICS
  // ============================================

  async saveDailyAnalytics(analyticsData) {
    if (!this.connected) return null;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return await DailyAnalytics.findOneAndUpdate(
        { date: today },
        { $set: analyticsData },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error('❌ Error guardando analytics diarias:', error.message);
      return null;
    }
  }

  async getAnalyticsSummary(days = 7) {
    if (!this.connected) return null;

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const analytics = await DailyAnalytics.find({
        date: { $gte: startDate }
      }).sort({ date: -1 });

      return analytics;
    } catch (error) {
      console.error('❌ Error obteniendo analytics:', error.message);
      return null;
    }
  }

  // ============================================
  // MÉTODOS DE RESERVACIÓN
  // ============================================

  async createReservation(reservationData) {
    if (!this.connected) return null;

    try {
      const reservation = new Reservation(reservationData);
      await reservation.save();

      // Actualizar contador de usuario
      await User.findOneAndUpdate(
        { phone: reservationData.userPhone },
        { $inc: { totalReservations: 1 } }
      );

      return reservation;
    } catch (error) {
      console.error('❌ Error creando reservación:', error.message);
      return null;
    }
  }

  async getReservations(userPhone) {
    if (!this.connected) return [];

    try {
      return await Reservation.find({ userPhone }).sort({ createdAt: -1 });
    } catch (error) {
      console.error('❌ Error obteniendo reservaciones:', error.message);
      return [];
    }
  }

  // ============================================
  // MÉTODOS DE NOTIFICACIONES
  // ============================================

  async createNotification(notificationData) {
    if (!this.connected) return null;

    try {
      const notification = new Notification(notificationData);
      await notification.save();
      
      console.log(`🔔 Notificación: ${notificationData.type} - ${notificationData.message}`);
      
      return notification;
    } catch (error) {
      console.error('❌ Error creando notificación:', error.message);
      return null;
    }
  }

  async saveNotification(notificationData) {
    // Alias para createNotification
    return await this.createNotification(notificationData);
  }

  async getUnreadNotifications() {
    if (!this.connected) return [];

    try {
      return await Notification.find({ read: false })
        .sort({ createdAt: -1 })
        .limit(50);
    } catch (error) {
      console.error('❌ Error obteniendo notificaciones:', error.message);
      return [];
    }
  }

  // ============================================
  // MÉTODOS DE FEEDBACK
  // ============================================

  async saveFeedback(feedbackData) {
    if (!this.connected) return null;

    try {
      const feedback = new Feedback(feedbackData);
      return await feedback.save();
    } catch (error) {
      console.error('❌ Error guardando feedback:', error.message);
      return null;
    }
  }

  async getAverageRating(days = 30) {
    if (!this.connected) return null;

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const result = await Feedback.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
      ]);

      return result[0] || { avgRating: 0, count: 0 };
    } catch (error) {
      console.error('❌ Error calculando rating promedio:', error.message);
      return null;
    }
  }

  // ============================================
  // UTILIDADES
  // ============================================

  async disconnect() {
    if (this.connected) {
      await mongoose.disconnect();
      this.connected = false;
      console.log('👋 Desconectado de MongoDB');
    }
  }

  isConnected() {
    return this.connected;
  }
}

// Exportar instancia única
const database = new Database();

module.exports = {
  database,
  models: {
    Conversation,
    DailyAnalytics,
    User,
    Reservation,
    Notification,
    Feedback
  }
};
