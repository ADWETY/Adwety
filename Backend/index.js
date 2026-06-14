'use strict';

const env = require('./config/env');
const connectDatabase = require('./config/database');
const { createApp } = require('./app');
const { getClient, closeRedis } = require('./services/redis.service');
const { ensureRetailIndexes } = require('./services/retail-indexes.service');

async function bootstrap() {
  await connectDatabase();
  await ensureRetailIndexes();
  await getClient();
  const app = createApp();
  const server = app.listen(env.port, '0.0.0.0', () => {
    console.log(`ADWETY backend listening on 0.0.0.0:${env.port}; canonical API: ${env.canonicalApiBase}`);
  });
  const shutdown = async (signal) => {
    console.log(`${signal} received; shutting down safely`);
    server.close(async () => {
      await closeRedis().catch(() => null);
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

if (require.main === module) {
  bootstrap().catch((error) => {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  });
}

module.exports = { bootstrap };
