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
import { errorHandler } from './middlewares/error-handler';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        // Allow localhost on any port for development
        if (origin.match(/^http:\/\/localhost(:\d+)?$/)) return callback(null, true);
        // Allow configured origin
        if (origin === env.APP_ORIGIN) return callback(null, true);
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.use('/api/v1', healthRoutes);
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
