import { Worker } from 'bullmq';
import { redis } from '../config/redis';
import { sendWhatsappTemplateNotification } from '../services/whatsapp.service';

export const whatsappWorker = new Worker(
  'whatsapp',
  async (job) => {
    if (
      job.name === 'signed-match-notification' ||
      job.name === 'new-match-offer-notification' ||
      job.name === 'match-declined-notification'
    ) {
      await sendWhatsappTemplateNotification(job.data);
    }
  },
  {
    connection: redis,
  },
);
