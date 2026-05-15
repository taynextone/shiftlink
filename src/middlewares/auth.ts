import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import createHttpError from 'http-errors';
import { UserRole } from '@prisma/client';
import { env } from '../config/env';
import { AUTH_COOKIE_NAME } from '../utils/cookies';

type JwtPayload = {
  sub: string;
  role: UserRole;
};

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies[AUTH_COOKIE_NAME] as string | undefined;

  if (!token) {
    next(createHttpError(401, 'Authentication required'));
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.auth = {
      userId: payload.sub,
      role: payload.role,
    };
    next();
  } catch {
    next(createHttpError(401, 'Invalid or expired authentication token'));
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      next(createHttpError(401, 'Authentication required'));
      return;
    }

    if (!roles.includes(req.auth.role)) {
      next(createHttpError(403, 'Insufficient permissions'));
      return;
    }

    next();
  };
}
