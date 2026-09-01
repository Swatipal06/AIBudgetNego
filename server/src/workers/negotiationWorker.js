import { Worker } from 'bullmq';
import { getRedisClient, getIsRedisAvailable } from '../config/redis.js';
import { NegotiationEngine } from '../engine/negotiationEngine.js';
import logger from '../config/logger.js';

let workerInstance = null;

export const startNegotiationWorker = () => {
  if (workerInstance) return workerInstance;

  const redis = getRedisClient();
  if (!redis || !getIsRedisAvailable()) {
    logger.info('BullMQ worker skipped: Redis not active (in-process runner active).');
    return null;
  }

  try {
    workerInstance = new Worker(
      'negotiation-execution',
      async (job) => {
        logger.info(`Worker processing job ${job.id} for negotiation ${job.data.negotiationId}`);
        const result = await NegotiationEngine.runNegotiation(
          job.data.negotiationId,
          job.data.options || {}
        );
        return { success: true, negotiationId: result._id, status: result.status };
      },
      {
        connection: redis,
        concurrency: 5,
      }
    );

    workerInstance.on('completed', (job) => {
      logger.info(`Job ${job.id} completed successfully.`);
    });

    workerInstance.on('failed', (job, err) => {
      logger.error(`Job ${job?.id} failed with error: ${err.message}`);
    });

    logger.info('BullMQ Negotiation Worker started.');
    return workerInstance;
  } catch (err) {
    logger.warn(`Could not start BullMQ worker: ${err.message}`);
    return null;
  }
};
