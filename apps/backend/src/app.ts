import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './core/config/swagger';
import { errorHandler } from './api/v1/middlewares/error.middleware';
import { notFoundHandler } from './api/v1/middlewares/notFound.middleware';
import { registerRoutes } from './api/v1/routes';
import logger from './core/logger';

export function createApp(): Application {
  const app = express();
  app.set('trust proxy', 1);

  // Trust proxy (required when behind Nginx)
  app.set('trust proxy', 1);

  // ─── Security Headers ─────────────────────────────────────────────────────
  app.use(helmet({
    contentSecurityPolicy: false, // Handled by frontend
    crossOriginEmbedderPolicy: false,
  }));

  // ─── CORS ──────────────────────────────────────────────────────────────────
  app.use(cors({
    origin: process.env.FRONTEND_URL?.split(',') || ['http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Device-ID'],
  }));

  // ─── Request Parsing ───────────────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());
  app.use(compression());

  // ─── Logging ───────────────────────────────────────────────────────────────
  app.use(morgan('combined', {
    stream: { write: (message) => logger.http(message.trim()) },
    skip: (req) => req.url === '/health',
  }));

  // ─── Global Rate Limiting ─────────────────────────────────────────────────
  app.use('/api/', rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Quá nhiều yêu cầu, vui lòng thử lại sau.' },
  }));

  // ─── Health Check ──────────────────────────────────────────────────────────
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
  });

  // ─── Swagger Docs ─────────────────────────────────────────────────────────
  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui.min.css',
    customSiteTitle: 'GreenCash API Docs',
  }));

  // ─── API Routes ───────────────────────────────────────────────────────────
  registerRoutes(app);

  // ─── 404 Handler ──────────────────────────────────────────────────────────
  app.use(notFoundHandler);

  // ─── Global Error Handler ─────────────────────────────────────────────────
  app.use(errorHandler);

  return app;
}
