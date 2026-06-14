'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('./config/env');
const apiRoutes = require('./routes');
const mobileRoutes = require('./routes/flutter');
const legacyDashboardRoutes = require('./routes/legacy-dashboard.routes');
const { sanitizeRequest, corsOptions, rateLimit } = require('./middleware/security');
const { deprecated, gone } = require('./middleware/api-lifecycle');
const { notFound, errorHandler } = require('./middleware/error');

function createApp() {
  const app = express();
  app.set('trust proxy', env.trustProxy);
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors(corsOptions()));
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
  app.use(express.json({ limit: '512kb' }));
  app.use(express.urlencoded({ extended: true, limit: '512kb' }));
  app.use(sanitizeRequest);

  const globalLimiter = rateLimit({
    windowMs: env.apiRateLimitWindowMs,
    max: (req) => ['GET', 'HEAD'].includes(req.method)
      ? env.apiRateLimitReadMax
      : env.apiRateLimitWriteMax,
    prefix: 'api-global-all-aliases-v2',
    keyGenerator: (req) => `${req.ip}:${req.method}`,
    skip: (req) => req.method === 'OPTIONS',
  });

  app.get('/health', (_req, res) => res.json({
    status: 'ok',
    api_version: 'v1',
    canonical_base: env.canonicalApiBase,
    timestamp: new Date().toISOString()
  }));

  // The only official public version is /api/v1.
  app.use('/api/v1/mobile', globalLimiter, mobileRoutes);
  app.use('/api/v1', globalLimiter, apiRoutes);

  // Temporary dashboard compatibility endpoints. They are disabled by default
  // in production and, when enabled, use the same centralized security middleware.
  if (env.enableLegacyDashboardRoutes) {
    app.use('/api/v1', globalLimiter, deprecated({ successor: '/api/v1/admin', sunset: env.apiSunsetAt }), legacyDashboardRoutes);
  }

  // Historical aliases never have independent controllers or validation rules.
  // They delegate to the canonical routers and can be retired with one setting.
  const apiAliasRouter = express.Router();
  // `/api` is a historical alias, but it must never intercept an unknown
  // canonical `/api/v1/*` route after the canonical router falls through.
  apiAliasRouter.use((req, _res, next) => {
    if (req.path === '/v1' || req.path.startsWith('/v1/')) return next('router');
    return next();
  });
  if (env.enableApiAlias) {
    apiAliasRouter.use(globalLimiter, deprecated({ successor: '/api/v1', sunset: env.apiSunsetAt }), apiRoutes);
  } else {
    apiAliasRouter.use(gone({ successor: '/api/v1', sunset: env.apiSunsetAt }));
  }
  app.use('/api', apiAliasRouter);

  if (env.enableMobileV1Alias) {
    app.use('/v1', globalLimiter, deprecated({ successor: '/api/v1/mobile', sunset: env.apiSunsetAt }), mobileRoutes);
  } else {
    app.use('/v1', gone({ successor: '/api/v1/mobile', sunset: env.apiSunsetAt }));
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
