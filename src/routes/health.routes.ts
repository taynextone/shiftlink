import { Router, Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { redis } from '../config/redis';
import { getQueueStatus } from '../workers/status';

const router = Router();

router.get('/health', async (_req: Request, res: Response) => {
  const checks: Record<string, { status: string; latencyMs?: number; error?: string; details?: string }> = {};

  // Database check
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: 'ok', latencyMs: Date.now() - dbStart };
  } catch (error) {
    checks.database = { status: 'error', error: error instanceof Error ? error.message : 'Unknown' };
  }

  // Redis check
  const redisStart = Date.now();
  try {
    await redis.ping();
    checks.redis = { status: 'ok', latencyMs: Date.now() - redisStart };
  } catch (error) {
    checks.redis = { status: 'error', error: error instanceof Error ? error.message : 'Unknown' };
  }

  // Queue check (with timeout)
  try {
    const queuePromise = getQueueStatus();
    const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Queue check timeout')), 5000));
    const queueStatus = await Promise.race([queuePromise, timeoutPromise]);
    checks.queue = { status: 'ok', latencyMs: 0, details: `${queueStatus.waiting} waiting, ${queueStatus.active} active, ${queueStatus.failed} failed` };
  } catch (error) {
    checks.queue = { status: 'degraded', error: error instanceof Error ? error.message : 'Unknown' };
  }

  // Overall status
  const allOk = Object.values(checks).every((c) => c.status === 'ok' || c.status === 'degraded');

  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'healthy' : 'degraded',
    version: process.env.npm_package_version ?? '0.1.0',
    timestamp: new Date().toISOString(),
    checks,
  });
});

export default router;
