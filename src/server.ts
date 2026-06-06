import { createApp } from './app';
import { env } from './config/env';
import { startWorkers } from './workers';
import logger from './config/logger';
import { prisma } from './config/prisma';
import { redis } from './config/redis';
import { stopWorkers } from './workers/shutdown';

const app = createApp();
startWorkers();

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Shiftlink API listening');
});

// Graceful shutdown
function shutdown(signal: string) {
  logger.info({ signal }, `Received ${signal}, starting graceful shutdown...`);

  server.close(async (err) => {
    if (err) {
      logger.error({ err }, 'Error during server close');
    }

    try {
      await stopWorkers();
      logger.info('Workers stopped');
    } catch (workerErr) {
      logger.error({ err: workerErr }, 'Error stopping workers');
    }

    try {
      await prisma.$disconnect();
      logger.info('Database disconnected');
    } catch (dbErr) {
      logger.error({ err: dbErr }, 'Error disconnecting database');
    }

    try {
      redis.disconnect();
      logger.info('Redis disconnected');
    } catch (redisErr) {
      logger.error({ err: redisErr }, 'Error disconnecting Redis');
    }

    logger.info('Graceful shutdown complete');
    process.exit(err ? 1 : 0);
  });

  // Force shutdown after 30s
  setTimeout(() => {
    logger.error('Forced shutdown after 30s timeout');
    process.exit(1);
  }, 30000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
