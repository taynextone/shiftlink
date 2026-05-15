import { Worker } from 'bullmq';
import { redis } from '../config/redis';
import { sendNewMatchOfferWhatsapp } from '../services/whatsapp.service';

export const whatsappWorker = new Worker(
  'whatsapp',
  async (job) => {
    if (job.name === 'new-match-offer-notification') {
      await sendNewMatchOfferWhatsapp(job.data);
    }
  },
  {
    connection: redis,
  },
);
