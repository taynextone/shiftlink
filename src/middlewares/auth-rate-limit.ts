import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

export const authRateLimit = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many auth requests, please try again later.',
  },
});
