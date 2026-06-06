import IORedis from 'ioredis';
import { env } from './env';
import logger from './logger';

export const redis = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    if (times > 10) {
      logger.error('Redis: max reconnection attempts reached (10), giving up.');
      return null; // stop retrying
    }
    const delay = Math.min(times * 200, 5000);
    logger.warn(`Redis: retrying connection in ${delay}ms (attempt ${times})`);
    return delay;
  },
  reconnectOnError(err) {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true; // reconnect on READONLY errors (e.g. Redis failover)
    }
    return false;
  },
  lazyConnect: false,
});

redis.on('connect', () => {
  logger.info('Redis: connected');
});

redis.on('ready', () => {
  logger.info('Redis: ready');
});

redis.on('error', (err) => {
  logger.error({ err }, 'Redis: error');
});

redis.on('close', () => {
  logger.warn('Redis: connection closed');
});

redis.on('reconnecting', () => {
  logger.warn('Redis: reconnecting...');
});

export default redis;
