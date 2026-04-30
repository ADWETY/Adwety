const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');

const connectDatabase = require('./DB/connection');
const env = require('./src/config/env');
const registerRoutes = require('./src/Modules');
const { notFoundHandler, globalErrorHandler } = require('./src/utils/error-handling');
const { corsOptions, apiLimiter, sanitizeRequest } = require('./src/middleware/security');

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'same-site' },
  contentSecurityPolicy: env.nodeEnv === 'production' ? undefined : false,
}));
app.use(cors(corsOptions()));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(sanitizeRequest);
app.use('/api/v1', apiLimiter);

app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'ADWETY backend is running securely',
    environment: env.nodeEnv,
    ai_provider: env.aiProvider,
    port: env.port,
  });
});

registerRoutes(app);
app.use(notFoundHandler);
app.use(globalErrorHandler);

async function bootstrap() {
  await connectDatabase();
  app.listen(env.port, () => {
    console.log(`ADWETY backend listening on http://localhost:${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});
