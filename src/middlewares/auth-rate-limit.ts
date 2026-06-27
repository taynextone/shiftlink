import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

function getClientIp(req: { ip?: string; headers: Record<string, unknown> }): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || 'unknown';
}

export const authRateLimit = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  max: () => {
    // In non-production, use a much higher limit for local testing
    if (env.NODE_ENV !== 'production') {
      return 1000;
    }
    return env.AUTH_RATE_LIMIT_MAX;
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req),
  message: {
    message: 'Too many auth requests, please try again later.',
  },
});
