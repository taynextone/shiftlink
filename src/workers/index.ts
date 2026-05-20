import { billingWorker } from './billing.worker';
import { whatsappWorker } from './whatsapp.worker';
import { webhookWorker } from './webhook.worker';

export function startWorkers(): void {
  billingWorker.on('failed', (job, err) => {
    console.error(`Billing job ${job?.id ?? 'unknown'} failed`, err);
  });

  whatsappWorker.on('failed', (job, err) => {
    console.error(`WhatsApp job ${job?.id ?? 'unknown'} failed`, err);
  });

  webhookWorker.on('failed', (job, err) => {
    console.error(`Webhook job ${job?.id ?? 'unknown'} failed`, err);
  });
}
