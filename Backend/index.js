const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('./config/env');
const connectDatabase = require('./config/database');
const apiRoutes = require('./routes');
const flutterRoutes = require('./routes/flutter.routes');
const legacyDashboardRoutes = require('./routes/legacy-dashboard.routes');
const { sanitizeRequest, corsOptions, rateLimit } = require('./middleware/security');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();
function trustProxy(value) { const raw = String(value || '').toLowerCase(); if (!raw || raw === 'false' || raw === '0') return false; if (raw === 'true' || raw === '1') return 1; return value; }
app.set('trust proxy', trustProxy(env.trustProxy));
app.disable('x-powered-by');
app.use(helmet());
app.use(cors(corsOptions()));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '512kb' }));
app.use(express.urlencoded({ extended: true, limit: '512kb' }));
app.use(sanitizeRequest);
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));
app.use('/v1', rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.use('/v1', flutterRoutes);
// Keep the original dashboard frontend endpoints exactly on /api/v1/* before the newer API router.
app.use('/api/v1', legacyDashboardRoutes);
app.use('/api/v1', apiRoutes);
app.use('/api', apiRoutes);
app.use(notFound);
app.use(errorHandler);

async function bootstrap() { await connectDatabase(); app.listen(env.port, '0.0.0.0', () => console.log(`ADWETY backend listening on 0.0.0.0:${env.port}`)); }
bootstrap().catch((error) => { console.error('Failed to start server:', error.message); process.exit(1); });
