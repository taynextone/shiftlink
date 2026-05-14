import { Request, Response, NextFunction } from 'express';
import createHttpError from 'http-errors';

export function notFoundMiddleware(_req: Request, _res: Response, next: NextFunction): void {
  next(createHttpError(404, 'Route not found'));
}
