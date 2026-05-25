import crypto from 'node:crypto';
import { prisma } from '../config/prisma';
import { webhookQueue } from '../config/queues';
import { recordAsyncProcessFailure } from './async-process.service';

export async function createHospitalWebhookEvent(input: {
  hospitalProfileId: string;
  eventType: string;
  payload: unknown;
}) {
  const event = await prisma.webhookEvent.create({
    data: {
      hospitalProfileId: input.hospitalProfileId,
      eventType: input.eventType,
      payloadJson: JSON.stringify(input.payload),
    },
  });

  await webhookQueue.add(
    'deliver-webhook-event',
    { webhookEventId: event.id },
    {
      jobId: `webhook-event:${event.id}`,
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 30_000,
      },
      removeOnComplete: 500,
      removeOnFail: 500,
    },
  );

  return event;
}

export function buildWebhookSignature(payloadJson: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payloadJson).digest('hex');
}

export async function deliverHospitalWebhookEvent(webhookEventId: string): Promise<void> {
  const event = await prisma.webhookEvent.findUnique({
    where: { id: webhookEventId },
    include: {
      hospitalProfile: true,
    },
  });

  if (!event) {
    throw new Error(`Webhook event ${webhookEventId} not found`);
  }

  if (!event.hospitalProfile.webhookUrl || !event.hospitalProfile.webhookSecret) {
    await prisma.webhookEvent.update({
      where: { id: webhookEventId },
      data: {
        deliveryAttempts: { increment: 1 },
        lastAttemptAt: new Date(),
        lastError: 'Webhook destination is not configured',
      },
    });
    return;
  }

  const payloadJson = event.payloadJson;
  const signature = buildWebhookSignature(payloadJson, event.hospitalProfile.webhookSecret);

  const response = await fetch(event.hospitalProfile.webhookUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-shiftlink-event-type': event.eventType,
      'x-shiftlink-event-id': event.id,
      'x-shiftlink-signature': signature,
    },
    body: payloadJson,
  });

  if (!response.ok) {
    const body = await response.text();
    await prisma.webhookEvent.update({
      where: { id: webhookEventId },
      data: {
        deliveryAttempts: { increment: 1 },
        lastAttemptAt: new Date(),
        lastError: `HTTP ${response.status}: ${body}`.slice(0, 1000),
      },
    });
    throw new Error(`Webhook delivery failed with HTTP ${response.status}`);
  }

  await prisma.webhookEvent.update({
    where: { id: webhookEventId },
    data: {
      deliveryAttempts: { increment: 1 },
      lastAttemptAt: new Date(),
      deliveredAt: new Date(),
      lastError: null,
    },
  });
}


export async function retryWebhookEvent(webhookEventId: string): Promise<{ id: string; status: string }> {
  const event = await prisma.webhookEvent.findUnique({
    where: { id: webhookEventId },
    include: { hospitalProfile: true },
  });

  if (!event) {
    throw new Error(`Webhook event ${webhookEventId} not found`);
  }

  if (event.deliveredAt) {
    throw new Error('Webhook event has already been delivered');
  }

  if (!event.hospitalProfile.webhookUrl || !event.hospitalProfile.webhookSecret) {
    throw new Error('Webhook destination is not configured for this hospital');
  }

  // Re-enqueue the delivery job
  await webhookQueue.add(
    'deliver-webhook-event',
    { webhookEventId: event.id },
    {
      jobId: `webhook-event:${event.id}:retry:${Date.now()}`,
      attempts: 5,
      backoff: { type: 'exponential', delay: 30_000 },
      removeOnComplete: 500,
      removeOnFail: 500,
    },
  );

  // Clear the last error so the UI reflects the retry attempt
  const updated = await prisma.webhookEvent.update({
    where: { id: webhookEventId },
    data: { lastError: null },
  });

  return {
    id: updated.id,
    status: updated.deliveredAt ? 'DELIVERED' : updated.lastError ? 'FAILED_OR_PENDING_RETRY' : 'QUEUED',
  };
}

export async function listHospitalWebhookEvents(actor: { userId: string; role: string }, input?: { limit?: number }) {
  const limit = Math.min(Math.max(input?.limit ?? 25, 1), 100);

  const hospitalProfile = actor.role === 'SUPER_ADMIN'
    ? null
    : await prisma.hospitalProfile.findUnique({
        where: { userId: actor.userId },
      });

  if (actor.role !== 'SUPER_ADMIN' && !hospitalProfile) {
    throw new Error('Hospital profile not found');
  }

  const events = await prisma.webhookEvent.findMany({
    where: actor.role === 'SUPER_ADMIN' ? undefined : { hospitalProfileId: hospitalProfile!.id },
    include: {
      hospitalProfile: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });

  return {
    events: events.map((event) => ({
      id: event.id,
      hospitalProfileId: event.hospitalProfileId,
      clinicName: event.hospitalProfile.clinicName,
      eventType: event.eventType,
      deliveryAttempts: event.deliveryAttempts,
      lastAttemptAt: event.lastAttemptAt,
      deliveredAt: event.deliveredAt,
      lastError: event.lastError,
      createdAt: event.createdAt,
      status: event.deliveredAt ? 'DELIVERED' : event.lastError ? 'FAILED_OR_PENDING_RETRY' : 'QUEUED',
    })),
  };
}

