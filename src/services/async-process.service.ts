import { prisma } from '../config/prisma';

export async function recordAsyncProcessFailure(input: {
  queueName: string;
  jobName: string;
  jobId?: string | null;
  relatedEntityId?: string | null;
  attemptCount?: number | null;
  errorMessage: string;
}) {
  await prisma.asyncProcessFailure.create({
    data: {
      queueName: input.queueName,
      jobName: input.jobName,
      jobId: input.jobId ?? null,
      relatedEntityId: input.relatedEntityId ?? null,
      attemptCount: input.attemptCount ?? null,
      errorMessage: input.errorMessage.slice(0, 1000),
    },
  });
}

export async function listAsyncProcessFailures(limit = 25) {
  const failures = await prisma.asyncProcessFailure.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    take: Math.min(Math.max(limit, 1), 100),
  });

  return {
    failures,
  };
}

export async function resolveAsyncFailure(id: string): Promise<{ id: string; resolved: boolean }> {
  const existing = await prisma.asyncProcessFailure.findUnique({ where: { id } });
  if (!existing) {
    throw new Error(`Async process failure ${id} not found`);
  }

  await prisma.asyncProcessFailure.delete({ where: { id } });

  return { id, resolved: true };
}
