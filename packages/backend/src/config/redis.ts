import { createClient } from 'redis';
import { env } from './env';
import { logger } from '../utils/logger';

export const redis = createClient({
  url: env.redis.url
});

redis.on('error', (err) => {
  logger.error('Redis client error:', err);
});

redis.on('connect', () => {
  logger.info('Redis client connected');
});

redis.on('ready', () => {
  logger.info('Redis client ready');
});

redis.on('reconnecting', () => {
  logger.warn('Redis client reconnecting');
});

// Connect to Redis
export async function connectRedis() {
  try {
    await redis.connect();
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await redis.quit();
});
