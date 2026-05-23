import { billingWorker } from './billing.worker';
import { whatsappWorker } from './whatsapp.worker';
import { webhookWorker } from './webhook.worker';
import { recordAsyncProcessFailure } from '../services/async-process.service';

export function startWorkers(): void {
  billingWorker.on('failed', (job, err) => {
    console.error(`Billing job ${job?.id ?? 'unknown'} failed`, err);
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
    console.error(`WhatsApp job ${job?.id ?? 'unknown'} failed`, err);
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
    console.error(`Webhook job ${job?.id ?? 'unknown'} failed`, err);
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
