import crypto from 'node:crypto';
import { prisma } from '../config/prisma';
import { webhookQueue } from '../config/queues';

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
