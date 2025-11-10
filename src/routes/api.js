// api.js - Rutas API para Dashboard
const express = require('express');
const router = express.Router();
const { database, models } = require('../modules/database/database');

// ============================================
// 🏨 RESERVAS
// ============================================

// Obtener todas las reservas con filtros
router.get('/reservations', async (req, res) => {
  try {
    const { status, startDate, endDate, package: packageType, limit = 50, offset = 0 } = req.query;
    
    const query = {};
    
    if (status) query.status = status;
    if (packageType) query.packageType = packageType;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const reservations = await models.Reservation
      .find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));
    
    const total = await models.Reservation.countDocuments(query);
    
    res.json({
      success: true,
      total,
      count: reservations.length,
      reservations
    });
  } catch (error) {
    console.error('Error obteniendo reservas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener reservas de un usuario específico
router.get('/reservations/user/:phone', async (req, res) => {
  try {
    const phone = req.params.phone;
    
    const reservations = await models.Reservation
      .find({ 
        $or: [
          { userPhone: phone },
          { userPhone: phone.replace('521', '') },
          { userPhone: '521' + phone }
        ]
      })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      total: reservations.length,
      reservations
    });
  } catch (error) {
    console.error('Error obteniendo reservas del usuario:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener detalles de una reserva
router.get('/reservations/:id', async (req, res) => {
  try {
    const reservation = await models.Reservation.findById(req.params.id);
    
    if (!reservation) {
      return res.status(404).json({ success: false, error: 'Reserva no encontrada' });
    }
    
    res.json({ success: true, reservation });
  } catch (error) {
    console.error('Error obteniendo reserva:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Actualizar estado de reserva
router.put('/reservations/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending_payment', 'payment_received', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Estado inválido' });
    }
    
    const reservation = await models.Reservation.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!reservation) {
      return res.status(404).json({ success: false, error: 'Reserva no encontrada' });
    }
    
    res.json({ success: true, reservation });
  } catch (error) {
    console.error('Error actualizando reserva:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Estadísticas de reservas
router.get('/reservations/stats', async (req, res) => {
  try {
    const total = await models.Reservation.countDocuments();
    
    // Contar por estado
    const byStatus = await models.Reservation.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Contar por paquete
    const byPackage = await models.Reservation.aggregate([
      { $group: { _id: '$packageType', count: { $sum: 1 } } }
    ]);
    
    // Contar por habitación
    const byRoom = await models.Reservation.aggregate([
      { $group: { _id: '$roomType', count: { $sum: 1 } } }
    ]);
    
    // Revenue total y promedio
    const revenue = await models.Reservation.aggregate([
      { 
        $match: { status: { $in: ['confirmed', 'completed'] } }
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: '$totalAmount' },
          average: { $avg: '$totalAmount' }
        } 
      }
    ]);
    
    res.json({
      success: true,
      stats: {
        total,
        byStatus: byStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byPackage: byPackage.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byRoom: byRoom.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        totalRevenue: revenue[0]?.total || 0,
        averageAmount: Math.round(revenue[0]?.average || 0)
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// 👥 USUARIOS
// ============================================

// Obtener todos los usuarios
router.get('/users', async (req, res) => {
  try {
    const { segmentation, limit = 50, offset = 0 } = req.query;
    
    const query = {};
    if (segmentation) query.segmentation = segmentation;
    
    const users = await models.User
      .find(query)
      .sort({ lastInteraction: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));
    
    const total = await models.User.countDocuments(query);
    
    res.json({
      success: true,
      total,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener usuario específico
router.get('/users/:phone', async (req, res) => {
  try {
    const phone = req.params.phone;
    
    const user = await models.User.findOne({
      $or: [
        { phone: phone },
        { phone: phone.replace('521', '') },
        { phone: '521' + phone }
      ]
    });
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }
    
    // Obtener reservas del usuario
    const reservations = await models.Reservation.find({ userPhone: user.phone });
    
    res.json({
      success: true,
      user,
      reservations
    });
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Estadísticas de usuarios
router.get('/users/stats', async (req, res) => {
  try {
    const total = await models.User.countDocuments();
    
    // Por segmentación
    const bySegmentation = await models.User.aggregate([
      { $group: { _id: '$segmentation', count: { $sum: 1 } } }
    ]);
    
    // Lead score promedio
    const avgLeadScore = await models.User.aggregate([
      { $group: { _id: null, average: { $avg: '$leadScore' } } }
    ]);
    
    res.json({
      success: true,
      stats: {
        total,
        bySegmentation: bySegmentation.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        averageLeadScore: Math.round(avgLeadScore[0]?.average || 0)
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas de usuarios:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// 💬 MENSAJES
// ============================================

// Obtener mensajes de un usuario
router.get('/messages/user/:phone', async (req, res) => {
  try {
    const phone = req.params.phone;
    const { limit = 100 } = req.query;
    
    const messages = await models.Message
      .find({ userPhone: phone })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      total: messages.length,
      messages
    });
  } catch (error) {
    console.error('Error obteniendo mensajes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Estadísticas de mensajes
router.get('/messages/stats', async (req, res) => {
  try {
    const total = await models.Message.countDocuments();
    
    // Por dirección
    const byDirection = await models.Message.aggregate([
      { $group: { _id: '$direction', count: { $sum: 1 } } }
    ]);
    
    // Por intención
    const byIntent = await models.Message.aggregate([
      { $group: { _id: '$intent', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    res.json({
      success: true,
      stats: {
        total,
        byDirection: byDirection.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        topIntents: byIntent
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas de mensajes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// 🔔 NOTIFICACIONES
// ============================================

// Obtener todas las notificaciones
router.get('/notifications', async (req, res) => {
  try {
    const { type, limit = 50 } = req.query;
    
    const query = {};
    if (type) query.type = type;
    
    const notifications = await models.Notification
      .find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      total: notifications.length,
      notifications
    });
  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener notificaciones no leídas
router.get('/notifications/unread', async (req, res) => {
  try {
    const notifications = await models.Notification
      .find({ read: false })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({
      success: true,
      total: notifications.length,
      notifications
    });
  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Marcar notificación como leída
router.put('/notifications/:id/read', async (req, res) => {
  try {
    const notification = await models.Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notificación no encontrada' });
    }
    
    res.json({ success: true, notification });
  } catch (error) {
    console.error('Error actualizando notificación:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// 📊 DASHBOARD Y ANALYTICS
// ============================================

// Resumen completo para dashboard
router.get('/dashboard/summary', async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Reservas de hoy, semana, mes
    const [todayReservations, weekReservations, monthReservations] = await Promise.all([
      models.Reservation.countDocuments({ createdAt: { $gte: startOfToday } }),
      models.Reservation.countDocuments({ createdAt: { $gte: startOfWeek } }),
      models.Reservation.countDocuments({ createdAt: { $gte: startOfMonth } })
    ]);
    
    // Usuarios nuevos
    const [todayUsers, weekUsers, monthUsers] = await Promise.all([
      models.User.countDocuments({ firstInteraction: { $gte: startOfToday } }),
      models.User.countDocuments({ firstInteraction: { $gte: startOfWeek } }),
      models.User.countDocuments({ firstInteraction: { $gte: startOfMonth } })
    ]);
    
    // Revenue
    const [todayRevenue, weekRevenue, monthRevenue] = await Promise.all([
      models.Reservation.aggregate([
        { $match: { createdAt: { $gte: startOfToday }, status: { $in: ['confirmed', 'completed'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      models.Reservation.aggregate([
        { $match: { createdAt: { $gte: startOfWeek }, status: { $in: ['confirmed', 'completed'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      models.Reservation.aggregate([
        { $match: { createdAt: { $gte: startOfMonth }, status: { $in: ['confirmed', 'completed'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);
    
    // Paquete y habitación más popular
    const topPackage = await models.Reservation.aggregate([
      { $group: { _id: '$packageType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);
    
    const topRoom = await models.Reservation.aggregate([
      { $group: { _id: '$roomType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);
    
    // Tasa de conversión
    const totalUsers = await models.User.countDocuments();
    const totalReservations = await models.Reservation.countDocuments({ status: { $in: ['confirmed', 'completed'] } });
    const conversionRate = totalUsers > 0 ? ((totalReservations / totalUsers) * 100).toFixed(2) : 0;
    
    res.json({
      success: true,
      summary: {
        today: {
          reservations: todayReservations,
          newUsers: todayUsers,
          revenue: todayRevenue[0]?.total || 0
        },
        week: {
          reservations: weekReservations,
          newUsers: weekUsers,
          revenue: weekRevenue[0]?.total || 0
        },
        month: {
          reservations: monthReservations,
          newUsers: monthUsers,
          revenue: monthRevenue[0]?.total || 0
        },
        topPackage: topPackage[0]?._id || 'N/A',
        topRoom: topRoom[0]?._id || 'N/A',
        conversionRate: parseFloat(conversionRate)
      }
    });
  } catch (error) {
    console.error('Error obteniendo resumen:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Métricas en tiempo real
router.get('/analytics/realtime', async (req, res) => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const [recentMessages, pendingReservations] = await Promise.all([
      models.Message.countDocuments({ createdAt: { $gte: fiveMinutesAgo } }),
      models.Reservation.countDocuments({ status: 'pending_payment' })
    ]);
    
    res.json({
      success: true,
      realtime: {
        messagesLast5Min: recentMessages,
        pendingReservations,
        systemStatus: 'healthy',
        dbConnected: database.isConnected(),
        uptime: process.uptime(),
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Error obteniendo métricas en tiempo real:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// 🔍 BÚSQUEDA
// ============================================

// Búsqueda global
router.get('/search', async (req, res) => {
  try {
    const { q, type = 'all', limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({ success: false, error: 'Query requerido' });
    }
    
    const results = {};
    
    // Buscar usuarios
    if (type === 'all' || type === 'users') {
      results.users = await models.User.find({
        $or: [
          { phone: { $regex: q, $options: 'i' } },
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } }
        ]
      }).limit(parseInt(limit));
    }
    
    // Buscar reservas
    if (type === 'all' || type === 'reservations') {
      results.reservations = await models.Reservation.find({
        $or: [
          { userPhone: { $regex: q, $options: 'i' } },
          { customerName: { $regex: q, $options: 'i' } },
          { confirmationCode: { $regex: q, $options: 'i' } }
        ]
      }).limit(parseInt(limit));
    }
    
    res.json({
      success: true,
      query: q,
      results
    });
  } catch (error) {
    console.error('Error en búsqueda:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
