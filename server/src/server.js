import http from 'http';
import app from './app.js';
import { connectDB } from './config/db.js';
import { initRedis } from './config/redis.js';
import { initSocket } from './sockets/socketManager.js';
import { initNegotiationQueue } from './queues/negotiationQueue.js';
import { startNegotiationWorker } from './workers/negotiationWorker.js';
import logger from './config/logger.js';

const PORT = process.env.PORT || 8000;

const startServer = async () => {
  try {
    // 0. Fail fast if critical environment variables are missing
    if (!process.env.JWT_SECRET) {
      logger.error('FATAL: JWT_SECRET environment variable is not set. Server cannot start securely.');
      process.exit(1);
    }

    // 1. Connect MongoDB
    await connectDB();

    // 2. Initialize Redis (with graceful fallback)
    initRedis();

    // 3. Create HTTP Server & Initialize WebSockets
    const server = http.createServer(app);
    initSocket(server);

    // 4. Initialize Queue and Worker
    initNegotiationQueue();
    startNegotiationWorker();

    // 5. Start listening
    server.listen(PORT, () => {
      logger.info(`Enterprise Negotiating Budget Agents Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`LLM Provider configured: ${process.env.LLM_PROVIDER || 'groq'}`);
    });

    // Graceful Shutdown
    const shutdown = async () => {
      logger.info('Shutting down server gracefully...');
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error(`Critical error starting server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
