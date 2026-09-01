import { Queue } from 'bullmq';
import { getRedisClient, getIsRedisAvailable } from '../config/redis.js';
import { NegotiationEngine } from '../engine/negotiationEngine.js';
import logger from '../config/logger.js';

let negotiationQueue = null;

export const initNegotiationQueue = () => {
  if (negotiationQueue) return negotiationQueue;

  const redis = getRedisClient();
  const redisAvailable = getIsRedisAvailable();

  if (redisAvailable && redis) {
    try {
      negotiationQueue = new Queue('negotiation-execution', {
        connection: redis,
        defaultJobOptions: {
          attempts: 2,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      });
      logger.info('BullMQ Negotiation Queue initialized with Redis.');
    } catch (err) {
      logger.warn(`Failed to initialize BullMQ queue: ${err.message}. Using in-process worker.`);
      negotiationQueue = null;
    }
  } else {
    logger.info('Redis not connected. Running negotiations via in-process async worker.');
  }

  return negotiationQueue;
};

/**
 * Enqueues a negotiation job or runs it immediately in-process if Redis is unavailable
 * 
 * @param {string} negotiationId 
 * @param {Object} options 
 */
export const addNegotiationJob = async (negotiationId, options = {}) => {
  const queue = negotiationQueue || initNegotiationQueue();

  if (queue && getIsRedisAvailable()) {
    const job = await queue.add(
      'run-negotiation',
      { negotiationId, options },
      { jobId: `negotiation_${negotiationId}` }
    );
    logger.info(`Negotiation job enqueued: ${job.id} for negotiation: ${negotiationId}`);
    return { jobId: job.id, mode: 'bullmq' };
  } else {
    // Graceful asynchronous in-process execution
    logger.info(`Executing negotiation ${negotiationId} asynchronously in-process.`);
    setImmediate(async () => {
      try {
        await NegotiationEngine.runNegotiation(negotiationId, options);
      } catch (err) {
        logger.error(`In-process negotiation execution failed: ${err.message}`);
      }
    });
    return { jobId: `in_process_${Date.now()}`, mode: 'in_process' };
  }
};
