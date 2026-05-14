import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import healthRoutes from './routes/health.routes';
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

  app.use(notFoundMiddleware);
  app.use(errorHandler);

  return app;
}
