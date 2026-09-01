import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import negotiationRoutes from './routes/negotiationRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import logger from './config/logger.js';

dotenv.config();

const app = express();

// Security & Parsing Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logging Middleware
app.use((req, res, next) => {
  if (req.path !== '/api/health') {
    logger.info(`HTTP ${req.method} ${req.originalUrl}`);
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'negotiating-budget-agents-api',
    environment: process.env.NODE_ENV || 'development',
    aiProvider: process.env.LLM_PROVIDER || 'groq',
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/negotiations', negotiationRoutes);
app.use('/api/departments', departmentRoutes);

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found`,
  });
});

// Centralized Error Handler
app.use(errorHandler);

export default app;
