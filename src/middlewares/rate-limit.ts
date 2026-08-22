import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '900000', 10);
const max = parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10);

export const apiRateLimit = rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    const fwd = req.headers['x-forwarded-for'];
    if (typeof fwd === 'string' && fwd.length > 0) {
      // ipKeyGenerator handles IPv6-mapped IPv4 addresses correctly
      return ipKeyGenerator(fwd.split(',')[0].trim());
    }
    return req.ip || 'unknown';
  },
  message: {
    message: 'Too many requests, please try again later.',
  },
});
