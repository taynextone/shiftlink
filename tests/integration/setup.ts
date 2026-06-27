/**
 * Integration test setup — loads .env.test, verifies connectivity,
 * and provides shared helpers for Supertest against createApp().
 *
 * Requires running PostgreSQL + Redis (see docker-compose.dev.yml).
 * Skips gracefully if DATABASE_URL is unreachable.
 */

import { config as loadEnv } from 'dotenv';
import { existsSync } from 'fs';
import path from 'path';

// Load .env.test if present, fall back to .env
const envFile = existsSync(path.resolve(__dirname, '../../.env.test'))
  ? '.env.test'
  : '.env';
loadEnv({ path: path.resolve(__dirname, '../../', envFile) });

process.env.NODE_ENV = 'test';

export async function assertInfrastructure(): Promise<boolean> {
  try {
    const { prisma } = await import('../../src/config/prisma');
    await prisma.$queryRaw`SELECT 1`;
    const { redis } = await import('../../src/config/redis');
    await redis.ping();
    return true;
  } catch {
    return false;
  }
}
