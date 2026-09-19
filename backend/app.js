/**
 * Express Application Configuration
 * Sets up core middlewares (Helmet, CORS, body parsers, logging), route handlers,
 * rate limiters, proxy request endpoint, and global error handling.
 */

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import logger from './utils/logger.js';
import errorHandler from './middlewares/errorHandlerMiddleware.js';
import { authRateLimiter, apiRateLimiter } from './middlewares/rateLimiterMiddleware.js';
import authRoutes from './routes/authRoute.js';
import historyRoutes from './routes/historyRoute.js';
import aiRoutes from './routes/aiRoute.js';
import { proxyRequestHandler } from './controllers/requestController.js';
import { requestProxyValidator } from './validators/requestValidator.js';
import auth from './middlewares/authMiddleware.js';

const app = express();

// Trust top reverse proxy layer for accurate client IP identification (rate limiters)
app.set("trust proxy", 1);

// Security headers & CORS configuration
app.use(helmet());

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(url => url.trim())
  : [];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked this Origin: ${origin}`);
      callback(new Error('CORS blocked origin'), false);
    }
  },
  credentials: true
}));

// Body parsing and request logging
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

// Rate limiting for sensitive auth endpoints
app.use("/api/login", authRateLimiter);
app.use("/api/register", authRateLimiter);

// API proxy request execution pipeline
app.post('/api/request', apiRateLimiter, auth, requestProxyValidator, proxyRequestHandler);

// API route registrations
app.use('/api', authRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Backend is running securely' });
});

// Centralized error handling middleware (must remain last)
app.use(errorHandler);

export default app;