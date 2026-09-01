import mongoose from 'mongoose';
import logger from './logger.js';

let isConnected = false;

export const connectDB = async (uriOverride) => {
  const uri = uriOverride || process.env.MONGODB_URI || 'mongodb://localhost:27017/budget_agents';
  
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true,
    });
    
    isConnected = true;
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err.message}`);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting reconnect...');
      isConnected = false;
    });

    return conn.connection;
  } catch (error) {
    logger.error(`Failed to connect to MongoDB: ${error.message}`);
    if (process.env.NODE_ENV !== 'test') {
      // Don't kill process immediately in dev so app can log clearly
      logger.warn('Running without MongoDB connection or waiting for reconnect.');
    }
    throw error;
  }
};

export const disconnectDB = async () => {
  if (isConnected || mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB disconnected.');
  }
};
