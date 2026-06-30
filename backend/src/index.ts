import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from './config/index.js';
import { authRouter } from './modules/auth/routes.js';
import { usersRouter } from './modules/users/routes.js';
import { rolesRouter } from './modules/roles/routes.js';
import { permissionsRouter } from './modules/permissions/routes.js';
import { positionsRouter } from './modules/positions/routes.js';
import { unitsRouter } from './modules/units/routes.js';
import { settingsRouter } from './modules/settings/routes.js';
import { logsRouter } from './modules/logs/routes.js';
import { menusRouter } from './modules/menus/routes.js';
import { whatsappRouter } from './modules/whatsapp/routes.js';
import { whatsappService } from './modules/whatsapp/service.js';
import { jadwalPimpinanRouter } from './modules/jadwal_pimpinan/routes.js';
import { pegawaiRouter } from './modules/pegawai/routes.js';
import { skPerhutananRouter } from './modules/sk_perhutanan/routes.js';
import { provinsiRouter } from './modules/provinsi/routes.js';
import { kabkotaRouter } from './modules/kabkota/routes.js';
import { skemaRouter } from './modules/skema/routes.js';

const app = express();

// Security middleware - disable some for uploads
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files with CORS
app.use('/uploads', (_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}, express.static(path.join(process.cwd(), 'uploads')));

// Rate limiting - only in production
const isProd = config.nodeEnv === 'production';

if (isProd) {
  app.use('/api/', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests, please try again later.' },
  }));

  app.use('/api/auth/', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Too many authentication attempts, please try again later.' },
  }));
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/roles', rolesRouter);
app.use('/api/permissions', permissionsRouter);
app.use('/api/positions', positionsRouter);
app.use('/api/units', unitsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/logs', logsRouter);
app.use('/api/menus', menusRouter);
app.use('/api/whatsapp', whatsappRouter);
app.use('/api/jadwal-pimpinan', jadwalPimpinanRouter);
app.use('/api/pegawai', pegawaiRouter);
app.use('/api/sk-perhutanan', skPerhutananRouter);
app.use('/api/provinsi', provinsiRouter);
app.use('/api/kabkota', kabkotaRouter);
app.use('/api/skema', skemaRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(config.port, async () => {
  console.log(`🚀 Server running on http://localhost:${config.port}`);
  console.log(`📦 Environment: ${config.nodeEnv}`);

  // Reconnect WhatsApp sessions
  await whatsappService.initializeSessions();
});

export default app;
