import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ZodError } from 'zod';
import healthRoutes from './routes/health.routes';
import { router as adminRoutes } from './routes/admin.routes';
import authRoutes from './routes/auth.routes';
import matchRoutes from './routes/match.routes';
import documentRoutes from './routes/document.routes';
import nurseProfileRoutes from './routes/nurse-profile.routes';
import nurseAvailabilityRoutes from './routes/nurse-availability.routes';
import jobShiftRoutes from './routes/job-shift.routes';
import { env } from './config/env';
import userRoutes from './routes/user.routes';
import path from 'path';
import { notFoundMiddleware } from './middlewares/not-found';
import { apiRateLimit } from './middlewares/rate-limit';
import { errorHandler } from './middlewares/error-handler';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", ...(env.NODE_ENV !== 'production' ? ['localhost:*'] : [])],
          styleSrc: ["'self'", "'unsafe-inline'", ...(env.NODE_ENV !== 'production' ? ['localhost:*'] : [])],
          imgSrc: ["'self'", 'data:', 'blob:', ...(env.NODE_ENV !== 'production' ? ['localhost:*'] : [])],
          connectSrc: ["'self'", ...(env.NODE_ENV !== 'production' ? ['localhost:*', 'ws://localhost:*'] : [])],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: true,
      crossOriginOpenerPolicy: true,
      crossOriginResourcePolicy: { policy: 'same-origin' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      strictTransportSecurity: env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
    }),
  );
  const allowedOrigins = new Set<string>();

  // Always allow configured origin
  allowedOrigins.add(env.APP_ORIGIN);

  // Parse additional origins from env
  const extraOrigins = (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  for (const o of extraOrigins) allowedOrigins.add(o);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        // Allow localhost on any port for development/test
        if (
          (env.NODE_ENV === 'development' || env.NODE_ENV === 'test') &&
          origin.match(/^http:\/\/localhost(:\d+)?$/)
        ) {
          return callback(null, true);
        }
        // Allow whitelisted origins
        if (allowedOrigins.has(origin)) return callback(null, true);
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Health check without rate limiting
  app.use('/api/v1', healthRoutes);
  app.use('/api/v1', apiRateLimit);
  app.use('/api/v1', adminRoutes);
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/matches', matchRoutes);
  app.use('/api/v1/documents', documentRoutes);
  app.use('/api/v1/nurse-profile', nurseProfileRoutes);
  app.use('/api/v1/nurse-availability', nurseAvailabilityRoutes);
  app.use('/api/v1/job-shifts', jobShiftRoutes);
  app.use('/api/v1/user', userRoutes);

  // Serve frontend static files
  const webDist = '/app/web/dist';
  app.use(express.static(webDist, { index: false, maxAge: '1d' }));

  // SPA fallback — serve index.html for non-API routes
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api/')) {
      res.sendFile(path.join(webDist, 'index.html'), (err) => {
        if (err) next(err);
      });
      return;
    }
    next();
  });

  app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof ZodError) {
      res.status(400).json({
        message: 'Validation failed',
        issues: err.flatten(),
      });
      return;
    }

    next(err);
  });

  app.use(notFoundMiddleware);
  app.use(errorHandler);

  return app;
}
