import { Response } from 'express';
import { env } from '../config/env';

const AUTH_COOKIE_NAME = 'shiftlink_token';

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export { AUTH_COOKIE_NAME };
