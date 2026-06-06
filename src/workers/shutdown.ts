import { billingWorker } from './billing.worker';
import { whatsappWorker } from './whatsapp.worker';
import { webhookWorker } from './webhook.worker';

export async function stopWorkers(): Promise<void> {
  await Promise.all([
    billingWorker.close(),
    whatsappWorker.close(),
    webhookWorker.close(),
  ]);
}
