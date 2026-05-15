import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ZodError } from 'zod';
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import matchRoutes from './routes/match.routes';
import documentRoutes from './routes/document.routes';
import { env } from './config/env';
import { notFoundMiddleware } from './middlewares/not-found';
import { errorHandler } from './middlewares/error-handler';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin: env.APP_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.use('/api/v1', healthRoutes);
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/matches', matchRoutes);
  app.use('/api/v1/documents', documentRoutes);

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
