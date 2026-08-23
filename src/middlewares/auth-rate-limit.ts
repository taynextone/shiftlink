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

/**
 * Strengeres Limit für den MOS-Connect-Endpoint: hier werden MOS-Credentials
 * geprüft, also Brute-Force-Schutz deutlich enger als beim normalen Login.
 * Fehlversuche zählen pro IP; erfolgreiche Verbindungen konsumieren das
 * Kontingent ebenfalls (einfach & sicher).
 */
export const mosConnectRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: () => (env.NODE_ENV !== "production" ? 100 : 5),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req),
  message: {
    message: "Zu viele Verbindungsversuche. Bitte in 15 Minuten erneut versuchen.",
  },
});

// Strenges Limit für den SSO-Start (öffentlicher Einstiegspunkt für Redirect-Flow)
export const mosSsoRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: () => (env.NODE_ENV !== "production" ? 200 : 20),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req),
  message: {
    message: "Zu viele SSO-Versuche. Bitte in 10 Minuten erneut versuchen.",
  },
});
