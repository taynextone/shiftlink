process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.APP_ORIGIN = 'http://localhost:3000';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/shiftlink?schema=public';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-secret-with-at-least-32-characters';
process.env.JWT_EXPIRES_IN = '7d';
process.env.AUTH_RATE_LIMIT_WINDOW_MS = '900000';
process.env.AUTH_RATE_LIMIT_MAX = '100';
process.env.S3_ENDPOINT = 'http://localhost:9000';
process.env.S3_REGION = 'eu-central-1';
process.env.S3_BUCKET = 'shiftlink-private';
process.env.S3_ACCESS_KEY = 'minioadmin';
process.env.S3_SECRET_KEY = 'minioadmin';
process.env.S3_FORCE_PATH_STYLE = 'true';
process.env.S3_SIGNED_URL_TTL_SECONDS = '900';
process.env.WHATSAPP_PROVIDER = 'mock';
process.env.NURSE_LOGIN_URL = 'https://app.shiftlink.example/login';

import request from 'supertest';
import { UserRole } from '@prisma/client';
import { createApp } from '../src/app';
import { signAuthToken } from '../src/utils/jwt';
import { AUTH_COOKIE_NAME } from '../src/utils/cookies';
import {
  hospitalAdminOnlyApiPaths,
  hospitalForbiddenApiPaths,
  nurseForbiddenApiPaths,
  superadminOnlyApiPaths,
  unauthenticatedApiBoundaries,
} from '../src/qa/regression-scenarios';

jest.mock('@prisma/client', () => {
  const actual = jest.requireActual('@prisma/client');
  return {
    ...actual,
    PrismaClient: jest.fn().mockImplementation(() => ({
      user: {
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
    })),
  };
});

jest.mock('../src/config/queues', () => ({
  billingQueue: { add: jest.fn() },
  whatsappQueue: { add: jest.fn() },
  webhookQueue: { add: jest.fn() },
}));

jest.mock('../src/config/prisma', () => ({
  prisma: {
    hospitalProfile: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
  },
}));

function authCookie(role: UserRole): string {
  const token = signAuthToken({ sub: `${role.toLowerCase()}_user`, role });
  return `${AUTH_COOKIE_NAME}=${token}`;
}

describe('phase 7 top workflow smoke coverage', () => {
  const app = createApp();

  it.each(unauthenticatedApiBoundaries)('keeps $method $path behind authentication', async ({ method, path }) => {
    const response = await request(app)[method.toLowerCase() as 'get'](path);

    expect(response.status).toBe(401);
  });

  it.each(nurseForbiddenApiPaths)('blocks nurses from hospital and superadmin operations at %s', async (path) => {
    const response = await request(app)
      .get(path)
      .set('Cookie', authCookie(UserRole.NURSE));

    expect(response.status).toBe(403);
  });

  it.each(hospitalForbiddenApiPaths)('blocks hospital admins from nurse-owned workflow at %s', async (path) => {
    const response = await request(app)
      .get(path)
      .set('Cookie', authCookie(UserRole.HOSPITAL_ADMIN));

    expect(response.status).toBe(403);
  });

  it.each(superadminOnlyApiPaths)('keeps superadmin-only workflow out of hospital-admin scope at %s', async (path) => {
    const response = await request(app)
      .get(path)
      .set('Cookie', authCookie(UserRole.HOSPITAL_ADMIN));

    expect(response.status).toBe(403);
  });

  it.each(hospitalAdminOnlyApiPaths)('keeps hospital-admin-only workflow out of superadmin scope at %s', async (path) => {
    const response = await request(app)
      .get(path)
      .set('Cookie', authCookie(UserRole.SUPER_ADMIN));

    expect(response.status).toBe(403);
  });

  it.each(hospitalAdminOnlyApiPaths)('lets hospital admins through the auth gate before scoped data lookup at %s', async (path) => {
    const response = await request(app)
      .get(path)
      .set('Cookie', authCookie(UserRole.HOSPITAL_ADMIN));

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Hospital profile not found');
  });

  it('keeps authenticated sessions introspectable for browser smoke tests', async () => {
    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', authCookie(UserRole.NURSE));

    expect(response.status).toBe(200);
    expect(response.body.auth).toEqual(
      expect.objectContaining({
        role: UserRole.NURSE,
        cookieName: AUTH_COOKIE_NAME,
      }),
    );
  });
});
