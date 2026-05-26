import { Router, Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { getQueueStatus } from '../workers/status';

const router = Router();

router.get('/health', async (_req: Request, res: Response) => {
  const checks: Record<string, { status: string; latencyMs?: number; error?: string }> = {};

  // Database check
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: 'ok', latencyMs: Date.now() - dbStart };
  } catch (error) {
    checks.database = { status: 'error', error: error instanceof Error ? error.message : 'Unknown' };
  }

  // Queue check
  try {
    const queueStatus = await getQueueStatus();
    checks.queue = { status: 'ok', latencyMs: 0 };
    checks.queueDetails = { status: `${queueStatus.waiting} waiting, ${queueStatus.active} active, ${queueStatus.failed} failed` };
  } catch (error) {
    checks.queue = { status: 'error', error: error instanceof Error ? error.message : 'Unknown' };
  }

  // Overall status
  const allOk = Object.values(checks).every((c) => c.status === 'ok');

  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'healthy' : 'degraded',
    version: process.env.npm_package_version ?? 'unknown',
    timestamp: new Date().toISOString(),
    checks,
  });
});

export default router;
