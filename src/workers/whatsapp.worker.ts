import { Worker } from 'bullmq';
import { redis } from '../config/redis';
import { enqueueSignedMatchWhatsappNotification } from '../services/whatsapp.service';

export const whatsappWorker = new Worker(
  'whatsapp',
  async (job) => {
    if (job.name === 'signed-match-notification') {
      await enqueueSignedMatchWhatsappNotification(job.data.matchContractId);
    }
  },
  {
    connection: redis,
  },
);
