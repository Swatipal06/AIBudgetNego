import { Server } from 'socket.io';
import { getRedisSub, getRedisPub, getIsRedisAvailable } from '../config/redis.js';
import logger from '../config/logger.js';

let io = null;
const CHANNEL_NAME = 'budget_negotiation_events';

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('join_negotiation', (negotiationId) => {
      socket.join(`negotiation_${negotiationId}`);
      logger.info(`Socket ${socket.id} joined room negotiation_${negotiationId}`);
    });

    socket.on('leave_negotiation', (negotiationId) => {
      socket.leave(`negotiation_${negotiationId}`);
      logger.info(`Socket ${socket.id} left room negotiation_${negotiationId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  // Setup Redis Pub/Sub if available
  const redisSub = getRedisSub();
  if (redisSub && getIsRedisAvailable()) {
    redisSub.subscribe(CHANNEL_NAME, (err) => {
      if (err) {
        logger.error(`Failed to subscribe to Redis channel: ${err.message}`);
      } else {
        logger.info(`Subscribed to Redis channel: ${CHANNEL_NAME}`);
      }
    });

    redisSub.on('message', (channel, message) => {
      if (channel === CHANNEL_NAME) {
        try {
          const parsed = JSON.parse(message);
          const { negotiationId, event, data } = parsed;
          if (io && negotiationId) {
            io.to(`negotiation_${negotiationId}`).emit(event, data);
            io.emit('negotiation_list_update', { negotiationId, event, data });
          }
        } catch (e) {
          logger.error(`Error parsing Redis Pub/Sub message: ${e.message}`);
        }
      }
    });
  }

  return io;
};

export const getIO = () => io;

/**
 * Broadcasts a negotiation event to WebSockets and Redis Pub/Sub
 */
export const broadcastNegotiationEvent = (negotiationId, eventType, data) => {
  const payload = {
    negotiationId: negotiationId.toString(),
    event: eventType,
    data,
    timestamp: new Date().toISOString(),
  };

  // Direct socket emit
  if (io) {
    io.to(`negotiation_${negotiationId}`).emit(eventType, payload.data);
    io.emit('negotiation_list_update', {
      negotiationId: negotiationId.toString(),
      event: eventType,
      status: data?.status || data?.negotiation?.status,
    });
  }

  // Publish to Redis Pub/Sub if available
  const redisPub = getRedisPub();
  if (redisPub && getIsRedisAvailable()) {
    try {
      redisPub.publish(CHANNEL_NAME, JSON.stringify(payload));
    } catch (err) {
      logger.warn(`Redis publish error: ${err.message}`);
    }
  }
};
