import { billingWorker } from './billing.worker';
import { whatsappWorker } from './whatsapp.worker';

export function startWorkers(): void {
  billingWorker.on('failed', (job, err) => {
    console.error(`Billing job ${job?.id ?? 'unknown'} failed`, err);
  });

  whatsappWorker.on('failed', (job, err) => {
    console.error(`WhatsApp job ${job?.id ?? 'unknown'} failed`, err);
  });
}
