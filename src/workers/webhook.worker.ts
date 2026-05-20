import { Worker } from 'bullmq';
import { redis } from '../config/redis';
import { deliverHospitalWebhookEvent } from '../services/webhook.service';

export const webhookWorker = new Worker(
  'webhook',
  async (job) => {
    if (job.name === 'deliver-webhook-event') {
      await deliverHospitalWebhookEvent(job.data.webhookEventId);
    }
  },
  {
    connection: redis,
  },
);
