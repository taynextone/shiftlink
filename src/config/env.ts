import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

loadEnv();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  APP_ORIGIN: z.string().url(),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET should be at least 32 characters long'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  S3_FORCE_PATH_STYLE: z.coerce.boolean().default(true),
  S3_SIGNED_URL_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  NURSE_LOGIN_URL: z.string().url().optional(),
  WHATSAPP_PROVIDER: z.enum(['mock', 'twilio']).default('mock'),
  WHATSAPP_FROM_NUMBER: z.string().min(1).optional(),
  TWILIO_ACCOUNT_SID: z.string().min(1).optional(),
  TWILIO_AUTH_TOKEN: z.string().min(1).optional(),
}).superRefine((value, ctx) => {
  if (value.WHATSAPP_PROVIDER === 'twilio') {
    if (!value.WHATSAPP_FROM_NUMBER) {
      ctx.addIssue({ code: 'custom', path: ['WHATSAPP_FROM_NUMBER'], message: 'WHATSAPP_FROM_NUMBER is required when WHATSAPP_PROVIDER=twilio' });
    }
    if (!value.TWILIO_ACCOUNT_SID) {
      ctx.addIssue({ code: 'custom', path: ['TWILIO_ACCOUNT_SID'], message: 'TWILIO_ACCOUNT_SID is required when WHATSAPP_PROVIDER=twilio' });
    }
    if (!value.TWILIO_AUTH_TOKEN) {
      ctx.addIssue({ code: 'custom', path: ['TWILIO_AUTH_TOKEN'], message: 'TWILIO_AUTH_TOKEN is required when WHATSAPP_PROVIDER=twilio' });
    }
  }
});

export const env = envSchema.parse(process.env);
