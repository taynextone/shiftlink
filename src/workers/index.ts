import { billingWorker } from './billing.worker';
import { whatsappWorker } from './whatsapp.worker';
import { webhookWorker } from './webhook.worker';
import { recordAsyncProcessFailure } from '../services/async-process.service';
import logger from '../config/logger';

export function startWorkers(): void {
  billingWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, jobName: job?.name, queue: 'billing', err }, 'Billing job failed');
    void recordAsyncProcessFailure({
      queueName: 'billing',
      jobName: job?.name ?? 'unknown',
      jobId: job?.id?.toString(),
      relatedEntityId: job?.data?.matchContractId ?? null,
      attemptCount: job?.attemptsMade ?? null,
      errorMessage: err.message,
    });
  });

  whatsappWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, jobName: job?.name, queue: 'whatsapp', err }, 'WhatsApp job failed');
    void recordAsyncProcessFailure({
      queueName: 'whatsapp',
      jobName: job?.name ?? 'unknown',
      jobId: job?.id?.toString(),
      relatedEntityId: job?.data?.matchContractId ?? null,
      attemptCount: job?.attemptsMade ?? null,
      errorMessage: err.message,
    });
  });

  webhookWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, jobName: job?.name, queue: 'webhook', err }, 'Webhook job failed');
    void recordAsyncProcessFailure({
      queueName: 'webhook',
      jobName: job?.name ?? 'unknown',
      jobId: job?.id?.toString(),
      relatedEntityId: job?.data?.webhookEventId ?? null,
      attemptCount: job?.attemptsMade ?? null,
      errorMessage: err.message,
    });
  });
}
