import { Redis } from 'ioredis';
import logger from './logger.js';

let redisClient = null;
let redisPub = null;
let redisSub = null;
let isRedisAvailable = false;

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const initRedis = () => {
  if (redisClient) return { redisClient, redisPub, redisSub, isRedisAvailable };

  try {
    const opts = {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy: (times) => {
        if (times > 3) {
          logger.warn(`Redis connection failed after ${times} attempts. Operating with in-process event bus.`);
          return null; // stop retrying
        }
        return Math.min(times * 100, 2000);
      },
    };

    redisClient = new Redis(redisUrl, opts);
    redisPub = new Redis(redisUrl, opts);
    redisSub = new Redis(redisUrl, opts);

    redisClient.on('connect', () => {
      isRedisAvailable = true;
      logger.info(`Redis Connected to ${redisUrl.replace(/:[^:@]+@/, ':***@')}`);
    });

    redisClient.on('error', (err) => {
      isRedisAvailable = false;
      logger.warn(`Redis client error: ${err.message}. Graceful fallback active.`);
    });

    redisPub.on('error', (err) => {
      logger.warn(`Redis publisher error: ${err.message}`);
    });

    redisSub.on('error', (err) => {
      logger.warn(`Redis subscriber error: ${err.message}`);
    });
  } catch (error) {
    logger.warn(`Could not initialize Redis: ${error.message}. In-memory mode active.`);
    isRedisAvailable = false;
  }

  return { redisClient, redisPub, redisSub, isRedisAvailable };
};

export const getRedisClient = () => redisClient;
export const getRedisPub = () => redisPub;
export const getRedisSub = () => redisSub;
export const getIsRedisAvailable = () => isRedisAvailable;
