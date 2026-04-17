/**
 * MediBuddy CareLink – API Gateway / Main Server
 * Microservices orchestrator via Express
 */

require('dotenv').config();
const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const compression = require('compression');
const rateLimit   = require('express-rate-limit');
const { Server }  = require('socket.io');
const http        = require('http');

const logger = require('./config/logger');
const db     = require('./config/database');

// ── Route Modules ─────────────────────────────────────────────
const authRoutes      = require('./modules/auth/auth.routes');
const userRoutes      = require('./modules/users/user.routes');
const triageRoutes    = require('./modules/triage/triage.routes');
const voiceRoutes     = require('./modules/voice/voice.routes');
const emergencyRoutes = require('./modules/emergency/emergency.routes');
const medicineRoutes  = require('./modules/medicine/medicine.routes');
const messagingRoutes = require('./modules/messaging/messaging.routes');
const mapsRoutes      = require('./modules/maps/maps.routes');
const analyticsRoutes = require('./modules/analytics/analytics.routes');
const notifRoutes     = require('./modules/notifications/notification.routes');
const newVoiceRoutes  = require('./routes/voice.routes');
const doctorRoutes    = require('./routes/doctor.routes');
const reportRoutes    = require('./modules/reports/report.routes');

// ── App Init ──────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || '*', methods: ['GET', 'POST'] }
});

// ── Global Middleware ─────────────────────────────────────────
app.use(helmet());
app.use(compression());
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'https://medibuddy-carelink-frontend.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));

// ── Rate Limiting ─────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts.' },
});
app.use('/api/', globalLimiter);
app.use('/api/auth/', authLimiter);

// ── Health Check ──────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      redis:    'connected',
      voice:    'active',
    },
  });
});

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/triage',        triageRoutes);
app.use('/api/voice',         voiceRoutes);
app.use('/api/emergency',     emergencyRoutes);
app.use('/api/medicine',      medicineRoutes);
app.use('/api/messaging',     messagingRoutes);
app.use('/api/maps',          mapsRoutes);
app.use('/api/analytics',     analyticsRoutes);
app.use('/api/notifications', notifRoutes);
app.use('/api/voice',         newVoiceRoutes); // Overriding or adding to voice
app.use('/api/doctors',       doctorRoutes);
app.use('/api/admin',         doctorRoutes);
app.use('/api/reports',       reportRoutes);

// ── WebSocket – Real-time vitals & messaging ──────────────────
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  socket.on('join-room', ({ userId, role }) => {
    socket.join(`user-${userId}`);
    socket.join(`role-${role}`);
    logger.info(`User ${userId} (${role}) joined room`);
  });

  socket.on('vitals-update', (data) => {
    io.to(`user-${data.caretakerId}`).emit('vitals-data', data);
  });

  socket.on('emergency-sos', (data) => {
    io.to('role-doctor').emit('emergency-alert', data);
    io.to(`user-${data.familyId}`).emit('emergency-alert', data);
    logger.warn(`[EMERGENCY] SOS from user ${data.userId}: ${JSON.stringify(data)}`);
  });

  socket.on('chat-message', (data) => {
    io.to(`user-${data.toUserId}`).emit('chat-message', data);
  });

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// ── Global Error Handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`, { stack: err.stack });
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
});

// ── 404 Handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ── Start Server ──────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
server.listen(PORT, async () => {
  logger.info(`🚀 MediBuddy CareLink API running on port ${PORT}`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  try {
    await db.connectPostgres();
    await db.connectMongo();
    logger.info('✅ Databases connected');
  } catch (err) {
    logger.error('Database connection failed:', err);
  }
});

module.exports = { app, server, io };
