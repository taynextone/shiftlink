import { Request, Response, NextFunction } from 'express';
import { isHttpError } from 'http-errors';
import { env } from '../config/env';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  const isProd = env.NODE_ENV === 'production';

  if (isHttpError(err)) {
    res.status(err.statusCode).json({
      message: err.message,
      ...(isProd ? {} : { stack: err.stack }),
    });
    return;
  }

  const fallback = err instanceof Error ? err : new Error('Internal server error');

  res.status(500).json({
    message: 'Internal server error',
    ...(isProd ? {} : { stack: fallback.stack }),
  });
}
